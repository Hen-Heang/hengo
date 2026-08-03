package com.heang.koriaibackend.domain.push.telegram;

import com.heang.koriaibackend.domain.push.dto.TelegramLinkResponse;
import com.heang.koriaibackend.domain.push.dto.TelegramUpdate;
import com.heang.koriaibackend.domain.push.mapper.TelegramLinkMapper;
import com.heang.koriaibackend.domain.push.model.TelegramLink;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Telegram account linking and inbound webhook handling.
 *
 * Linking flow:
 *   1. user calls POST /api/push/telegram/link  -> we mint a one-time code and
 *      return a t.me deep link.
 *   2. user opens the link in Telegram, which sends "/start {code}" to the bot.
 *   3. Telegram POSTs that update to our webhook -> {@link #handleUpdate} binds
 *      the chat_id to the user and the code is consumed.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramService {

    private static final String START_PREFIX = "/start";

    private final TelegramLinkMapper linkMapper;
    private final TelegramClient telegramClient;

    @Value("${telegram.bot-username:}")
    private String botUsername;

    /** Generate a fresh deep link for the user to connect their Telegram. */
    @Transactional
    public TelegramLinkResponse createLink(Long userId) {
        String code = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        linkMapper.upsertLinkCode(userId, code);
        String deepLink = botUsername.isBlank()
                ? null
                : "https://t.me/" + botUsername + "?start=" + code;
        return new TelegramLinkResponse(deepLink, code, botUsername.isBlank() ? null : botUsername);
    }

    public boolean isLinked(Long userId) {
        TelegramLink link = linkMapper.findByUserId(userId);
        return link != null && link.getChatId() != null;
    }

    @Transactional
    public void unlink(Long userId) {
        linkMapper.deleteByUserId(userId);
    }

    /**
     * Process one inbound webhook update. Only "/start {code}" is acted on:
     * we resolve the pending code to a user and bind this chat. Best-effort —
     * unknown or malformed updates are ignored so Telegram won't retry forever.
     */
    @Transactional
    public void handleUpdate(TelegramUpdate update) {
        if (update == null || update.message() == null
                || update.message().chat() == null || update.message().text() == null) {
            return;
        }
        Long chatId = update.message().chat().id();
        String text = update.message().text().trim();
        if (chatId == null || !text.startsWith(START_PREFIX)) {
            return;
        }
        String[] parts = text.split("\\s+", 2);
        if (parts.length < 2 || parts[1].isBlank()) {
            telegramClient.sendMessage(chatId,
                    "👋 Welcome to koriai. Open the link from the app to connect your account.");
            return;
        }
        String code = parts[1].trim();
        TelegramLink link = linkMapper.findByLinkCode(code);
        if (link == null) {
            telegramClient.sendMessage(chatId,
                    "⚠️ This link is invalid or has expired. Please generate a new one in the app.");
            return;
        }
        linkMapper.confirmChat(link.getUserId(), chatId);
        telegramClient.sendMessage(chatId,
                "✅ Connected! You'll now get your koriai goal notifications here.");
        log.info("Telegram chat {} linked to user {}", chatId, link.getUserId());
    }
}
