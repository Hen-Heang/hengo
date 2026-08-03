package com.heang.koriaibackend.domain.push.telegram;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Thin wrapper over the Telegram Bot HTTP API. Holds the bot token and knows how
 * to send a chat message; it is intentionally free of any koriai domain logic so
 * both the linking flow and the push channel can reuse it.
 */
@Slf4j
@Component
public class TelegramClient {

    private final String botToken;
    private final RestClient restClient;

    public TelegramClient(@Value("${telegram.bot-token:}") String botToken) {
        this.botToken = botToken;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.telegram.org")
                .build();
    }

    /** True when a bot token is configured; gates the whole Telegram channel. */
    public boolean isConfigured() {
        return botToken != null && !botToken.isBlank();
    }

    /**
     * Send a message to a chat. Uses HTML parse mode so messages may contain
     * simple <b>/<a> formatting. Throws on transport/API failure; callers that
     * must not fail (the push channel) wrap this in try/catch.
     */
    public void sendMessage(Long chatId, String text) {
        if (!isConfigured()) {
            return;
        }
        restClient.post()
                .uri("/bot{token}/sendMessage", botToken)
                .body(Map.of(
                        "chat_id", chatId,
                        "text", text,
                        "parse_mode", "HTML",
                        "disable_web_page_preview", true))
                .retrieve()
                .toBodilessEntity();
    }

    /**
     * Register the inbound webhook with Telegram so it POSTs updates to {@code url}.
     * {@code secret} (may be blank) is echoed back by Telegram in the
     * X-Telegram-Bot-Api-Secret-Token header and validated by the webhook controller.
     * Only "message" updates are requested — that's all the linking flow needs.
     * Returns Telegram's raw JSON response for logging. Throws on transport/API failure.
     */
    public String setWebhook(String url, String secret) {
        Map<String, Object> body = secret == null || secret.isBlank()
                ? Map.of("url", url, "allowed_updates", List.of("message"))
                : Map.of("url", url, "secret_token", secret, "allowed_updates", List.of("message"));
        return restClient.post()
                .uri("/bot{token}/setWebhook", botToken)
                .body(body)
                .retrieve()
                .body(String.class);
    }

    /** Fetch the current webhook registration state (URL, pending count, last error). */
    public String getWebhookInfo() {
        return restClient.get()
                .uri("/bot{token}/getWebhookInfo", botToken)
                .retrieve()
                .body(String.class);
    }
}
