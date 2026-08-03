package com.heang.koriaibackend.domain.dailyphrase.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.dailyphrase.dto.DailyPhraseResponse;
import com.heang.koriaibackend.domain.dailyphrase.service.DailyPhraseService;
import com.heang.koriaibackend.domain.vocab.dto.SentenceChallengeResponse;
import com.heang.koriaibackend.domain.vocab.dto.SentenceCheckRequest;
import com.heang.koriaibackend.domain.vocab.dto.SentenceCheckResponse;
import com.heang.koriaibackend.domain.vocab.dto.VocabItemResponse;
import com.heang.koriaibackend.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/daily-phrase")
@RequiredArgsConstructor
public class DailyPhraseController {

    private final DailyPhraseService dailyPhraseService;

    @GetMapping("/today")
    public ApiResponse<DailyPhraseResponse> today() {
        return ApiResponse.success(dailyPhraseService.getToday(SecurityUtils.currentUserId()));
    }

    @GetMapping("/history")
    public ApiResponse<List<DailyPhraseResponse>> history() {
        return ApiResponse.success(dailyPhraseService.history(SecurityUtils.currentUserId()));
    }

    @PostMapping("/{id}/learned")
    public ApiResponse<Void> markLearned(@PathVariable Long id,
                                         @RequestParam(defaultValue = "true") boolean learned) {
        dailyPhraseService.markLearned(SecurityUtils.currentUserId(), id, learned);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/flashcard")
    public ApiResponse<VocabItemResponse> addToFlashcards(@PathVariable Long id) {
        return ApiResponse.success(dailyPhraseService.addToFlashcards(SecurityUtils.currentUserId(), id));
    }

    @GetMapping("/{id}/practice")
    public ApiResponse<SentenceChallengeResponse> getPractice(@PathVariable Long id) {
        return ApiResponse.success(dailyPhraseService.getPracticeChallenge(SecurityUtils.currentUserId(), id));
    }

    @PostMapping("/{id}/check-practice")
    public ApiResponse<SentenceCheckResponse> checkPractice(@PathVariable Long id,
                                                             @RequestBody SentenceCheckRequest request) {
        return ApiResponse.success(dailyPhraseService.checkPractice(SecurityUtils.currentUserId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        dailyPhraseService.delete(SecurityUtils.currentUserId(), id);
        return ApiResponse.success(null);
    }
}
