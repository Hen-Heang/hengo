package com.heang.koriaibackend.domain.goal.dto;

import com.heang.koriaibackend.domain.goal.model.GoalNotification;

import java.util.UUID;

public record GoalNotificationResponse(
        UUID id,
        String type,
        UUID goalId,
        Long senderId,
        Long receiverId,
        String invitationStatus,
        boolean read,
        String url,
        String senderDisplayName,
        String goalTitle,
        String createdAt
) {
    public static GoalNotificationResponse of(GoalNotification n) {
        return new GoalNotificationResponse(
                n.getId(),
                n.getType(),
                n.getGoalId(),
                n.getSenderId(),
                n.getReceiverId(),
                n.getInvitationStatus(),
                n.getReadAt() != null,
                n.getUrl(),
                n.getSenderDisplayName(),
                n.getGoalTitle(),
                n.getCreatedAt() != null ? n.getCreatedAt().toString() : null
        );
    }
}
