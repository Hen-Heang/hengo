package com.heang.koriaibackend.domain.listening.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.listening.dto.ListeningAttemptResponse;
import com.heang.koriaibackend.domain.listening.dto.ListeningLessonResponse;
import com.heang.koriaibackend.domain.listening.dto.SubmitAttemptRequest;
import com.heang.koriaibackend.domain.listening.service.ListeningService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/listening")
@RequiredArgsConstructor
public class ListeningController {

    private final ListeningService listeningService;

    @GetMapping("/topics")
    public ApiResponse<List<String>> topics() {
        return ApiResponse.success(listeningService.topics());
    }

    @PostMapping("/generate")
    public ApiResponse<ListeningLessonResponse> generate(@RequestParam(required = false) String topic) {
        return ApiResponse.success(listeningService.generate(SecurityUtils.currentUserId(), topic));
    }

    @GetMapping("/lessons")
    public ApiResponse<List<ListeningLessonResponse>> lessons() {
        return ApiResponse.success(listeningService.listLessons(SecurityUtils.currentUserId()));
    }

    @GetMapping("/lessons/{id}")
    public ApiResponse<ListeningLessonResponse> lesson(@PathVariable Long id) {
        return ApiResponse.success(listeningService.getLesson(SecurityUtils.currentUserId(), id));
    }

    @PostMapping("/attempts")
    public ApiResponse<ListeningAttemptResponse> submitAttempt(@Valid @RequestBody SubmitAttemptRequest request) {
        return ApiResponse.success(listeningService.submitAttempt(SecurityUtils.currentUserId(), request));
    }
}
