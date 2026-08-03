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
public class GoalMember {
    private UUID id;
    private UUID goalId;
    private Long userId;
    private String role;
    private OffsetDateTime joinedAt;
    private OffsetDateTime lastSeen;
    // Joined from users for display.
    private String displayName;
    private String email;
}
