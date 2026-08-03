package com.heang.koriaibackend.domain.push.service;

/**
 * An external delivery channel for notifications (Telegram, Web Push, FCM, ...).
 * Implementations are discovered as Spring beans and fanned out to by
 * {@link PushDispatcher}. A channel reports {@link #isConfigured()} false when
 * its credentials are absent so the app can ship one channel at a time.
 */
public interface PushChannel {

    /** Stable name for logging (e.g. "telegram"). */
    String name();

    /** Whether this channel has the configuration it needs to send. */
    boolean isConfigured();

    /** Deliver to the given user. May be a no-op if the user isn't reachable on this channel. */
    void send(Long userId, PushMessage message);
}
