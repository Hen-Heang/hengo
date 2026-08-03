package com.heang.koriaibackend.domain.goal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {
    private UUID id;
    /** Nullable: a null goalId is a standalone personal/daily task. */
    private UUID goalId;
    private Long userId;
    private String title;
    private String description;
    private boolean completed;
    private OffsetDateTime startDate;
    private OffsetDateTime endDate;
    private LocalTime dailyStartTime;
    private LocalTime dailyEndTime;
    private boolean anytime;
    private Integer durationMinutes;
    private String color;
    private List<String> tags;
    private Long updatedBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
