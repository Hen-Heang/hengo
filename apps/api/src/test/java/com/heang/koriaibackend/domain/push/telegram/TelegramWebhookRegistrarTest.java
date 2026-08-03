package com.heang.koriaibackend.domain.push.telegram;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TelegramWebhookRegistrarTest {

    @Test
    void registers_webhook_with_normalized_url_and_secret_when_configured() {
        TelegramClient client = mock(TelegramClient.class);
        when(client.isConfigured()).thenReturn(true);
        var registrar = new TelegramWebhookRegistrar(
                client, "https://api.koriai.app/", "s3cr3t");

        registrar.registerWebhook();

        ArgumentCaptor<String> url = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> secret = ArgumentCaptor.forClass(String.class);
        verify(client).setWebhook(url.capture(), secret.capture());
        // trailing slash trimmed, webhook path appended
        assertThat(url.getValue()).isEqualTo("https://api.koriai.app/api/telegram/webhook");
        assertThat(secret.getValue()).isEqualTo("s3cr3t");
    }

    @Test
    void prepends_https_when_base_url_is_bare_host() {
        TelegramClient client = mock(TelegramClient.class);
        when(client.isConfigured()).thenReturn(true);
        // mirrors RAILWAY_PUBLIC_DOMAIN, which is host-only with no scheme
        var registrar = new TelegramWebhookRegistrar(
                client, "koriai-backend.up.railway.app", "");

        registrar.registerWebhook();

        verify(client).setWebhook(
                "https://koriai-backend.up.railway.app/api/telegram/webhook", "");
    }

    @Test
    void skips_when_bot_token_absent() {
        TelegramClient client = mock(TelegramClient.class);
        when(client.isConfigured()).thenReturn(false);
        var registrar = new TelegramWebhookRegistrar(client, "https://api.koriai.app", "s");

        registrar.registerWebhook();

        verify(client, never()).setWebhook(any(), any());
    }

    @Test
    void skips_when_base_url_blank() {
        TelegramClient client = mock(TelegramClient.class);
        when(client.isConfigured()).thenReturn(true);
        var registrar = new TelegramWebhookRegistrar(client, "", "s");

        registrar.registerWebhook();

        verify(client, never()).setWebhook(any(), any());
    }

    @Test
    void swallows_telegram_failure_so_boot_is_not_blocked() {
        TelegramClient client = mock(TelegramClient.class);
        when(client.isConfigured()).thenReturn(true);
        when(client.setWebhook(any(), any())).thenThrow(new RuntimeException("401 Unauthorized"));
        var registrar = new TelegramWebhookRegistrar(client, "https://api.koriai.app", "s");

        // must not throw — startup continues even if Telegram rejects the call
        registrar.registerWebhook();

        verify(client).setWebhook(any(), any());
    }
}
