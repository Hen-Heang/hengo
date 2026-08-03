package com.heang.koriaibackend.common.utils;

import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.exception.BusinessException;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

public final class DateTimeUtils {

    private static final DateTimeFormatter DEFAULT_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private DateTimeUtils () {
        // Private constructor to prevent instantiation
    }

    public static String now() {
        return LocalDateTime.now().format(DEFAULT_FORMAT);
    }

    public static String format(LocalDateTime dateTime) {
        return dateTime.format(DEFAULT_FORMAT);
    }

    public static OffsetDateTime parseTimestamp(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return OffsetDateTime.parse(value);
        } catch (Exception e) {
            // Accept a bare date (yyyy-MM-dd) too, treating it as start-of-day UTC.
            try {
                return OffsetDateTime.parse(value + "T00:00:00Z");
            } catch (Exception ignored) {
                throw new BusinessException(Code.BAD_REQUEST, "Invalid timestamp: " + value);
            }
        }
    }

}
