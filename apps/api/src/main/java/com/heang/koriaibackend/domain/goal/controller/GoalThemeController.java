package com.heang.koriaibackend.domain.goal.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.goal.dto.GoalThemeResponse;
import com.heang.koriaibackend.domain.goal.dto.SaveGoalThemeRequest;
import com.heang.koriaibackend.domain.goal.service.GoalThemeService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/goal-themes")
@RequiredArgsConstructor
public class GoalThemeController {

    private final GoalThemeService themeService;

    @GetMapping
    public ApiResponse<List<GoalThemeResponse>> list() {
        return ApiResponse.success(themeService.listThemes(SecurityUtils.currentUserId()));
    }

    @PostMapping
    public ApiResponse<GoalThemeResponse> create(@Valid @RequestBody SaveGoalThemeRequest req) {
        return ApiResponse.success(themeService.create(SecurityUtils.currentUserId(), req));
    }

    @PutMapping("/{id}")
    public ApiResponse<GoalThemeResponse> update(@PathVariable UUID id, @Valid @RequestBody SaveGoalThemeRequest req) {
        return ApiResponse.success(themeService.update(SecurityUtils.currentUserId(), id, req));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        themeService.delete(SecurityUtils.currentUserId(), id);
        return ApiResponse.success(null);
    }
}
