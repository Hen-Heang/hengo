package com.heang.koriaibackend.domain.usage.service;

import com.heang.koriaibackend.common.ai.dto.OpenAiResult;
import com.heang.koriaibackend.domain.usage.mapper.ApiUsageLogMapper;
import com.heang.koriaibackend.domain.usage.model.ApiUsageLog;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class ApiUsageLogService {

    private final ApiUsageLogMapper apiUsageLogMapper;

    @Transactional
    public void log(Long userId, String feature, OpenAiResult result) {
        ApiUsageLog usageLog = ApiUsageLog.builder()
                .userId(userId)
                .model(result.model())
                .feature(feature)
                .promptTokens(result.promptTokens())
                .completionTokens(result.completionTokens())
                .estimatedCostUsd(estimateCost(result.promptTokens(), result.completionTokens()))
                .responseTimeMs((int) result.responseTimeMs())
                .build();
        apiUsageLogMapper.insert(usageLog);
    }

    private BigDecimal estimateCost(int promptTokens, int completionTokens) {
        BigDecimal totalTokens = BigDecimal.valueOf((long) promptTokens + completionTokens);
        return totalTokens
                .multiply(new BigDecimal("0.000001"))
                .setScale(6, RoundingMode.HALF_UP);
    }
}
