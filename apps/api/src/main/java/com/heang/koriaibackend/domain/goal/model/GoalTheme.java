package com.heang.koriaibackend.domain.goal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalTheme {
    private UUID id;
    private Long userId;
    private String name;
    private String goalProfileImage;
    private String cardBackgroundImage;
    private String pageBackgroundImage;
    /** Maps to column is_public (avoids Lombok/MyBatis is-prefix pitfall). */
    private boolean publicTheme;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
