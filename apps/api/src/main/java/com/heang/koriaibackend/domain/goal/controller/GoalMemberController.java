package com.heang.koriaibackend.domain.goal.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.goal.dto.GoalMemberResponse;
import com.heang.koriaibackend.domain.goal.dto.GoalResponse;
import com.heang.koriaibackend.domain.goal.service.GoalMemberService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalMemberController {

    private final GoalMemberService memberService;

    @GetMapping("/{goalId}/members")
    public ApiResponse<List<GoalMemberResponse>> list(@PathVariable UUID goalId) {
        return ApiResponse.success(memberService.listMembers(SecurityUtils.currentUserId(), goalId));
    }

    @GetMapping("/by-share-code/{shareCode}")
    public ApiResponse<GoalResponse> preview(@PathVariable UUID shareCode) {
        return ApiResponse.success(memberService.getByShareCode(shareCode));
    }

    @PostMapping("/by-share-code/{shareCode}/join")
    public ApiResponse<GoalResponse> join(@PathVariable UUID shareCode) {
        return ApiResponse.success(memberService.joinByShareCode(SecurityUtils.currentUserId(), shareCode));
    }

    @DeleteMapping("/{goalId}/members/me")
    public ApiResponse<Void> leave(@PathVariable UUID goalId) {
        memberService.leave(SecurityUtils.currentUserId(), goalId);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{goalId}/members/{userId}")
    public ApiResponse<Void> remove(@PathVariable UUID goalId, @PathVariable Long userId) {
        memberService.removeMember(SecurityUtils.currentUserId(), goalId, userId);
        return ApiResponse.success(null);
    }

    @PostMapping("/{goalId}/share-code/regenerate")
    public ApiResponse<Map<String, UUID>> regenerate(@PathVariable UUID goalId) {
        UUID code = memberService.regenerateShareCode(SecurityUtils.currentUserId(), goalId);
        return ApiResponse.success(Map.of("shareCode", code));
    }

    @PutMapping("/{goalId}/members/last-seen")
    public ApiResponse<Void> lastSeen(@PathVariable UUID goalId) {
        memberService.touchLastSeen(SecurityUtils.currentUserId(), goalId);
        return ApiResponse.success(null);
    }
}
