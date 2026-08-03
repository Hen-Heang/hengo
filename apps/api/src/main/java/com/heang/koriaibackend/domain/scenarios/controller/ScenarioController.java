package com.heang.koriaibackend.domain.scenarios.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.scenarios.dto.ScenarioResponse;
import com.heang.koriaibackend.domain.scenarios.service.ScenarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/scenarios")
@RequiredArgsConstructor
public class ScenarioController {

    private final ScenarioService scenarioService;

    @GetMapping
    public ApiResponse<List<ScenarioResponse>> getList() {
        return ApiResponse.success(scenarioService.getList());
    }

    @GetMapping("/{id}")
    public ApiResponse<ScenarioResponse> getById(@PathVariable String id) {
        return ApiResponse.success(scenarioService.getById(id).orElse(null));
    }
}
