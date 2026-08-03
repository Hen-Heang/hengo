package com.heang.koriaibackend.domain.foundation.dto;

// Mirrors the frontend FoundationProgress interface (lib/api/foundations.ts).
// `progress` is the best accuracy (0–100) the user has achieved on the lesson.
public record FoundationProgressResponse(
        String lessonId,
        String track,
        boolean completed,
        int progress,
        int attempts
) {
}
