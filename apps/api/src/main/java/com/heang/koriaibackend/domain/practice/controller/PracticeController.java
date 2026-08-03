package com.heang.koriaibackend.domain.practice.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.practice.dto.PracticeTodayResponse;
import com.heang.koriaibackend.domain.practice.service.PracticeService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
public class PracticeController {

    private final PracticeService practiceService;

    @GetMapping("/today")
    public ApiResponse<PracticeTodayResponse> getToday() {
        return ApiResponse.success(practiceService.getToday(SecurityUtils.currentUserId()));
    }
}
