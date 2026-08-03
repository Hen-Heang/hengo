package com.heang.koriaibackend.domain.dashboard.dto;

public record StreakResponse(
        int streakDays,
        boolean activityToday) {
}