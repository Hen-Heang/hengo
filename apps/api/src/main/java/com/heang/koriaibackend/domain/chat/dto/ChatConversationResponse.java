package com.heang.koriaibackend.domain.chat.dto;

import com.heang.koriaibackend.domain.chat.model.Conversation;

import java.time.OffsetDateTime;

public record ChatConversationResponse(
        Long id,
        String title,
        String conversationType,
        String modelUsed,
        Integer messageCount,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ChatConversationResponse from(Conversation conversation) {
        return new ChatConversationResponse(
                conversation.getId(),
                conversation.getTitle(),
                conversation.getConversationType(),
                conversation.getModelUsed(),
                conversation.getMessageCount(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt()
        );
    }
}
