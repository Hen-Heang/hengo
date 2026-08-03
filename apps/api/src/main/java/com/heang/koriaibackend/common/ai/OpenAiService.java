package com.heang.koriaibackend.common.ai;

import com.heang.koriaibackend.common.ai.dto.OpenAiResult;
import com.openai.client.OpenAIClient;
import com.openai.core.RequestOptions;
import com.openai.core.http.StreamResponse;
import com.openai.models.Reasoning;
import com.openai.models.ReasoningEffort;
import com.openai.models.chat.completions.ChatCompletionChunk;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openai.models.responses.Response;
import com.openai.models.responses.ResponseCreateParams;
import com.openai.models.responses.ResponseOutputItem;
import com.openai.models.responses.ResponseUsage;
import com.openai.models.responses.StructuredResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
public class OpenAiService {

    // GPT-5 reasoning models default to "medium" effort, which adds a slow
    // internal reasoning pass before any output. Our tasks are short and
    // structured, so request "minimal" effort to cut latency dramatically.
    private static final long MAX_OUTPUT_TOKENS = 4096L;

    // Bound non-streaming calls (generate/analyze/evaluate), so a stalled OpenAI
    // response frees the request thread instead of hanging on the SDK's very
    // long default. Streaming (generateStream) is intentionally left untouched —
    // a long live token stream must not be cut off by a request timeout.
    private static final RequestOptions NON_STREAMING_OPTIONS = RequestOptions.builder()
            .timeout(java.time.Duration.ofSeconds(60))
            .build();

    // Used only to fabricate an empty typed object for mock mode (offline dev).
    private static final ObjectMapper MOCK_MAPPER = new ObjectMapper();

    private final OpenAIClient client;

    @Value("${openai.model:gpt-5-mini}")
    private String defaultModel;

    @Value("${openai.mock-enabled:false}")
    private boolean mockEnabled;

    // Reasoning params are only valid for gpt-5+ models; sending them to a
    // GPT-4o model would be rejected, so guard on the model family.
    private static boolean isReasoningModel(String model) {
        return model != null && model.startsWith("gpt-5");
    }

    // Plain-text answer: send a prompt, get back one block of text plus token/time stats.
    public OpenAiResult generate(String prompt, String model) {
        // Use the caller's model if given, otherwise fall back to the configured default.
        String selectedModel = (model == null || model.isBlank()) ? defaultModel : model;
        if (mockEnabled) {
            // Offline dev path: no real API call, just fake a plausible-looking result.
            int promptTokens = Math.max(1, prompt.length() / 4);
            int completionTokens = 80;
            return new OpenAiResult(
                    "Mock response: " + prompt.substring(0, Math.min(120, prompt.length())),
                    selectedModel,
                    promptTokens,
                    completionTokens,
                    30
            );
        }

        long start = System.currentTimeMillis();
        // Build the request: which model, the prompt text, and a cap on reply length.
        ResponseCreateParams.Builder paramsBuilder = ResponseCreateParams.builder()
                .model(selectedModel)
                .input(prompt)
                .maxOutputTokens(MAX_OUTPUT_TOKENS);
        if (isReasoningModel(selectedModel)) {
            // GPT-5 only: ask for the fastest "minimal" thinking mode instead of the slow default.
            paramsBuilder.reasoning(Reasoning.builder().effort(ReasoningEffort.MINIMAL).build());
        }
        // Actually call OpenAI, with the 60s safety timeout.
        Response response = client.responses().create(paramsBuilder.build(), NON_STREAMING_OPTIONS);
        long elapsed = System.currentTimeMillis() - start;

        // The response is a list of "output items" (could include tool calls, etc.).
        // We only care about message items, and within those, only the text parts.
        StringBuilder text = new StringBuilder();
        for (ResponseOutputItem item : response.output()) {
            if (!item.isMessage()) {
                continue;
            }

            item.asMessage().content().forEach(content -> {
                if (content.isOutputText()) {
                    text.append(content.asOutputText().text());
                }
            });
        }

        // Pull token usage if OpenAI included it, for logging/cost tracking.
        int promptTokens = 0;
        int completionTokens = 0;
        if (response.usage().isPresent()) {
            ResponseUsage usage = response.usage().get();
            promptTokens = (int) usage.inputTokens();
            completionTokens = (int) usage.outputTokens();
        }

        return new OpenAiResult(text.toString(), selectedModel, promptTokens, completionTokens, elapsed);
    }

    /**
     * Structured generation: the model is forced to return JSON matching the schema
     * derived from {@code clazz} (OpenAI Structured Outputs), and the SDK parses it
     * back into a typed {@code T} — so callers never hand-parse JSON or hit the
     * "model returned prose / malformed JSON" failure mode. The {@code meta} carries
     * model and token usage for logging.
     */
    public <T> StructuredAiResult<T> generateStructured(String prompt, String model, Class<T> clazz) {
        String selectedModel = (model == null || model.isBlank()) ? defaultModel : model;

        if (mockEnabled) {
            try {
                // An all-null instance keeps offline dev working without a real call.
                T value = MOCK_MAPPER.readValue("{}", clazz);
                return new StructuredAiResult<>(value, new OpenAiResult("mock", selectedModel, 1, 1, 5));
            } catch (Exception e) {
                throw new IllegalStateException("Mock structured generation failed for " + clazz.getSimpleName(), e);
            }
        }

        long start = System.currentTimeMillis();
        // Same request as generate(), plus .text(clazz): tells OpenAI "shape your JSON
        // reply like this Java class's fields" — no manual JSON parsing needed.
        var params = ResponseCreateParams.builder()
                .model(selectedModel)
                .input(prompt)
                .maxOutputTokens(MAX_OUTPUT_TOKENS)
                .text(clazz)
                .build();
        StructuredResponse<T> response = client.responses().create(params, NON_STREAMING_OPTIONS);
        long elapsed = System.currentTimeMillis() - start;

        // Dig into the response (item -> message -> content -> parsed text) and grab
        // the first parsed value the SDK already converted into our target type T.
        T value = response.output().stream()
                .flatMap(item -> item.message().stream())
                .flatMap(message -> message.content().stream())
                .flatMap(content -> content.outputText().stream())
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("OpenAI returned no structured output"));

        int promptTokens = 0;
        int completionTokens = 0;
        if (response.usage().isPresent()) {
            ResponseUsage usage = response.usage().get();
            promptTokens = (int) usage.inputTokens();
            completionTokens = (int) usage.outputTokens();
        }
        return new StructuredAiResult<>(value, new OpenAiResult("", selectedModel, promptTokens, completionTokens, elapsed));
    }

    /** Parsed structured value plus the call metadata (model and token usage) for logging. */
    public record StructuredAiResult<T>(T value, OpenAiResult meta) {
    }

    // Streaming answer: instead of returning one big String, calls onToken for each
    // small piece of text as it arrives, so a UI can show the reply being "typed" live.
    public void generateStream(String prompt, String model, Consumer<String> onToken) {
        String selectedModel = (model == null || model.isBlank()) ? defaultModel : model;

        if (mockEnabled) {
            // Fake streaming: split a canned sentence into words and emit them one by one.
            String mockText = "Mock streaming response: " + prompt.substring(0, Math.min(60, prompt.length()));
            for (String word : mockText.split("(?<=\\s)")) {
                onToken.accept(word);
            }
            return;
        }

        // Note: this uses the older Chat Completions API, not the Responses API used
        // by generate()/generateStructured() above — this SDK's streaming support lives here.
        ChatCompletionCreateParams.Builder paramsBuilder = ChatCompletionCreateParams.builder()
                .model(selectedModel)
                .addUserMessage(prompt)
                .maxCompletionTokens(MAX_OUTPUT_TOKENS);
        if (isReasoningModel(selectedModel)) {
            paramsBuilder.reasoningEffort(ReasoningEffort.MINIMAL);
        }

        // try-with-resources: the stream auto-closes its connection when done or on error.
        // No NON_STREAMING_OPTIONS timeout here on purpose — a long live reply must not be cut off.
        try (StreamResponse<ChatCompletionChunk> stream = client.chat().completions().createStreaming(paramsBuilder.build())) {
            stream.stream().forEach(chunk ->
                    chunk.choices().forEach(choice ->
                            // Each chunk may or may not carry a text delta; only emit when present.
                            choice.delta().content().ifPresent(onToken)
                    )
            );
        }
    }
}
