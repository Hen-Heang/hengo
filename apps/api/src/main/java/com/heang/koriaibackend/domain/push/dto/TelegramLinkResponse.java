package com.heang.koriaibackend.domain.push.dto;

/**
 * Returned when a user starts linking Telegram. The frontend shows {@code deepLink}
 * as a button; opening it sends "/start {code}" to the bot, which the webhook
 * redeems to bind the chat.
 */
public record TelegramLinkResponse(String deepLink, String code, String botUsername) {
}
