package com.heang.koriaibackend.domain.messagegen.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.messagegen.dto.GenerateMessageRequest;
import com.heang.koriaibackend.domain.messagegen.dto.GenerateMessageResponse;
import com.heang.koriaibackend.domain.messagegen.service.MessageGeneratorService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/message-generator")
@RequiredArgsConstructor
public class MessageGeneratorController {

    private final MessageGeneratorService messageGeneratorService;

    @GetMapping("/categories")
    public ApiResponse<List<String>> categories() {
        return ApiResponse.success(messageGeneratorService.categories());
    }

    @PostMapping("/generate")
    public ApiResponse<GenerateMessageResponse> generate(@Valid @RequestBody GenerateMessageRequest request) {
        return ApiResponse.success(messageGeneratorService.generate(SecurityUtils.currentUserId(), request));
    }
}
