package com.heang.koriaibackend.security.model;

public record AuthUser(
        Long userId,
        String email
) {
}
