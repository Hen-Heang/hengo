package com.heang.koriaibackend.domain.note.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Note {
    private Long id;
    private Long userId;
    private String slug;
    private String title;
    private String description;
    private String icon;
    private String category;
    private String tags;
    private String content;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
