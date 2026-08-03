package com.heang.koriaibackend.domain.reading.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.reading.dto.ReadingProgressResponse;
import com.heang.koriaibackend.domain.reading.dto.ReadingQuizResultRequest;
import com.heang.koriaibackend.domain.reading.service.ReadingProgressService;
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
@RequestMapping("/api/reading/progress")
@RequiredArgsConstructor
public class ReadingProgressController {

    private final ReadingProgressService readingProgressService;

    // The user's per-unit progress across every reading unit. The unit list
    // page overlays this onto the units it already fetched.
    @GetMapping
    public ApiResponse<List<ReadingProgressResponse>> list() {
        return ApiResponse.success(readingProgressService.list(SecurityUtils.currentUserId()));
    }

    @PostMapping("/{unitId}/start")
    public ApiResponse<ReadingProgressResponse> start(@PathVariable Long unitId) {
        return ApiResponse.success(readingProgressService.start(SecurityUtils.currentUserId(), unitId));
    }

    @PostMapping("/{unitId}/complete")
    public ApiResponse<ReadingProgressResponse> complete(@PathVariable Long unitId) {
        return ApiResponse.success(readingProgressService.complete(SecurityUtils.currentUserId(), unitId));
    }

    @PostMapping("/{unitId}/quiz")
    public ApiResponse<ReadingProgressResponse> quiz(@PathVariable Long unitId,
                                                      @Valid @RequestBody ReadingQuizResultRequest request) {
        return ApiResponse.success(
                readingProgressService.submitQuizResult(SecurityUtils.currentUserId(), unitId, request));
    }
}
