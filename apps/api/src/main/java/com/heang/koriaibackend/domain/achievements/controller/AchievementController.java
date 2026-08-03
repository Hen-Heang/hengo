package com.heang.koriaibackend.domain.achievements.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.achievements.dto.AchievementResponse;
import com.heang.koriaibackend.domain.achievements.dto.AchievementSummaryResponse;
import com.heang.koriaibackend.domain.achievements.service.AchievementService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    @GetMapping
    public ApiResponse<AchievementSummaryResponse> getSummary() {
        return ApiResponse.success(achievementService.getSummary(SecurityUtils.currentUserId()));
    }

    @PostMapping("/check")
    public ApiResponse<List<AchievementResponse>> check() {
        return ApiResponse.success(achievementService.evaluate(SecurityUtils.currentUserId()));
    }
}
