package com.heang.koriaibackend.domain.users.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserProfileRequest(
        @NotBlank @Size(max = 100) String displayName,
        @NotBlank @Size(max = 20) String koreanLevel,
        // Optional learner-profile fields (collected by the Settings form). Used to
        // personalize AI prompts. Null = leave unchanged; blank = clear.
        @Size(max = 100) String country,
        @Size(max = 60) String nativeLanguage,
        @Size(max = 100) String occupation,
        @Min(0) @Max(80) Integer yearsOfExperience,
        @Size(max = 200) String learningGoal
) {
}
