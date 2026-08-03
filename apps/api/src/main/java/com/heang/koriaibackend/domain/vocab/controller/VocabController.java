package com.heang.koriaibackend.domain.vocab.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.vocab.dto.BestStreakResponse;
import com.heang.koriaibackend.domain.vocab.dto.ImportVocabRequest;
import com.heang.koriaibackend.domain.vocab.dto.SaveVocabRequest;
import com.heang.koriaibackend.domain.vocab.dto.SentenceChallengeResponse;
import com.heang.koriaibackend.domain.vocab.dto.SentenceCheckRequest;
import com.heang.koriaibackend.domain.vocab.dto.SentenceCheckResponse;
import com.heang.koriaibackend.domain.vocab.dto.UpdateVocabRequest;
import com.heang.koriaibackend.domain.vocab.dto.VocabItemResponse;
import com.heang.koriaibackend.domain.vocab.dto.WordLookupResponse;
import com.heang.koriaibackend.domain.vocab.model.ReviewRating;
import com.heang.koriaibackend.domain.vocab.service.VocabService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/vocab")
@RequiredArgsConstructor
public class VocabController {

    private final VocabService vocabService;

    @GetMapping
    public ApiResponse<List<VocabItemResponse>> getSavedWords() {
        return ApiResponse.success(vocabService.getSavedWords(SecurityUtils.currentUserId()));
    }

    @PostMapping("/save")
    public ApiResponse<VocabItemResponse> save(@Valid @RequestBody SaveVocabRequest request) {
        return ApiResponse.success(vocabService.saveManual(SecurityUtils.currentUserId(), request));
    }

    @GetMapping("/lookup")
    public ApiResponse<WordLookupResponse> lookup(@RequestParam String word) {
        return ApiResponse.success(vocabService.lookupWord(word));
    }

    @GetMapping("/review/due")
    public ApiResponse<List<VocabItemResponse>> getDueWords() {
        return ApiResponse.success(vocabService.getDueWords(SecurityUtils.currentUserId()));
    }

    // All-time best correct-streak in quiz/recall review mode, so it syncs across devices.
    @GetMapping("/best-streak")
    public ApiResponse<BestStreakResponse> getBestStreak() {
        return ApiResponse.success(vocabService.getBestStreak(SecurityUtils.currentUserId()));
    }

    @PostMapping("/best-streak")
    public ApiResponse<BestStreakResponse> submitBestStreak(@RequestParam int streak) {
        return ApiResponse.success(vocabService.submitBestStreak(SecurityUtils.currentUserId(), streak));
    }

    @PostMapping("/{id}/review")
    public ApiResponse<Void> markReviewed(@PathVariable Long id,
                                          @RequestParam(defaultValue = "true") boolean correct) {
        vocabService.markReviewed(SecurityUtils.currentUserId(), id, correct);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/rate")
    public ApiResponse<VocabItemResponse> rate(@PathVariable Long id, @RequestParam ReviewRating rating) {
        return ApiResponse.success(vocabService.rateCard(SecurityUtils.currentUserId(), id, rating));
    }

    @PostMapping("/generate")
    public ApiResponse<List<VocabItemResponse>> generate(
            @RequestParam String category,
            @RequestParam(defaultValue = "10") int count) {
        return ApiResponse.success(vocabService.generateByCategory(SecurityUtils.currentUserId(), category, Math.min(count, 20)));
    }

    @PutMapping("/{id}")
    public ApiResponse<VocabItemResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody UpdateVocabRequest request) {
        return ApiResponse.success(vocabService.updateCard(SecurityUtils.currentUserId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        vocabService.deleteCard(SecurityUtils.currentUserId(), id);
        return ApiResponse.success(null);
    }

    @PostMapping("/import")
    public ApiResponse<List<VocabItemResponse>> importList(@Valid @RequestBody ImportVocabRequest request) {
        return ApiResponse.success(vocabService.importList(SecurityUtils.currentUserId(), request));
    }

    @GetMapping("/{id}/sentence-challenge")
    public ApiResponse<SentenceChallengeResponse> getSentenceChallenge(@PathVariable Long id) {
        return ApiResponse.success(vocabService.getSentenceChallenge(SecurityUtils.currentUserId(), id));
    }

    @PostMapping("/{id}/check-sentence")
    public ApiResponse<SentenceCheckResponse> checkSentence(@PathVariable Long id,
                                                             @RequestBody SentenceCheckRequest request) {
        return ApiResponse.success(vocabService.checkSentence(SecurityUtils.currentUserId(), id, request));
    }
}
