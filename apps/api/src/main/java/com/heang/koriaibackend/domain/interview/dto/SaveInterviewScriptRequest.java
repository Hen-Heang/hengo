package com.heang.koriaibackend.domain.interview.dto;

import java.util.Map;

/**
 * Sections keyed by the script outline section id (e.g. "intro", "health").
 * A null/empty map clears the saved script.
 */
public record SaveInterviewScriptRequest(
        Map<String, String> sections
) {
}
