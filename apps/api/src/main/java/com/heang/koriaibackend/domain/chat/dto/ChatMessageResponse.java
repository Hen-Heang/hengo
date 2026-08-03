package com.heang.koriaibackend.domain.chat.dto;

import com.heang.koriaibackend.domain.chat.model.Message;

import java.time.OffsetDateTime;

public record ChatMessageResponse(
        Long id,
        String role,
        String content,
        Integer tokensUsed,
        OffsetDateTime createdAt
) {
    public static ChatMessageResponse from(Message message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getRole(),
                message.getContent(),
                message.getTokensUsed(),
                message.getCreatedAt()
        );
    }
}
