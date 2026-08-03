package com.heang.koriaibackend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    /**
     * A fully configured ObjectMapper. {@code findAndRegisterModules()} loads every Jackson
     * module on the classpath (JavaTime, parameter-names) via ServiceLoader, and dates are
     * written as ISO-8601 strings. A bare {@code new ObjectMapper()} lacks these, which breaks
     * records using @JsonNaming and JSON-blob (JsonNode) fields — see the goal/task DTOs.
     */
    @Bean
    ObjectMapper objectMapper() {
        return new ObjectMapper()
                .findAndRegisterModules()
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
}
