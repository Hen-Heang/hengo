package com.heang.koriaibackend.domain.push.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * Maps a koriai user to their Telegram chat. {@code chatId} is null until the
 * user confirms by opening the t.me deep link carrying {@code linkCode}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelegramLink {
    private Long userId;
    private Long chatId;
    private String linkCode;
    private OffsetDateTime linkedAt;
    private OffsetDateTime createdAt;
}
