package com.heang.koriaibackend.domain.achievements.model;

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
public class UserAchievement {
    private Long id;
    private Long userId;
    private String achievementCode;
    private OffsetDateTime unlockedAt;
}
