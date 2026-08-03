package com.heang.koriaibackend.domain.push.webpush;

import com.heang.koriaibackend.domain.push.service.PushChannel;
import com.heang.koriaibackend.domain.push.service.PushMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * {@link PushChannel} adapter for Web Push. The actual sending and configuration
 * live in {@link WebPushService}; this is the thin discovery point for the
 * dispatcher fan-out.
 */
@Component
@RequiredArgsConstructor
public class WebPushChannel implements PushChannel {

    private final WebPushService webPushService;

    @Override
    public String name() {
        return "webpush";
    }

    @Override
    public boolean isConfigured() {
        return webPushService.isConfigured();
    }

    @Override
    public void send(Long userId, PushMessage message) {
        webPushService.sendToUser(userId, message);
    }
}
