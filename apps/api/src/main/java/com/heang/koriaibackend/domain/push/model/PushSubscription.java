package com.heang.koriaibackend.domain.push.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * A browser Web Push subscription (one per browser/device). {@code endpoint} is
 * the push service URL; {@code p256dh} and {@code auth} are the client encryption
 * keys produced by the browser's PushManager.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PushSubscription {
    private UUID id;
    private Long userId;
    private String endpoint;
    private String p256dh;
    private String auth;
    private OffsetDateTime createdAt;
}
