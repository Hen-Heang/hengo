package com.heang.koriaibackend.domain.correction.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.heang.koriaibackend.common.ai.OpenAiService;
import com.heang.koriaibackend.common.utils.JsonUtils;
import com.heang.koriaibackend.common.ai.OpenAiService.StructuredAiResult;
import com.heang.koriaibackend.common.utils.PromptTemplates;
import com.heang.koriaibackend.common.exception.BusinessException;
import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.domain.correction.dto.CorrectionChange;
import com.heang.koriaibackend.domain.correction.dto.CorrectionResponse;
import com.heang.koriaibackend.domain.correction.dto.CorrectionResult;
import com.heang.koriaibackend.domain.correction.dto.CorrectionReviewResponse;
import com.heang.koriaibackend.domain.correction.mapper.SentenceCorrectionMapper;
import com.heang.koriaibackend.domain.correction.model.SentenceCorrection;
import com.heang.koriaibackend.domain.usage.service.ApiUsageLogService;
import com.heang.koriaibackend.domain.vocab.model.ReviewRating;
import com.heang.koriaibackend.domain.vocab.service.SrsScheduler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CorrectionService {

    private final SentenceCorrectionMapper sentenceCorrectionMapper;
    private final OpenAiService openAiService;
    private final ApiUsageLogService apiUsageLogService;
    private final JsonUtils jsonUtils;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Value("${openai.model:gpt-5-mini}")
    private String model;

    @Transactional
    public CorrectionResponse check(Long userId, String text) {
        String prompt = PromptTemplates.correctionPrompt(text);
        StructuredAiResult<CorrectionResult> result = openAiService.generateStructured(prompt, model, CorrectionResult.class);
        CorrectionResult r = result.value();

        List<String> grammarPoints = r.grammarPoints == null ? Collections.emptyList() : r.grammarPoints;
        List<CorrectionChange> changes = r.changes == null ? Collections.emptyList()
                : r.changes.stream()
                        .map(c -> new CorrectionChange(c.original, c.corrected, c.englishMeaning, c.reason))
                        .toList();

        SentenceCorrection correction = SentenceCorrection.builder()
                .userId(userId)
                .originalText(text)
                .correctedText(r.correctedText != null ? r.correctedText : text)
                .rating(r.rating)
                .explanation(r.explanation)
                .grammarPoints(jsonUtils.toJsonSafe(grammarPoints))
                .changes(jsonUtils.toJsonSafe(changes))
                .modelUsed(result.meta().model())
                .build();
        sentenceCorrectionMapper.insert(correction);
        apiUsageLogService.log(userId, "CORRECTION", result.meta());

        return CorrectionResponse.from(correction, grammarPoints, changes);
    }

    public List<CorrectionResponse> history(Long userId, int limit) {
        return sentenceCorrectionMapper.findByUserId(userId, limit).stream()
                .map(it -> CorrectionResponse.from(it, parseStringList(it.getGrammarPoints()), parseChangeList(it.getChanges())))
                .toList();
    }

    public List<CorrectionReviewResponse> getDueReviews(Long userId) {
        return sentenceCorrectionMapper.findDueByUserId(userId).stream()
                .map(it -> CorrectionReviewResponse.from(it, parseStringList(it.getGrammarPoints())))
                .toList();
    }

    @Transactional
    public CorrectionReviewResponse rate(Long userId, Long correctionId, ReviewRating rating) {
        SentenceCorrection correction = sentenceCorrectionMapper.findByIdAndUser(correctionId, userId);
        if (correction == null) {
            throw new BusinessException(Code.NOT_FOUND, "Correction not found");
        }

        SrsScheduler.Result next = SrsScheduler.rate(
                correction.getEaseFactor(), correction.getIntervalDays(),
                correction.getRepetitions(), correction.getLapses(), rating);

        correction.setEaseFactor(next.easeFactor());
        correction.setIntervalDays(next.intervalDays());
        correction.setRepetitions(next.repetitions());
        correction.setLapses(next.lapses());
        correction.setMastery(next.mastery());
        correction.setNextReviewDate(next.nextReview());
        sentenceCorrectionMapper.updateSrs(correction);

        return CorrectionReviewResponse.from(correction, parseStringList(correction.getGrammarPoints()));
    }

    @Transactional
    public void delete(Long userId, Long correctionId) {
        int deleted = sentenceCorrectionMapper.deleteByIdAndUser(correctionId, userId);
        if (deleted == 0) {
            throw new BusinessException(Code.NOT_FOUND, "Correction not found");
        }
    }

    private List<String> parseStringList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    private List<CorrectionChange> parseChangeList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, objectMapper.getTypeFactory().constructCollectionType(List.class, CorrectionChange.class));
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    private <T> String toJson(List<T> values) {
        try {
            return objectMapper.writeValueAsString(values);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}
