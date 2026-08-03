package com.heang.koriaibackend.domain.goal.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.goal.dto.CreateInviteRequest;
import com.heang.koriaibackend.domain.goal.dto.GoalNotificationResponse;
import com.heang.koriaibackend.domain.goal.service.GoalNotificationService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/goal-notifications")
@RequiredArgsConstructor
public class GoalNotificationController {

    private final GoalNotificationService notificationService;

    @GetMapping
    public ApiResponse<List<GoalNotificationResponse>> list(
            @RequestParam(name = "onlyUnread", defaultValue = "false") boolean onlyUnread) {
        return ApiResponse.success(notificationService.list(SecurityUtils.currentUserId(), onlyUnread));
    }

    @PostMapping("/invite")
    public ApiResponse<GoalNotificationResponse> invite(@Valid @RequestBody CreateInviteRequest req) {
        return ApiResponse.success(notificationService.invite(SecurityUtils.currentUserId(), req));
    }

    @PutMapping("/{id}/read")
    public ApiResponse<Void> markRead(@PathVariable UUID id) {
        notificationService.markRead(SecurityUtils.currentUserId(), id);
        return ApiResponse.success(null);
    }

    @PutMapping("/{id}/respond")
    public ApiResponse<Void> respond(@PathVariable UUID id, @RequestParam boolean accept) {
        notificationService.respond(SecurityUtils.currentUserId(), id, accept);
        return ApiResponse.success(null);
    }
}
