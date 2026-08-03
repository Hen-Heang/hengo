package com.heang.koriaibackend.domain.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateChatConversationRequest(
        Long scenarioId,
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 50) String conversationType
) {
}
