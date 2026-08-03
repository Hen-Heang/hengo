package com.heang.koriaibackend.domain.dashboard.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface DashboardMapper {
    int countCorrectionsThisWeek(@Param("userId") Long userId);
    int countStreakDays(@Param("userId") Long userId);
    boolean hasActivityToday(@Param("userId") Long userId);
    int countTotalWordsSaved(@Param("userId") Long userId);
    int countReviewsToday(@Param("userId") Long userId);
    int countCorrectionsToday(@Param("userId") Long userId);
    int countDueReviews(@Param("userId") Long userId);
    List<String> getActivityDays(@Param("userId") Long userId, @Param("month") String month);
    List<Map<String, Object>> getDailyActivity(@Param("userId") Long userId);
}
