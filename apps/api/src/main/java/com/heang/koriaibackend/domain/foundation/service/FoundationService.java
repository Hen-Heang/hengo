package com.heang.koriaibackend.domain.foundation.service;

import com.heang.koriaibackend.domain.foundation.dto.FoundationCompleteRequest;
import com.heang.koriaibackend.domain.foundation.dto.FoundationProgressResponse;
import com.heang.koriaibackend.domain.foundation.mapper.FoundationProgressMapper;
import com.heang.koriaibackend.domain.foundation.model.FoundationProgress;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FoundationService {

    private final FoundationProgressMapper progressMapper;

    public List<FoundationProgressResponse> listProgress(Long userId) {
        return progressMapper.findByUser(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public FoundationProgressResponse complete(Long userId, String lessonId, FoundationCompleteRequest request) {
        FoundationProgress progress = FoundationProgress.builder()
                .userId(userId)
                .lessonId(lessonId)
                .track(request.track().trim())
                .completed(Boolean.TRUE.equals(request.completed()))
                .accuracy(request.accuracy())
                .build();
        progressMapper.upsert(progress);
        return toResponse(progressMapper.findByUserAndLesson(userId, lessonId));
    }

    private FoundationProgressResponse toResponse(FoundationProgress p) {
        return new FoundationProgressResponse(
                p.getLessonId(),
                p.getTrack(),
                p.isCompleted(),
                p.getAccuracy(),
                p.getAttempts()
        );
    }
}
