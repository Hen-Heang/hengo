package com.heang.koriaibackend.domain.reading.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.utils.JsonUtils;
import com.heang.koriaibackend.common.exception.BusinessException;
import com.heang.koriaibackend.domain.reading.dto.ReadingGrammarNote;
import com.heang.koriaibackend.domain.reading.dto.ReadingParagraph;
import com.heang.koriaibackend.domain.reading.dto.ReadingQuizQuestion;
import com.heang.koriaibackend.domain.reading.dto.ReadingUnitRequest;
import com.heang.koriaibackend.domain.reading.dto.ReadingUnitResponse;
import com.heang.koriaibackend.domain.reading.dto.ReadingVocabItem;
import com.heang.koriaibackend.domain.reading.mapper.ReadingUnitMapper;
import com.heang.koriaibackend.domain.reading.model.ReadingUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReadingUnitService {

    private final ReadingUnitMapper readingUnitMapper;
    private final JsonUtils jsonUtils;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    public List<ReadingUnitResponse> list(Long userId) {
        return readingUnitMapper.findUnitsByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ReadingUnitResponse get(Long userId, Long id) {
        return toResponse(findOrThrow(userId, id));
    }

    @Transactional
    public ReadingUnitResponse create(Long userId, ReadingUnitRequest request) {
        ReadingUnit unit = toModel(userId, request);
        readingUnitMapper.insertUnit(unit);
        return toResponse(readingUnitMapper.findUnitByIdAndUser(unit.getId(), userId));
    }

    @Transactional
    public ReadingUnitResponse update(Long userId, Long id, ReadingUnitRequest request) {
        findOrThrow(userId, id);
        ReadingUnit unit = toModel(userId, request);
        unit.setId(id);
        readingUnitMapper.updateUnit(unit);
        return toResponse(readingUnitMapper.findUnitByIdAndUser(id, userId));
    }

    @Transactional
    public void delete(Long userId, Long id) {
        int deleted = readingUnitMapper.deleteUnitByIdAndUser(id, userId);
        if (deleted == 0) {
            throw new BusinessException(Code.NOT_FOUND, "Reading unit not found");
        }
    }

    private ReadingUnit findOrThrow(Long userId, Long id) {
        ReadingUnit unit = readingUnitMapper.findUnitByIdAndUser(id, userId);
        if (unit == null) {
            throw new BusinessException(Code.NOT_FOUND, "Reading unit not found");
        }
        return unit;
    }

    private ReadingUnit toModel(Long userId, ReadingUnitRequest request) {
        return ReadingUnit.builder()
                .userId(userId)
                .episode(trimToNull(request.episode()))
                .title(request.title().trim())
                .titleEnglish(request.titleEnglish().trim())
                .category(request.category().trim())
                .level(request.level().trim())
                .summary(trimToNull(request.summary()))
                .source(trimToNull(request.source()))
                .grammarNote(request.grammarNote() != null ? toJson(request.grammarNote()) : null)
                .paragraphs(toJson(request.paragraphs()))
                .vocab(toJson(request.vocab() != null ? request.vocab() : Collections.emptyList()))
                .quiz(toJson(request.quiz() != null ? request.quiz() : Collections.emptyList()))
                .build();
    }

    private ReadingUnitResponse toResponse(ReadingUnit unit) {
        return new ReadingUnitResponse(
                String.valueOf(unit.getId()),
                unit.getEpisode(),
                unit.getTitle(),
                unit.getTitleEnglish(),
                unit.getCategory(),
                unit.getLevel(),
                unit.getSummary(),
                unit.getSource(),
                parseGrammarNote(unit.getGrammarNote()),
                parseList(unit.getParagraphs(), ReadingParagraph.class),
                parseList(unit.getVocab(), ReadingVocabItem.class),
                parseList(unit.getQuiz(), ReadingQuizQuestion.class),
                unit.getCreatedAt() != null ? unit.getCreatedAt().toString() : null,
                unit.getUpdatedAt() != null ? unit.getUpdatedAt().toString() : null
        );
    }

    private ReadingGrammarNote parseGrammarNote(String json) {
        if (json == null || json.isBlank() || "null".equals(json)) {
            return null;
        }
        try {
            return objectMapper.readValue(json, ReadingGrammarNote.class);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private <T> List<T> parseList(String json, Class<T> type) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, type));
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new BusinessException(Code.BAD_REQUEST, "Invalid reading unit payload");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
