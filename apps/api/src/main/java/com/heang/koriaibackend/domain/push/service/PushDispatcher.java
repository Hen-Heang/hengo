package com.heang.koriaibackend.domain.push.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Fans a notification out to every configured {@link PushChannel}.
 *
 * Runs asynchronously on the "pushExecutor" pool and is best-effort: a failure
 * in one channel is logged and never propagated, so external delivery can never
 * roll back or break the originating goal/task write (same contract the in-app
 * {@code notifySelf} already promised). Spring injects all PushChannel beans.
 */
@Slf4j
@Service
public class PushDispatcher {

    private final List<PushChannel> channels;

    public PushDispatcher(List<PushChannel> channels) {
        this.channels = channels;
    }

    @Async("pushExecutor")
    public void dispatch(Long userId, PushMessage message) {
        if (userId == null || message == null) {
            return;
        }
        for (PushChannel channel : channels) {
            if (!channel.isConfigured()) {
                continue;
            }
            try {
                channel.send(userId, message);
            } catch (Exception e) {
                log.warn("Push channel '{}' failed for user {}: {}", channel.name(), userId, e.getMessage());
            }
        }
    }
}
