package com.heang.koriaibackend.domain.push.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * A mobile device registered for FCM push. {@code fcmToken} is the registration
 * token issued by Firebase on the client; {@code platform} is an optional hint
 * ("android" / "ios" / "web").
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDevice {
    private UUID id;
    private Long userId;
    private String fcmToken;
    private String platform;
    private OffsetDateTime createdAt;
}
