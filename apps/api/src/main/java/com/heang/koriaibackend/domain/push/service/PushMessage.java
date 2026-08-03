package com.heang.koriaibackend.domain.push.service;

/**
 * A channel-agnostic notification payload. Each {@link PushChannel} renders this
 * into its own wire format (Telegram text, Web Push JSON, FCM message).
 *
 * @param title short headline
 * @param body  one-line description
 * @param url   optional relative app path (e.g. "/goals/{id}"); channels may turn
 *              this into an absolute link using the configured frontend base URL.
 */
public record PushMessage(String title, String body, String url) {

    public static PushMessage of(String title, String body) {
        return new PushMessage(title, body, null);
    }
}
