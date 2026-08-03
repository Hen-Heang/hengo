package com.heang.koriaibackend.domain.users.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    private Long id;
    private String email;
    private String passwordHash;
    private String displayName;
    private String koreanLevel;
    private String preferredModel;
    private String country;
    private String nativeLanguage;
    private String occupation;
    private Integer yearsOfExperience;
    private String learningGoal;
    private String profileImageContentType;
    private byte[] profileImageData;
    private boolean hasProfileImage;
    private boolean studyRemindersEnabled;
    private Integer studyReminderHour;
    private int vocabBestStreak;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
