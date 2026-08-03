package com.heang.koriaibackend.domain.reading.dto;

// Mirrors the frontend ReadingProgressEntry shape (lib/reading.ts), keyed by
// unitId so the page can overlay it onto the unit list.
public record ReadingProgressResponse(
        String unitId,
        String status,
        Integer quizScore,
        Integer quizTotal,
        String completedAt
) {
}
