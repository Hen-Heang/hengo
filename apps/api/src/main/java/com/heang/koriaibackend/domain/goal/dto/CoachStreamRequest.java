package com.heang.koriaibackend.domain.goal.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

/**
 * A turn in the per-goal AI coach chat. The chat is ephemeral (not persisted):
 * the client sends recent {@code history} each turn so the coach has context.
 */
public record CoachStreamRequest(
        @NotBlank String message,
        List<CoachMessage> history
) {
    /** role is "user" or "assistant". */
    public record CoachMessage(String role, String content) {
    }
}
