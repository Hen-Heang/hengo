package com.heang.koriaibackend.domain.goal.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.goal.dto.CreateTaskRequest;
import com.heang.koriaibackend.domain.goal.dto.TaskResponse;
import com.heang.koriaibackend.domain.goal.dto.UpdateTaskRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    /**
     * Calendar range / today's tasks. {@code goalId} omitted = all the user's tasks;
     * {@code from}/{@code to} are optional ISO bounds on start_date.
     */
    @GetMapping
    public ApiResponse<List<TaskResponse>> range(
            @RequestParam(name = "goalId", required = false) UUID goalId,
            @RequestParam(name = "from", required = false) String from,
            @RequestParam(name = "to", required = false) String to) {
        return ApiResponse.success(taskService.listRange(SecurityUtils.currentUserId(), goalId, from, to));
    }

    @PostMapping
    public ApiResponse<TaskResponse> create(@Valid @RequestBody CreateTaskRequest req) {
        return ApiResponse.success(taskService.createTask(SecurityUtils.currentUserId(), req));
    }

    @PutMapping("/{id}")
    public ApiResponse<TaskResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateTaskRequest req) {
        return ApiResponse.success(taskService.updateTask(SecurityUtils.currentUserId(), id, req));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        taskService.deleteTask(SecurityUtils.currentUserId(), id);
        return ApiResponse.success(null);
    }
}
