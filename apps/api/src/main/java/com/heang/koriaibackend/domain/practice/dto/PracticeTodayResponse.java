package com.heang.koriaibackend.domain.practice.dto;

import com.heang.koriaibackend.domain.correction.dto.CorrectionReviewResponse;
import com.heang.koriaibackend.domain.dailyphrase.dto.DailyPhraseResponse;
import com.heang.koriaibackend.domain.scenarios.dto.ScenarioResponse;
import com.heang.koriaibackend.domain.vocab.dto.VocabItemResponse;

import java.util.List;

public record PracticeTodayResponse(
        String userLevel,
        int dueVocabCount,
        List<VocabItemResponse> dueVocabSample,
        int dueCorrectionsCount,
        List<CorrectionReviewResponse> dueCorrectionsSample,
        DailyPhraseResponse dailyPhrase,
        ScenarioResponse suggestedScenario,
        String suggestedMessageCategory,
        String suggestedListeningTopic
) {
}
