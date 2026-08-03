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
public class GoalNotification {
    private UUID id;
    private String type;
    private UUID goalId;
    private Long senderId;
    private Long receiverId;
    /** jsonb, stored as text. */
    private String payload;
    private String invitationStatus;
    private OffsetDateTime readAt;
    private OffsetDateTime date;
    private String url;
    private OffsetDateTime createdAt;
    // Enriched (joined) fields for listing.
    private String senderDisplayName;
    private String goalTitle;
}
