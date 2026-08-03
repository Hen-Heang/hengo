package com.heang.koriaibackend.domain.push.telegram;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Registers the Telegram inbound webhook with Telegram on startup, so the manual
 * one-off {@code setWebhook} curl is no longer required (and can't be forgotten).
 *
 * Without this, Telegram has nowhere to deliver the "/start {code}" update, the
 * chat is never bound to a user, linking never completes and no pushes are sent.
 *
 * Self-disables (logs and returns) when the bot token is absent or no public base
 * URL is configured. {@code telegram.webhook-base-url} is the public HTTPS origin
 * of THIS backend (e.g. https://koriai-backend-production.up.railway.app) — on
 * Railway it falls back to RAILWAY_PUBLIC_DOMAIN automatically; the https:// scheme
 * is added if the value is bare (as RAILWAY_PUBLIC_DOMAIN is host-only).
 */
@Slf4j
@Component
public class TelegramWebhookRegistrar {

    static final String WEBHOOK_PATH = "/api/telegram/webhook";

    private final TelegramClient telegramClient;
    private final String webhookBaseUrl;
    private final String webhookSecret;

    public TelegramWebhookRegistrar(TelegramClient telegramClient,
                                    @Value("${telegram.webhook-base-url:}") String webhookBaseUrl,
                                    @Value("${telegram.webhook-secret:}") String webhookSecret) {
        this.telegramClient = telegramClient;
        this.webhookBaseUrl = webhookBaseUrl;
        this.webhookSecret = webhookSecret;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void registerWebhook() {
        if (!telegramClient.isConfigured()) {
            log.info("Telegram webhook not registered (no bot token configured)");
            return;
        }
        if (webhookBaseUrl == null || webhookBaseUrl.isBlank()) {
            log.warn("Telegram bot is configured but telegram.webhook-base-url is blank — "
                    + "the webhook was NOT registered, so account linking and pushes will not work. "
                    + "Set TELEGRAM_WEBHOOK_BASE_URL to this backend's public HTTPS URL.");
            return;
        }
        String url = normalizeOrigin(webhookBaseUrl) + WEBHOOK_PATH;
        try {
            String response = telegramClient.setWebhook(url, webhookSecret);
            log.info("Telegram webhook registered at {} -> {}", url, response);
        } catch (Exception e) {
            log.error("Failed to register Telegram webhook at {}: {}", url, e.getMessage());
        }
    }

    /** Add https:// when missing (RAILWAY_PUBLIC_DOMAIN is host-only) and trim a trailing slash. */
    private String normalizeOrigin(String base) {
        String origin = base.startsWith("http://") || base.startsWith("https://")
                ? base
                : "https://" + base;
        return origin.endsWith("/") ? origin.substring(0, origin.length() - 1) : origin;
    }
}
