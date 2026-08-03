package com.heang.koriaibackend.domain.vocab.service;

import com.heang.koriaibackend.domain.vocab.model.ReviewRating;

import java.time.LocalDate;

/**
 * SM-2 style scheduler (the algorithm behind Anki), at day granularity.
 *
 * - AGAIN  → card lapses: due again today, ease drops, repetition count resets.
 * - HARD   → small interval growth, ease drops slightly.
 * - GOOD   → 1d, 3d, then interval × ease.
 * - EASY   → 4d, 7d, then interval × ease × 1.3 bonus, ease grows.
 *
 * NOTE: lib/srs.ts in the frontend mirrors these rules to preview the next
 * interval on the grading buttons — keep both in sync.
 */
public final class SrsScheduler {

    public static final double MIN_EASE = 1.3;
    public static final double START_EASE = 2.5;
    public static final int MAX_INTERVAL_DAYS = 365;
    private static final double EASY_BONUS = 1.3;

    private SrsScheduler() {
    }

    public record Result(
            double easeFactor,
            int intervalDays,
            int repetitions,
            int lapses,
            LocalDate nextReview,
            int mastery
    ) {
    }

    public static Result rate(double easeFactor, int intervalDays, int repetitions, int lapses, ReviewRating rating) {
        double ease = easeFactor < MIN_EASE ? START_EASE : easeFactor;
        int interval;
        int reps = Math.max(0, repetitions);

        switch (rating) {
            case AGAIN -> {
                lapses++;
                reps = 0;
                ease = Math.max(MIN_EASE, ease - 0.20);
                interval = 0;
            }
            case HARD -> {
                ease = Math.max(MIN_EASE, ease - 0.15);
                interval = reps == 0 ? 1 : Math.max(intervalDays + 1, (int) Math.round(intervalDays * 1.2));
                reps++;
            }
            case GOOD -> {
                if (reps == 0) interval = 1;
                else if (reps == 1) interval = 3;
                else interval = Math.max(intervalDays + 1, (int) Math.round(intervalDays * ease));
                reps++;
            }
            case EASY -> {
                ease += 0.15;
                if (reps == 0) interval = 4;
                else if (reps == 1) interval = 7;
                else interval = Math.max(intervalDays + 1, (int) Math.round(intervalDays * ease * EASY_BONUS));
                reps++;
            }
            default -> throw new IllegalArgumentException("Unknown rating: " + rating);
        }

        interval = Math.min(interval, MAX_INTERVAL_DAYS);
        return new Result(
                ease,
                interval,
                reps,
                lapses,
                LocalDate.now().plusDays(interval),
                masteryFor(interval)
        );
    }

    /**
     * Maps the scheduled interval onto the legacy 0-100 mastery score the UI
     * displays. Log curve: 1d≈13, 7d≈40, 21d≈59 (Anki's "mature"), 180d+→100.
     */
    public static int masteryFor(int intervalDays) {
        if (intervalDays <= 0) return 0;
        double scaled = Math.log1p(Math.min(intervalDays, 180)) / Math.log1p(180);
        return (int) Math.min(100, Math.round(scaled * 100));
    }
}
