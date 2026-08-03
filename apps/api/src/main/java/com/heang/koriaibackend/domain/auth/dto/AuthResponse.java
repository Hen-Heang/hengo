package com.heang.koriaibackend.domain.auth.dto;

import com.heang.koriaibackend.domain.users.model.User;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        Long userId,
        String email,
        String displayName,
        String koreanLevel,
        String preferredModel
) {
    public static AuthResponse of(String accessToken, String refreshToken, User user) {
        return new AuthResponse(
                accessToken,
                refreshToken,
                "Bearer",
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getKoreanLevel(),
                user.getPreferredModel()
        );
    }
}
