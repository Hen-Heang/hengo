package com.heang.koriaibackend.domain.note.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.note.dto.NoteRequest;
import com.heang.koriaibackend.domain.note.dto.NoteResponse;
import com.heang.koriaibackend.domain.note.service.NoteService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    public ApiResponse<List<NoteResponse>> list() {
        return ApiResponse.success(noteService.list(SecurityUtils.currentUserId()));
    }

    @GetMapping("/{slug}")
    public ApiResponse<NoteResponse> get(@PathVariable String slug) {
        return ApiResponse.success(noteService.get(SecurityUtils.currentUserId(), slug));
    }

    @PostMapping
    public ApiResponse<NoteResponse> create(@Valid @RequestBody NoteRequest request) {
        return ApiResponse.success(noteService.create(SecurityUtils.currentUserId(), request));
    }

    @PutMapping("/{slug}")
    public ApiResponse<NoteResponse> update(@PathVariable String slug,
                                            @Valid @RequestBody NoteRequest request) {
        return ApiResponse.success(noteService.update(SecurityUtils.currentUserId(), slug, request));
    }

    @DeleteMapping("/{slug}")
    public ApiResponse<Map<String, Boolean>> delete(@PathVariable String slug) {
        noteService.delete(SecurityUtils.currentUserId(), slug);
        return ApiResponse.success(Map.of("deleted", true));
    }
}
