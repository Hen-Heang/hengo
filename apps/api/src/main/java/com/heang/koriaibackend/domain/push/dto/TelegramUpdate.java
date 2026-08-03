package com.heang.koriaibackend.domain.push.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * The slice of a Telegram webhook "update" we care about: an incoming text
 * message and the chat it came from. All other fields are ignored.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TelegramUpdate(Message message) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Message(String text, Chat chat) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Chat(Long id) {
    }
}
