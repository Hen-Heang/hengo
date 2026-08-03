package com.heang.koriaibackend.domain.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Body for renaming a conversation (PUT /api/chat/conversations/{id}). */
public record RenameConversationRequest(@NotBlank @Size(max = 200) String title) {
}
