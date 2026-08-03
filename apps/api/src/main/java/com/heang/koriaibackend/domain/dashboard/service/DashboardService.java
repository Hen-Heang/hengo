package com.heang.koriaibackend.domain.dashboard.service;

import com.heang.koriaibackend.domain.dashboard.dto.DashboardResponse;
import com.heang.koriaibackend.domain.dashboard.dto.DashboardStats;
import com.heang.koriaibackend.domain.dashboard.dto.ProgressPoint;
import com.heang.koriaibackend.domain.dashboard.dto.StreakResponse;
import com.heang.koriaibackend.domain.dashboard.mapper.DashboardMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor

public class DashboardService {
    private final DashboardMapper dashboardMapper;


    public DashboardResponse getProgress(Long userId) {
        int correctionsThisWeek = dashboardMapper.countCorrectionsThisWeek(userId);
        int streakDays = dashboardMapper.countStreakDays(userId);
        int wordsSaved = dashboardMapper.countTotalWordsSaved(userId);
        int reviewsToday = dashboardMapper.countReviewsToday(userId);
        int correctionsToday = dashboardMapper.countCorrectionsToday(userId);
        int dueReviews = dashboardMapper.countDueReviews(userId);

        int dailyGoalProgress = Math.min(100, reviewsToday * 20 + correctionsToday * 100);
        List<Map<String, Object>> raw = dashboardMapper.getDailyActivity(userId);
        List<ProgressPoint> chartData = raw.stream()
                .map(row -> new ProgressPoint(
                        String.valueOf(row.get("day")),
                        ((Number) row.getOrDefault("minutes", 0)).intValue(),
                        ((Number) row.getOrDefault("accuracy", 0)).doubleValue()

                )).toList();
        int weeklyMinutes = chartData.stream().mapToInt(ProgressPoint::minutes).sum();
        DashboardStats stats = new DashboardStats(
                streakDays, weeklyMinutes, wordsSaved, correctionsThisWeek, dailyGoalProgress, reviewsToday, correctionsToday, dueReviews
        );
        return new DashboardResponse(stats, chartData);


    }

    public StreakResponse getStreak(Long userId) {
        int streakDays = dashboardMapper.countStreakDays(userId);
        boolean activityToday = dashboardMapper.hasActivityToday(userId);
        return new StreakResponse(streakDays, activityToday);
    }

    public List<String> getActivityDays(Long userId, String month) {
        return dashboardMapper.getActivityDays(userId, month);
    }

}
