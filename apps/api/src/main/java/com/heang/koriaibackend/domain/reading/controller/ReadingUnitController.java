package com.heang.koriaibackend.domain.reading.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.reading.dto.ReadingUnitRequest;
import com.heang.koriaibackend.domain.reading.dto.ReadingUnitResponse;
import com.heang.koriaibackend.domain.reading.service.ReadingUnitService;
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
import java.util.Map;

@RestController
@RequestMapping("/api/reading/units")
@RequiredArgsConstructor
public class ReadingUnitController {

    private final ReadingUnitService readingUnitService;

    @GetMapping
    public ApiResponse<List<ReadingUnitResponse>> list() {
        return ApiResponse.success(readingUnitService.list(SecurityUtils.currentUserId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<ReadingUnitResponse> get(@PathVariable Long id) {
        return ApiResponse.success(readingUnitService.get(SecurityUtils.currentUserId(), id));
    }

    @PostMapping
    public ApiResponse<ReadingUnitResponse> create(@Valid @RequestBody ReadingUnitRequest request) {
        return ApiResponse.success(readingUnitService.create(SecurityUtils.currentUserId(), request));
    }

    @PutMapping("/{id}")
    public ApiResponse<ReadingUnitResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody ReadingUnitRequest request) {
        return ApiResponse.success(readingUnitService.update(SecurityUtils.currentUserId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Map<String, Boolean>> delete(@PathVariable Long id) {
        readingUnitService.delete(SecurityUtils.currentUserId(), id);
        return ApiResponse.success(Map.of("deleted", true));
    }
}
