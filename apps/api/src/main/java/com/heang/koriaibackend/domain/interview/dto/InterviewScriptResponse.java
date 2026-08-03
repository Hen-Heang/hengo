package com.heang.koriaibackend.domain.interview.dto;

import java.util.Map;

public record InterviewScriptResponse(
        String topicId,
        Map<String, String> sections,
        String updatedAt
) {
}
