package com.heang.koriaibackend.domain.activity.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.activity.dto.LogDurationRequest;
import com.heang.koriaibackend.domain.activity.service.ActivityService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping("/log")
    public ApiResponse<Void> log(@Valid @RequestBody LogDurationRequest req) {
        activityService.log(SecurityUtils.currentUserId(), req.feature(), req.durationMs());
        return ApiResponse.success(null);
    }
}
