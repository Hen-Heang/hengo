package com.heang.koriaibackend.domain.achievements.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Achievement {
    private String code;
    private String title;
    private String description;
    private String icon;
    private String category;
    private int xp;
    private String metric;
    private int threshold;
    private int sortOrder;
}
