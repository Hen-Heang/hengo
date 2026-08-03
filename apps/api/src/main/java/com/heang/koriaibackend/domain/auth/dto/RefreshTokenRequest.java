package com.heang.koriaibackend.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for {@code POST /api/auth/refresh} and {@code POST /api/auth/logout}.
 *
 * @param refreshToken the raw refresh token previously issued at login/register.
 */
public record RefreshTokenRequest(
        @NotBlank String refreshToken
) {
}
