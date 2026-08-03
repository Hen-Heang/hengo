package com.heang.koriaibackend.domain.interview.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.utils.JsonUtils;
import com.heang.koriaibackend.common.exception.BusinessException;
import com.heang.koriaibackend.domain.interview.dto.InterviewScriptResponse;
import com.heang.koriaibackend.domain.interview.mapper.InterviewScriptMapper;
import com.heang.koriaibackend.domain.interview.model.InterviewScript;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InterviewScriptService {

    private final InterviewScriptMapper interviewScriptMapper;
    private final JsonUtils jsonUtils;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    /** Returns the saved script for this topic, or null if nothing is stored yet. */
    public InterviewScriptResponse getScript(Long userId, String topicId) {
        InterviewScript script = interviewScriptMapper.findByUserAndTopic(userId, topicId);
        return script == null ? null : toResponse(script);
    }

    @Transactional
    public InterviewScriptResponse saveScript(Long userId, String topicId, Map<String, String> sections) {
        InterviewScript script = InterviewScript.builder()
                .userId(userId)
                .topicId(topicId)
                .sections(jsonUtils.toJson(sections == null ? Collections.emptyMap() : sections))
                .build();
        interviewScriptMapper.upsert(script);
        return toResponse(interviewScriptMapper.findByUserAndTopic(userId, topicId));
    }

    private InterviewScriptResponse toResponse(InterviewScript script) {
        return new InterviewScriptResponse(
                script.getTopicId(),
                parseSections(script.getSections()),
                script.getUpdatedAt() != null ? script.getUpdatedAt().toString() : null
        );
    }

    private Map<String, String> parseSections(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructMapType(Map.class, String.class, String.class));
        } catch (JsonProcessingException e) {
            return Collections.emptyMap();
        }
    }

    private String toJson(Map<String, String> sections) {
        try {
            return objectMapper.writeValueAsString(sections);
        } catch (JsonProcessingException e) {
            throw new BusinessException(Code.BAD_REQUEST, "Invalid interview script payload");
        }
    }
}
