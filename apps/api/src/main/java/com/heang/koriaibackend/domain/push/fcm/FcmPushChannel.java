package com.heang.koriaibackend.domain.push.fcm;

import com.heang.koriaibackend.domain.push.service.PushChannel;
import com.heang.koriaibackend.domain.push.service.PushMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * {@link PushChannel} adapter for FCM. Sending and configuration live in
 * {@link FcmService}; this is the thin discovery point for the dispatcher.
 */
@Component
@RequiredArgsConstructor
public class FcmPushChannel implements PushChannel {

    private final FcmService fcmService;

    @Override
    public String name() {
        return "fcm";
    }

    @Override
    public boolean isConfigured() {
        return fcmService.isConfigured();
    }

    @Override
    public void send(Long userId, PushMessage message) {
        fcmService.sendToUser(userId, message);
    }
}
