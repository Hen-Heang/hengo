package com.heang.koriaibackend.domain.foundation.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.foundation.dto.FoundationCompleteRequest;
import com.heang.koriaibackend.domain.foundation.dto.FoundationProgressResponse;
import com.heang.koriaibackend.domain.foundation.service.FoundationService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/foundations")
@RequiredArgsConstructor
public class FoundationController {

    private final FoundationService foundationService;

    // The user's per-lesson progress across all tracks. Lesson content itself is
    // served by the frontend seed, which overlays this progress.
    @GetMapping("/progress")
    public ApiResponse<List<FoundationProgressResponse>> progress() {
        return ApiResponse.success(foundationService.listProgress(SecurityUtils.currentUserId()));
    }

    @PostMapping("/lessons/{lessonId}/complete")
    public ApiResponse<FoundationProgressResponse> complete(@PathVariable String lessonId,
                                                            @Valid @RequestBody FoundationCompleteRequest request) {
        return ApiResponse.success(foundationService.complete(SecurityUtils.currentUserId(), lessonId, request));
    }
}
