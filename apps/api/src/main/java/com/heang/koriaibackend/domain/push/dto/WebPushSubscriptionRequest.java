package com.heang.koriaibackend.domain.push.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Mirrors the shape of the browser's {@code PushSubscription.toJSON()} so the
 * frontend can POST the subscription object verbatim.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record WebPushSubscriptionRequest(
        @NotBlank String endpoint,
        @NotNull Keys keys
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Keys(@NotBlank String p256dh, @NotBlank String auth) {
    }
}
