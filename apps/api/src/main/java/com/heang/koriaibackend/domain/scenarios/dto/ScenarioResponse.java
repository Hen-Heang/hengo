package com.heang.koriaibackend.domain.scenarios.dto;

public record ScenarioResponse(
        String id,
        String title,
        String category,
        String level,
        String summary,
        String goal,
        String introMessage
) {
}