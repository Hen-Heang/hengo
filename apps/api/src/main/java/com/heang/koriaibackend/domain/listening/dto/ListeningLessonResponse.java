package com.heang.koriaibackend.domain.listening.dto;

import java.util.List;

public record ListeningLessonResponse(
        String id,
        String topic,
        String title,
        String level,
        List<TranscriptLine> lines,
        List<QuizQuestion> quiz,
        String createdAt
) {
}
