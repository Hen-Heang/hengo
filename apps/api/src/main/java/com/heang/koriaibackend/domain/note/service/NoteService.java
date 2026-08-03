package com.heang.koriaibackend.domain.note.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.utils.JsonUtils;
import com.heang.koriaibackend.common.exception.BusinessException;
import com.heang.koriaibackend.domain.note.dto.NoteRequest;
import com.heang.koriaibackend.domain.note.dto.NoteResponse;
import com.heang.koriaibackend.domain.note.mapper.NoteMapper;
import com.heang.koriaibackend.domain.note.model.Note;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteMapper noteMapper;
    private final JsonUtils jsonUtils;
    private final ObjectMapper objectMapper;


    public List<NoteResponse> list(Long userId) {
        return noteMapper.findMetaByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public NoteResponse get(Long userId, String slug) {
        return toResponse(findOrThrow(userId, slug));
    }

    @Transactional
    public NoteResponse create(Long userId, NoteRequest request) {
        String slug = trimToNull(request.slug());
        if (slug == null) {
            throw new BusinessException(Code.BAD_REQUEST, "Slug is required");
        }
        if (noteMapper.findByUserAndSlug(userId, slug) != null) {
            throw new BusinessException(Code.BAD_REQUEST, "A note with this slug already exists");
        }
        Note note = toModel(userId, request);
        note.setSlug(slug);
        noteMapper.insertNote(note);
        return toResponse(noteMapper.findByUserAndSlug(userId, slug));
    }

    @Transactional
    public NoteResponse update(Long userId, String slug, NoteRequest request) {
        findOrThrow(userId, slug);
        Note note = toModel(userId, request);
        note.setSlug(slug);
        noteMapper.updateNote(note);
        return toResponse(noteMapper.findByUserAndSlug(userId, slug));
    }

    @Transactional
    public void delete(Long userId, String slug) {
        int deleted = noteMapper.deleteByUserAndSlug(userId, slug);
        if (deleted == 0) {
            throw new BusinessException(Code.NOT_FOUND, "Note not found");
        }
    }

    private Note findOrThrow(Long userId, String slug) {
        Note note = noteMapper.findByUserAndSlug(userId, slug);
        if (note == null) {
            throw new BusinessException(Code.NOT_FOUND, "Note not found");
        }
        return note;
    }

    private Note toModel(Long userId, NoteRequest request) {
        return Note.builder()
                .userId(userId)
                .title(request.title().trim())
                .description(trimToNull(request.description()))
                .icon(trimToNull(request.icon()))
                .category(trimToNull(request.category()))
                .tags(toJson(request.tags() != null ? request.tags() : Collections.emptyList()))
                .content(request.content() != null ? request.content() : "")
                .build();
    }

    private NoteResponse toResponse(Note note) {
        return new NoteResponse(
                String.valueOf(note.getId()),
                note.getSlug(),
                note.getTitle(),
                note.getDescription(),
                note.getIcon(),
                note.getCategory(),
                parseTags(note.getTags()),
                note.getContent(),
                note.getCreatedAt() != null ? note.getCreatedAt().toString() : null,
                note.getUpdatedAt() != null ? note.getUpdatedAt().toString() : null
        );
    }

    private List<String> parseTags(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new BusinessException(Code.BAD_REQUEST, "Invalid note payload");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
