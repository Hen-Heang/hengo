package com.heang.koriaibackend.domain.dashboard.dto;

public record DashboardStats(
        int streakDays,
        int weeklyMinutes,
        int wordsSaved,
        int correctionsThisWeek,
        int dailyGoalProgress,
        int reviewsToday,
        int correctionsToday,
        int dueReviews
) {
}
