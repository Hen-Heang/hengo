package com.heang.koriaibackend.domain.dashboard.dto;

public record ProgressPoint(
         String day,
         int minutes,
         double accuracy) {
}