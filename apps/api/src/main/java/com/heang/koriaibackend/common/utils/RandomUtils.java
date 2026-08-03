package com.heang.koriaibackend.common.utils;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

public final class RandomUtils {

    private RandomUtils() {
    }

    public static <T> T pickRandom(List<T> items) {
        return items.get(ThreadLocalRandom.current().nextInt(items.size()));
    }
}
