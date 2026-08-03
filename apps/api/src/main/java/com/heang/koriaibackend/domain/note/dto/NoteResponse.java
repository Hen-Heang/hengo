package com.heang.koriaibackend.domain.note.dto;

import java.util.List;

// Mirrors the frontend `Note` interface (lib/api/notes.ts). The list endpoint
// returns the same shape with `content` omitted (null) for a lighter payload —
// the frontend list page only reads the metadata fields.
public record NoteResponse(
        String id,
        String slug,
        String title,
        String description,
        String icon,
        String category,
        List<String> tags,
        String content,
        String createdAt,
        String updatedAt
) {
}
