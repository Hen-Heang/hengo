package com.heang.koriaibackend.domain.push.webpush;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heang.koriaibackend.domain.push.dto.WebPushSubscriptionRequest;
import com.heang.koriaibackend.domain.push.mapper.PushSubscriptionMapper;
import com.heang.koriaibackend.domain.push.model.PushSubscription;
import com.heang.koriaibackend.domain.push.service.PushMessage;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Security;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Web Push (VAPID) delivery. Holds the configured {@link PushService} and the
 * subscription registry. Self-disables when VAPID keys are absent so the app
 * runs fine without browser push configured.
 *
 * Generate a VAPID key pair once (e.g. {@code npx web-push generate-vapid-keys})
 * and set webpush.vapid.public-key / private-key. The public key is also handed
 * to the browser to create subscriptions.
 */
@Slf4j
@Service
public class WebPushService {

    private final PushSubscriptionMapper subscriptionMapper;
    private final ObjectMapper objectMapper;
    private final String publicKey;
    private final String privateKey;
    private final String subject;
    private final String frontendBaseUrl;

    private PushService pushService;

    public WebPushService(PushSubscriptionMapper subscriptionMapper,
                          ObjectMapper objectMapper,
                          @Value("${webpush.vapid.public-key:}") String publicKey,
                          @Value("${webpush.vapid.private-key:}") String privateKey,
                          @Value("${webpush.vapid.subject:mailto:admin@koriai.app}") String subject,
                          @Value("${app.frontend-base-url:}") String frontendBaseUrl) {
        this.subscriptionMapper = subscriptionMapper;
        this.objectMapper = objectMapper;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.subject = subject;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @PostConstruct
    void init() {
        if (publicKey.isBlank() || privateKey.isBlank()) {
            log.info("Web Push disabled (no VAPID keys configured)");
            return;
        }
        try {
            if (Security.getProvider("BC") == null) {
                Security.addProvider(new BouncyCastleProvider());
            }
            this.pushService = new PushService(publicKey, privateKey, subject);
            log.info("Web Push enabled");
        } catch (Exception e) {
            log.error("Failed to initialize Web Push; channel disabled: {}", e.getMessage());
            this.pushService = null;
        }
    }

    public boolean isConfigured() {
        return pushService != null;
    }

    /** The VAPID public key the browser needs to create a subscription. */
    public String publicKey() {
        return publicKey;
    }

    public void subscribe(Long userId, WebPushSubscriptionRequest req) {
        PushSubscription sub = PushSubscription.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .endpoint(req.endpoint())
                .p256dh(req.keys().p256dh())
                .auth(req.keys().auth())
                .build();
        subscriptionMapper.upsert(sub);
    }

    public void unsubscribe(String endpoint) {
        if (endpoint != null && !endpoint.isBlank()) {
            subscriptionMapper.deleteByEndpoint(endpoint);
        }
    }

    /**
     * Send to all of a user's browser subscriptions. Stale endpoints (HTTP
     * 404/410) are pruned. Each subscription is attempted independently.
     */
    public void sendToUser(Long userId, PushMessage message) {
        if (!isConfigured()) {
            return;
        }
        List<PushSubscription> subs = subscriptionMapper.findByUserId(userId);
        if (subs.isEmpty()) {
            return;
        }
        byte[] payload = buildPayload(message);
        for (PushSubscription sub : subs) {
            try {
                Notification notification =
                        new Notification(sub.getEndpoint(), sub.getP256dh(), sub.getAuth(), payload);
                HttpResponse response = pushService.send(notification);
                int status = response.getStatusLine().getStatusCode();
                if (status == 404 || status == 410) {
                    subscriptionMapper.deleteByEndpoint(sub.getEndpoint());
                } else if (status >= 400) {
                    log.warn("Web Push send returned {} for user {}", status, userId);
                }
            } catch (Exception e) {
                log.warn("Web Push send failed for user {}: {}", userId, e.getMessage());
            }
        }
    }

    private byte[] buildPayload(PushMessage message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("title", message.title());
        body.put("body", message.body());
        body.put("url", absoluteUrl(message.url()));
        try {
            return objectMapper.writeValueAsBytes(body);
        } catch (Exception e) {
            return ("{\"title\":\"" + message.title() + "\"}").getBytes();
        }
    }

    private String absoluteUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        if (frontendBaseUrl.isBlank()) {
            return url; // relative path; the service worker resolves against its origin
        }
        String base = frontendBaseUrl.endsWith("/")
                ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
                : frontendBaseUrl;
        return url.startsWith("/") ? base + url : base + "/" + url;
    }
}
