package com.heang.koriaibackend.domain.listening.dto;

import java.util.List;

public record ListeningAttemptResponse(
        String lessonId,
        int score,
        int total,
        int accuracy,
        List<Boolean> results
) {
}
