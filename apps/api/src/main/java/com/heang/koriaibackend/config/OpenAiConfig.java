package com.heang.koriaibackend.config;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Optional;

// Marks this class as a Spring configuration class.
// Spring will scan it at startup and register any @Bean methods.
@Configuration
public class OpenAiConfig {

    // Logger for printing info/error messages to the console at startup.
    private static final Logger log = LoggerFactory.getLogger(OpenAiConfig.class);

    // Reads 'openai.mock-enabled' from application.yml/properties.
    // Defaults to false if the property is not set.
    // When true, the app skips the real API key and uses a dummy client (useful for testing).
    @Value("${openai.mock-enabled:false}")
    private boolean mockEnabled;

    // Reads 'openai.api-key' from application.yml/properties.
    // Defaults to an empty string if the property is not set.
    // This is a fallback — the environment variable takes priority (see below).
    @Value("${openai.api-key:}")
    private String configuredApiKey;

    // Declares this method as a Spring Bean.
    // Spring creates this OpenAIClient once at startup and shares it across the whole app.
    @Bean
    OpenAIClient openAIClient() {

        // If mock mode is enabled, return a client with a fake key.
        // This lets the app start and run tests without a real OpenAI API key.
        if (mockEnabled) {
            log.info("OpenAI client initialized in mock mode (openai.mock-enabled=true)");
            return OpenAIOkHttpClient.builder()
                    .apiKey("test-openai-key")
                    .build();
        }

        // Try to read the API key from the system environment variable OPENAI_API_KEY.
        // Using an env var is the recommended approach — it keeps secrets out of source code.
        String envApiKey = System.getenv("OPENAI_API_KEY");

        // Key resolution priority:
        // 1. OPENAI_API_KEY environment variable (preferred — safer for production)
        // 2. openai.api-key from application.yml (fallback — useful for local dev)
        String key = Optional.ofNullable(envApiKey)
                .filter(value -> !value.isBlank())
                .orElse(configuredApiKey);

        boolean hasEnvKey = envApiKey != null && !envApiKey.isBlank();
        boolean hasYamlKey = configuredApiKey != null && !configuredApiKey.isBlank();

        // Log which source the key came from to make debugging easier.
        if (hasEnvKey) {
            log.info("OpenAI key source detected: OPENAI_API_KEY environment variable");
        } else if (hasYamlKey) {
            log.info("OpenAI key source detected: openai.api-key property");
        } else {
            // No key found in either source — log an error before throwing below.
            log.error("OpenAI key not detected. Expected OPENAI_API_KEY or openai.api-key.");
        }

        // Fail fast: if no key was found, crash at startup with a clear message.
        // This prevents confusing errors later when the app tries to make an API call.
        if (key == null || key.isBlank()) {
            throw new IllegalStateException("OpenAI API key is missing. Set OPENAI_API_KEY or openai.api-key.");
        }

        // Build and return the real OpenAI HTTP client using the resolved key.
        return OpenAIOkHttpClient.builder()
                .apiKey(key)
                .build();
    }
}
