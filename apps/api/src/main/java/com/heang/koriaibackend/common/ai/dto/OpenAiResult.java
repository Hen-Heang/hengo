package com.heang.koriaibackend.common.ai.dto;

public record OpenAiResult(
        String content,
        String model,
        int promptTokens,
        int completionTokens,
        long responseTimeMs
) {
}
