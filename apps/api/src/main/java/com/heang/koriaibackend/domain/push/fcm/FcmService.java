package com.heang.koriaibackend.domain.push.fcm;

import com.heang.koriaibackend.domain.push.dto.RegisterDeviceRequest;
import com.heang.koriaibackend.domain.push.mapper.UserDeviceMapper;
import com.heang.koriaibackend.domain.push.model.UserDevice;
import com.heang.koriaibackend.domain.push.service.PushMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FcmService {

    private final UserDeviceMapper deviceMapper;

    public boolean isConfigured() {
        return false;
    }

    public void registerDevice(Long userId, RegisterDeviceRequest req) {
        UserDevice device = UserDevice.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .fcmToken(req.token())
                .platform(req.platform())
                .build();
        deviceMapper.upsert(device);
    }

    public void unregisterDevice(String token) {
        if (token != null && !token.isBlank()) {
            deviceMapper.deleteByToken(token);
        }
    }

    public void sendToUser(Long userId, PushMessage message) {
        // FCM dependency removed; channel is disabled
    }
}
