package com.heang.koriaibackend.domain.reading.service;

import com.heang.koriaibackend.domain.reading.dto.ReadingProgressResponse;
import com.heang.koriaibackend.domain.reading.dto.ReadingQuizResultRequest;
import com.heang.koriaibackend.domain.reading.mapper.ReadingProgressMapper;
import com.heang.koriaibackend.domain.reading.model.ReadingProgress;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReadingProgressService {

    private final ReadingProgressMapper progressMapper;

    public List<ReadingProgressResponse> list(Long userId) {
        return progressMapper.findByUser(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReadingProgressResponse start(Long userId, Long unitId) {
        progressMapper.insertIfAbsent(userId, unitId, "in_progress");
        return toResponse(progressMapper.findByUserAndUnit(userId, unitId));
    }

    @Transactional
    public ReadingProgressResponse complete(Long userId, Long unitId) {
        progressMapper.upsertCompleted(userId, unitId);
        return toResponse(progressMapper.findByUserAndUnit(userId, unitId));
    }

    @Transactional
    public ReadingProgressResponse submitQuizResult(Long userId, Long unitId, ReadingQuizResultRequest request) {
        boolean passed = request.score() >= Math.ceil(request.total() * 0.6);
        ReadingProgress progress = ReadingProgress.builder()
                .userId(userId)
                .unitId(unitId)
                .status(passed ? "completed" : "in_progress")
                .quizScore(request.score())
                .quizTotal(request.total())
                .build();
        progressMapper.upsertQuizResult(progress);
        return toResponse(progressMapper.findByUserAndUnit(userId, unitId));
    }

    private ReadingProgressResponse toResponse(ReadingProgress p) {
        return new ReadingProgressResponse(
                String.valueOf(p.getUnitId()),
                p.getStatus(),
                p.getQuizScore(),
                p.getQuizTotal(),
                p.getCompletedAt() != null ? p.getCompletedAt().toString() : null
        );
    }
}
