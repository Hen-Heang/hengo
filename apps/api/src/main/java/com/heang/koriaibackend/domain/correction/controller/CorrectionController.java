package com.heang.koriaibackend.domain.correction.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.correction.dto.CorrectionCheckRequest;
import com.heang.koriaibackend.domain.correction.dto.CorrectionResponse;
import com.heang.koriaibackend.domain.correction.dto.CorrectionReviewResponse;
import com.heang.koriaibackend.domain.correction.service.CorrectionService;
import com.heang.koriaibackend.domain.vocab.model.ReviewRating;
import com.heang.koriaibackend.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/corrections")
@RequiredArgsConstructor
@Validated
public class CorrectionController {

    private final CorrectionService correctionService;

    @PostMapping("/check")
    public ApiResponse<CorrectionResponse> check(@Valid @RequestBody CorrectionCheckRequest req) {
        Long userId = SecurityUtils.currentUserId();
        return ApiResponse.success(correctionService.check(userId, req.text()));
    }

    @GetMapping("/history")
    public ApiResponse<List<CorrectionResponse>> history(@RequestParam(defaultValue = "30") int limit) {
        Long userId = SecurityUtils.currentUserId();
        return ApiResponse.success(correctionService.history(userId, limit));
    }

    @GetMapping("/review/due")
    public ApiResponse<List<CorrectionReviewResponse>> getDueReviews() {
        return ApiResponse.success(correctionService.getDueReviews(SecurityUtils.currentUserId()));
    }

    @PostMapping("/{id}/rate")
    public ApiResponse<CorrectionReviewResponse> rate(@PathVariable Long id, @RequestParam ReviewRating rating) {
        Long userId = SecurityUtils.currentUserId();
        return ApiResponse.success(correctionService.rate(userId, id, rating));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        correctionService.delete(SecurityUtils.currentUserId(), id);
        return ApiResponse.success(null);
    }
}
