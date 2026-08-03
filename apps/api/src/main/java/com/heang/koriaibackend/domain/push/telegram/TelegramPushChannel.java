package com.heang.koriaibackend.domain.push.telegram;

import com.heang.koriaibackend.domain.push.mapper.TelegramLinkMapper;
import com.heang.koriaibackend.domain.push.model.TelegramLink;
import com.heang.koriaibackend.domain.push.service.PushChannel;
import com.heang.koriaibackend.domain.push.service.PushMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

/**
 * Delivers notifications to a user's linked Telegram chat. Disabled (no-op) when
 * no bot token is configured or the user hasn't linked Telegram yet.
 */
@Component
@RequiredArgsConstructor
public class TelegramPushChannel implements PushChannel {

    private final TelegramClient telegramClient;
    private final TelegramLinkMapper linkMapper;

    @Value("${app.frontend-base-url:}")
    private String frontendBaseUrl;

    @Override
    public String name() {
        return "telegram";
    }

    @Override
    public boolean isConfigured() {
        return telegramClient.isConfigured();
    }

    @Override
    public void send(Long userId, PushMessage message) {
        TelegramLink link = linkMapper.findByUserId(userId);
        if (link == null || link.getChatId() == null) {
            return; // user hasn't connected Telegram
        }
        telegramClient.sendMessage(link.getChatId(), render(message));
    }

    private String render(PushMessage message) {
        StringBuilder sb = new StringBuilder();
        sb.append("<b>").append(HtmlUtils.htmlEscape(message.title())).append("</b>");
        if (message.body() != null && !message.body().isBlank()) {
            sb.append('\n').append(HtmlUtils.htmlEscape(message.body()));
        }
        String link = absoluteUrl(message.url());
        if (link != null) {
            sb.append("\n\n").append("<a href=\"").append(link).append("\">Open in koriai</a>");
        }
        return sb.toString();
    }

    /** Turn a relative app path into an absolute link when a base URL is configured. */
    private String absoluteUrl(String url) {
        if (url == null || url.isBlank() || frontendBaseUrl.isBlank()) {
            return null;
        }
        String base = frontendBaseUrl.endsWith("/")
                ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
                : frontendBaseUrl;
        return url.startsWith("/") ? base + url : base + "/" + url;
    }
}
