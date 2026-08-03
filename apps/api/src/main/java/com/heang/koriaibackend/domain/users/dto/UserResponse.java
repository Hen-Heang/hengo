package com.heang.koriaibackend.domain.users.dto;

import com.heang.koriaibackend.domain.users.model.User;

import java.time.OffsetDateTime;

public record UserResponse(
        Long id,
        String email,
        String displayName,
        String koreanLevel,
        String preferredModel,
        String country,
        String nativeLanguage,
        String occupation,
        Integer yearsOfExperience,
        String learningGoal,
        boolean hasProfileImage,
        boolean studyRemindersEnabled,
        Integer studyReminderHour,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getKoreanLevel(),
                user.getPreferredModel(),
                user.getCountry(),
                user.getNativeLanguage(),
                user.getOccupation(),
                user.getYearsOfExperience(),
                user.getLearningGoal(),
                user.isHasProfileImage(),
                user.isStudyRemindersEnabled(),
                user.getStudyReminderHour(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
