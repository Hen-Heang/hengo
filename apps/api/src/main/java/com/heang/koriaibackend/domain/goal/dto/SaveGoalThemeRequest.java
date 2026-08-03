package com.heang.koriaibackend.domain.goal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveGoalThemeRequest(
        @NotBlank @Size(max = 200) String name,
        String goalProfileImage,
        String cardBackgroundImage,
        String pageBackgroundImage,
        Boolean isPublic
) {
}
