package com.heang.koriaibackend.domain.push.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Register a device's FCM registration token. {@code platform} is optional
 * ("android" / "ios" / "web").
 */
public record RegisterDeviceRequest(
        @NotBlank String token,
        String platform
) {
}
