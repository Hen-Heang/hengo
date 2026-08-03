package com.heang.koriaibackend.domain.goal.service;

import com.heang.koriaibackend.domain.goal.dto.GoalResponse;
import com.heang.koriaibackend.domain.goal.model.Goal;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;

/**
 * Builds GoalResponse, parsing the stored jsonb metadata text into a JSON object.
 * Uses Jackson 3 ({@code tools.jackson}) — the same engine Spring Boot 4 uses for
 * HTTP (de)serialization — so the {@code metadata} {@link JsonNode} on GoalResponse
 * serializes natively instead of failing with "Type definition error: JsonNode".
 */
@Component
public class GoalResponseAssembler {

    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    public GoalResponse toResponse(Goal goal) {
        return GoalResponse.of(goal, parseMetadata(goal.getMetadata()));
    }

    public List<GoalResponse> toResponses(List<Goal> goals) {
        return goals.stream().map(this::toResponse).toList();
    }

    private JsonNode parseMetadata(String text) {
        if (text == null || text.isBlank()) {
            return objectMapper.createObjectNode();
        }
        try {
            return objectMapper.readTree(text);
        } catch (Exception e) {
            return objectMapper.createObjectNode();
        }
    }
}
