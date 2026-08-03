package com.heang.koriaibackend.domain.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SendChatMessageRequest(
        @NotNull Long conversationId,
        @NotBlank String message
) {
}
