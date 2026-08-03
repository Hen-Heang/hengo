package com.heang.koriaibackend.domain.users.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.users.dto.ApplyLevelRequest;
import com.heang.koriaibackend.domain.users.dto.LevelSuggestionResponse;
import com.heang.koriaibackend.domain.users.dto.UserResponse;
import com.heang.koriaibackend.domain.users.service.LevelAdvisorService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/level")
@RequiredArgsConstructor
@Validated
public class LevelController {

    private final LevelAdvisorService levelAdvisorService;

    @GetMapping("/suggestion")
    public ApiResponse<LevelSuggestionResponse> getSuggestion() {
        return ApiResponse.success(levelAdvisorService.getSuggestion(SecurityUtils.currentUserId()));
    }

    @PostMapping("/apply")
    public ApiResponse<UserResponse> apply(@Valid @RequestBody ApplyLevelRequest req) {
        Long userId = SecurityUtils.currentUserId();
        return ApiResponse.success(UserResponse.from(levelAdvisorService.applyLevel(userId, req.level())));
    }
}
