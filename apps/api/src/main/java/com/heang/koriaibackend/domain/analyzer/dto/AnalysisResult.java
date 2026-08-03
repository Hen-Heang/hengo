package com.heang.koriaibackend.domain.analyzer.dto;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

import java.util.List;

/**
 * Structured-output schema for the workplace-message analyzer. OpenAI returns JSON
 * guaranteed to match this shape and the SDK parses it directly — no fragile
 * objectMapper.readValue + fallback. Plain public fields + descriptions: the
 * descriptions are emitted into the schema and guide the model.
 */
public class AnalysisResult {

    @JsonPropertyDescription("Word-for-word literal English meaning, even if it sounds unnatural")
    public String literalMeaning;

    @JsonPropertyDescription("What a Korean coworker actually means by this, in plain English")
    public String naturalMeaning;

    @JsonPropertyDescription("2-4 sentences on the workplace situation, intent, and any implied action items or expectations")
    public String businessContext;

    @JsonPropertyDescription("Politeness/formality level in English and who it is appropriate for")
    public String politenessLevel;

    @JsonPropertyDescription("Short read of the emotional/social tone (e.g. neutral, urgent, friendly, passive-aggressive)")
    public String tone;

    @JsonPropertyDescription("Every meaningful Korean phrase/honorific in the message, explained")
    public List<Breakdown> breakdown;

    @JsonPropertyDescription("2-3 natural replies ranging across formality; empty if a reply would be inappropriate")
    public List<Reply> suggestedReplies;

    public static class Breakdown {
        @JsonPropertyDescription("A short Korean fragment from the message")
        public String fragment;

        @JsonPropertyDescription("English meaning of that fragment")
        public String meaning;

        @JsonPropertyDescription("Nuance, honorific marker, grammar, or cultural note explaining why it matters")
        public String note;
    }

    public static class Reply {
        @JsonPropertyDescription("A natural Korean reply the engineer could send")
        public String korean;

        @JsonPropertyDescription("English translation of the reply")
        public String english;

        @JsonPropertyDescription("Formality level of this reply in English")
        public String formality;
    }
}
