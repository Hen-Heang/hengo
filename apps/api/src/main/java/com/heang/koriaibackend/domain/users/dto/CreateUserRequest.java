package com.heang.koriaibackend.domain.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 255) String password,
        @NotBlank @Size(max = 100) String displayName,
        @NotBlank @Size(max = 20) String koreanLevel,
        @NotBlank @Size(max = 100) String preferredModel
) {
}
