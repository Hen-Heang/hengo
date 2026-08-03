package com.heang.koriaibackend.domain.push.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.push.dto.RegisterDeviceRequest;
import com.heang.koriaibackend.domain.push.dto.TelegramLinkResponse;
import com.heang.koriaibackend.domain.push.dto.WebPushSubscriptionRequest;
import com.heang.koriaibackend.domain.push.fcm.FcmService;
import com.heang.koriaibackend.domain.push.telegram.TelegramService;
import com.heang.koriaibackend.domain.push.webpush.WebPushService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * User-facing push management. Authenticated (default security rule). Telegram
 * linking lives here; Web Push / FCM endpoints will be added alongside their
 * channels.
 */
@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {

    private final TelegramService telegramService;
    private final WebPushService webPushService;
    private final FcmService fcmService;

    /** Start linking Telegram: returns a t.me deep link for the current user. */
    @PostMapping("/telegram/link")
    public ApiResponse<TelegramLinkResponse> linkTelegram() {
        return ApiResponse.success(telegramService.createLink(SecurityUtils.currentUserId()));
    }

    @GetMapping("/telegram/status")
    public ApiResponse<Map<String, Boolean>> telegramStatus() {
        boolean linked = telegramService.isLinked(SecurityUtils.currentUserId());
        return ApiResponse.success(Map.of("linked", linked));
    }

    @DeleteMapping("/telegram")
    public ApiResponse<Void> unlinkTelegram() {
        telegramService.unlink(SecurityUtils.currentUserId());
        return ApiResponse.success(null);
    }

    // --- Web Push (browser) -------------------------------------------------

    /** VAPID public key the browser needs to create a push subscription. */
    @GetMapping("/web/vapid-public-key")
    public ApiResponse<Map<String, String>> vapidPublicKey() {
        return ApiResponse.success(Map.of("publicKey", webPushService.publicKey()));
    }

    /** Register (or refresh) the current browser's push subscription. */
    @PostMapping("/web/subscribe")
    public ApiResponse<Void> subscribeWeb(@Valid @RequestBody WebPushSubscriptionRequest req) {
        webPushService.subscribe(SecurityUtils.currentUserId(), req);
        return ApiResponse.success(null);
    }

    /** Remove a browser subscription by its endpoint. */
    @PostMapping("/web/unsubscribe")
    public ApiResponse<Void> unsubscribeWeb(@RequestBody Map<String, String> body) {
        webPushService.unsubscribe(body.get("endpoint"));
        return ApiResponse.success(null);
    }

    // --- FCM (mobile) -------------------------------------------------------

    /** Register this device's FCM token for the current user. */
    @PostMapping("/devices")
    public ApiResponse<Void> registerDevice(@Valid @RequestBody RegisterDeviceRequest req) {
        fcmService.registerDevice(SecurityUtils.currentUserId(), req);
        return ApiResponse.success(null);
    }

    /** Unregister an FCM token (e.g. on logout). */
    @PostMapping("/devices/unregister")
    public ApiResponse<Void> unregisterDevice(@RequestBody Map<String, String> body) {
        fcmService.unregisterDevice(body.get("token"));
        return ApiResponse.success(null);
    }
}
