package com.heang.koriaibackend.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for {@code POST /api/auth/google}.
 *
 * @param idToken the Google ID token (JWT) obtained on the frontend via Google Identity Services.
 */
public record GoogleLoginRequest(
        @NotBlank String idToken
) {
}
