package com.heang.koriaibackend.domain.chat.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {
    private Long id;
    private Long conversationId;
    private String role;
    private String content;
    private String corrections;
    private Integer tokensUsed;
    private OffsetDateTime createdAt;
}
