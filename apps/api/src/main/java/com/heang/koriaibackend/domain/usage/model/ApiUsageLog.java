package com.heang.koriaibackend.domain.usage.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiUsageLog {
    private Long id;
    private Long userId;
    private String model;
    private String feature;
    private Integer promptTokens;
    private Integer completionTokens;
    private BigDecimal estimatedCostUsd;
    private Integer responseTimeMs;
    private OffsetDateTime createdAt;
}
