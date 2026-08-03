package com.heang.koriaibackend.domain.goal.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.goal.dto.GoalResponse;
import com.heang.koriaibackend.domain.goal.service.GoalService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalStarController {

    private final GoalService goalService;

    @GetMapping("/starred")
    public ApiResponse<List<GoalResponse>> listStarred() {
        return ApiResponse.success(goalService.listStarred(SecurityUtils.currentUserId()));
    }

    /** Toggle star/pin for a goal; returns the new state. */
    @PostMapping("/{goalId}/star")
    public ApiResponse<Map<String, Boolean>> toggleStar(@PathVariable UUID goalId) {
        boolean starred = goalService.toggle(SecurityUtils.currentUserId(), goalId);
        return ApiResponse.success(Map.of("isStarred", starred));
    }
}
