package com.heang.koriaibackend.domain.interview.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.interview.dto.InterviewScriptResponse;
import com.heang.koriaibackend.domain.interview.dto.SaveInterviewScriptRequest;
import com.heang.koriaibackend.domain.interview.service.InterviewScriptService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/interview/scripts")
@RequiredArgsConstructor
public class InterviewScriptController {

    private final InterviewScriptService interviewScriptService;

    @GetMapping("/{topicId}")
    public ApiResponse<InterviewScriptResponse> get(@PathVariable String topicId) {
        return ApiResponse.success(interviewScriptService.getScript(SecurityUtils.currentUserId(), topicId));
    }

    @PutMapping("/{topicId}")
    public ApiResponse<InterviewScriptResponse> save(@PathVariable String topicId,
                                                     @RequestBody SaveInterviewScriptRequest request) {
        return ApiResponse.success(
                interviewScriptService.saveScript(SecurityUtils.currentUserId(), topicId, request.sections()));
    }
}
