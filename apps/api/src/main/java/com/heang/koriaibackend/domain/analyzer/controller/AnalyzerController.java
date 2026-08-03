package com.heang.koriaibackend.domain.analyzer.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.analyzer.dto.AnalyzeMessageRequest;
import com.heang.koriaibackend.domain.analyzer.dto.MessageAnalysisResponse;
import com.heang.koriaibackend.domain.analyzer.service.AnalyzerService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analyzer")
@RequiredArgsConstructor
@Validated
public class AnalyzerController {

    private final AnalyzerService analyzerService;

    @PostMapping("/analyze")
    public ApiResponse<MessageAnalysisResponse> analyze(@Valid @RequestBody AnalyzeMessageRequest req) {
        Long userId = SecurityUtils.currentUserId();
        return ApiResponse.success(analyzerService.analyze(userId, req.text(), req.source()));
    }

    @GetMapping("/history")
    public ApiResponse<List<MessageAnalysisResponse>> history(@RequestParam(defaultValue = "30") int limit) {
        Long userId = SecurityUtils.currentUserId();
        return ApiResponse.success(analyzerService.history(userId, limit));
    }
}
