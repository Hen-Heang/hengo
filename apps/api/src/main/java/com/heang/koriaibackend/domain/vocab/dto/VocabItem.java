package com.heang.koriaibackend.domain.vocab.dto;

import java.util.List;

public record VocabItem(
        String id,
        String term,
        String meaning,
        String example,
        int mastery,
        String nextReview,
        List<String> tags
) {
}