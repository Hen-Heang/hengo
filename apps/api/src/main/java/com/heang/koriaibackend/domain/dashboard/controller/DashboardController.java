package com.heang.koriaibackend.domain.dashboard.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.dashboard.dto.DashboardResponse;
import com.heang.koriaibackend.domain.dashboard.dto.StreakResponse;
import com.heang.koriaibackend.domain.dashboard.service.DashboardService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;


    @GetMapping("/progress")
    public ApiResponse<DashboardResponse> getProgress() {
        return ApiResponse.success(dashboardService.getProgress(SecurityUtils.currentUserId()));
    }

    @GetMapping("/streak")
    public ApiResponse<StreakResponse> getStreak() {
        return ApiResponse.success(dashboardService.getStreak(SecurityUtils.currentUserId()));
    }

    @GetMapping("/activity")
    public ApiResponse<List<String>> getActivityDays(@RequestParam String month) {
        Long userId = SecurityUtils.currentUserId();
        if (!month.matches("\\d{4}-\\d{2}")) {
            return ApiResponse.success(List.of());
        }
        return ApiResponse.success(dashboardService.getActivityDays(userId, month));
    }
}