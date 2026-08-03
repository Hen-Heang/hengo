package com.heang.koriaibackend.domain.push.controller;

import com.heang.koriaibackend.domain.push.dto.TelegramUpdate;
import com.heang.koriaibackend.domain.push.telegram.TelegramService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public endpoint Telegram POSTs updates to. Must be permitted in SecurityConfig
 * (no JWT — Telegram authenticates via the secret-token header instead).
 *
 * Set the webhook once with:
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<BASE>/api/telegram/webhook&secret_token=<SECRET>"
 *
 * Always returns 200 so Telegram does not retry; processing is best-effort.
 */
@Slf4j
@RestController
@RequestMapping("/api/telegram")
@RequiredArgsConstructor
public class TelegramWebhookController {

    private final TelegramService telegramService;

    @Value("${telegram.webhook-secret:}")
    private String webhookSecret;

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestHeader(value = "X-Telegram-Bot-Api-Secret-Token", required = false) String secret,
            @RequestBody TelegramUpdate update) {
        if (!webhookSecret.isBlank() && !webhookSecret.equals(secret)) {
            log.warn("Rejected Telegram webhook call with bad secret token");
            return ResponseEntity.ok().build();
        }
        try {
            telegramService.handleUpdate(update);
        } catch (Exception e) {
            log.warn("Failed to process Telegram update: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }
}
