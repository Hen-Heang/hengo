package com.heang.koriaibackend.domain.dashboard.dto;

import java.util.List;

public record DashboardResponse(DashboardStats stats, List<ProgressPoint> chartData) {
}