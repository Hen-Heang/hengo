package com.heang.koriaibackend.domain.chat.dto;

public record ChatSendResponse(
        Long conversationId,
        Long userMessageId,
        Long assistantMessageId,
        String assistantReply
) {
}
