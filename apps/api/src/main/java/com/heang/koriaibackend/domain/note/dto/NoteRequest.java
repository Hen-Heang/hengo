package com.heang.koriaibackend.domain.note.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

// Shared by create (POST /notes) and update (PUT /notes/{slug}).
// `slug` is only required on create — on update it is taken from the path and
// the body may omit it, so it is not validated here (the service guards create).
public record NoteRequest(
        String slug,
        @NotBlank String title,
        String description,
        String icon,
        String category,
        String content,
        List<String> tags
) {
}
