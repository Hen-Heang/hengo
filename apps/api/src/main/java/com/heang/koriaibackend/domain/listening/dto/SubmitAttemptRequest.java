package com.heang.koriaibackend.domain.listening.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SubmitAttemptRequest(
        @NotNull Long lessonId,
        @NotNull List<Integer> answers
) {
}
