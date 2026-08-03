package com.heang.koriaibackend.domain.correction.dto;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

import java.util.List;

/**
 * Structured-output schema for the grammar/spelling correction task. OpenAI derives
 * a strict JSON schema from this class and is guaranteed to return JSON matching it,
 * which the SDK parses straight into this object — no hand-rolled JSON parsing.
 *
 * Plain public-field classes (with {@link JsonPropertyDescription} hints) are used
 * deliberately: the field descriptions are emitted into the schema and steer the
 * model's output, and the shape is the simplest the schema generator accepts.
 */
public class CorrectionResult {

    @JsonPropertyDescription("The full corrected Korean text")
    public String correctedText;

    @JsonPropertyDescription("Overall quality rating of the learner's ORIGINAL sentence, from 1 (needs work) to 5 (native-like)")
    public Integer rating;

    @JsonPropertyDescription("Brief overall summary of the corrections in English (1-2 sentences)")
    public String explanation;

    @JsonPropertyDescription("Key grammar points in English the learner should remember")
    public List<String> grammarPoints;

    @JsonPropertyDescription("Every individual correction made; empty if nothing changed")
    public List<Change> changes;

    public static class Change {
        @JsonPropertyDescription("The exact original Korean fragment that was wrong")
        public String original;

        @JsonPropertyDescription("The corrected Korean fragment")
        public String corrected;

        @JsonPropertyDescription("English meaning of the corrected phrase")
        public String englishMeaning;

        @JsonPropertyDescription("Why this correction was needed (the grammar/spelling/phrasing rule), in English")
        public String reason;
    }
}
