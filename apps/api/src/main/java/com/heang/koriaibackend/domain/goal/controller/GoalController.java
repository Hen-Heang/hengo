package com.heang.koriaibackend.domain.goal.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.goal.dto.CreateGoalRequest;
import com.heang.koriaibackend.domain.goal.dto.GenerateTasksRequest;
import com.heang.koriaibackend.domain.goal.dto.GoalResponse;
import com.heang.koriaibackend.domain.goal.dto.TaskResponse;
import com.heang.koriaibackend.domain.goal.dto.UpdateGoalRequest;
import com.heang.koriaibackend.domain.goal.service.GoalService;
import com.heang.koriaibackend.domain.goal.service.TaskService;
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
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;
    private final TaskService taskService;

    @GetMapping
    public ApiResponse<List<GoalResponse>> list() {
        return ApiResponse.success(goalService.listGoals(SecurityUtils.currentUserId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<GoalResponse> get(@PathVariable UUID id) {
        return ApiResponse.success(goalService.getGoal(SecurityUtils.currentUserId(), id));
    }

    @GetMapping("/{id}/tasks")
    public ApiResponse<List<TaskResponse>> tasks(@PathVariable UUID id) {
        return ApiResponse.success(taskService.listByGoal(SecurityUtils.currentUserId(), id));
    }

    /** AI-generate tasks for a goal and insert them; returns the created tasks. */
    @PostMapping("/{id}/generate-tasks")
    public ApiResponse<List<TaskResponse>> generateTasks(@PathVariable UUID id,
                                                         @RequestBody(required = false) GenerateTasksRequest req) {
        return ApiResponse.success(taskService.generateTasks(SecurityUtils.currentUserId(), id, req));
    }

    @PostMapping
    public ApiResponse<GoalResponse> create(@Valid @RequestBody CreateGoalRequest req) {
        return ApiResponse.success(goalService.createGoal(SecurityUtils.currentUserId(), req));
    }

    @PutMapping("/{id}")
    public ApiResponse<GoalResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateGoalRequest req) {
        return ApiResponse.success(goalService.updateGoal(SecurityUtils.currentUserId(), id, req));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        goalService.deleteGoal(SecurityUtils.currentUserId(), id);
        return ApiResponse.success(null);
    }
}
