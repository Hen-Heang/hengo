package com.heang.koriaibackend.domain.goal.dto;

import com.heang.koriaibackend.domain.goal.model.GoalMember;

import java.util.UUID;

public record GoalMemberResponse(
        UUID id,
        UUID goalId,
        Long userId,
        String role,
        String displayName,
        String email,
        String joinedAt,
        String lastSeen
) {
    public static GoalMemberResponse of(GoalMember m) {
        return new GoalMemberResponse(
                m.getId(),
                m.getGoalId(),
                m.getUserId(),
                m.getRole(),
                m.getDisplayName(),
                m.getEmail(),
                m.getJoinedAt() != null ? m.getJoinedAt().toString() : null,
                m.getLastSeen() != null ? m.getLastSeen().toString() : null
        );
    }
}
