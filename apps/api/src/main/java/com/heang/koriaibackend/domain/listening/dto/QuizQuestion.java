package com.heang.koriaibackend.domain.listening.dto;

import java.util.List;

public record QuizQuestion(
        String question,
        List<String> options,
        int answerIndex,
        String explanation
) {
}
