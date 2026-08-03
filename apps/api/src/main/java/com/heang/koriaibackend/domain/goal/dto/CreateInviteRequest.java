package com.heang.koriaibackend.domain.goal.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateInviteRequest(
        @NotNull UUID goalId,
        @NotNull Long receiverUserId
) {
}
