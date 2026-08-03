package com.heang.koriaibackend.domain.users.service;

import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.exception.BusinessException;
import com.heang.koriaibackend.domain.correction.dto.CorrectionResponse;
import com.heang.koriaibackend.domain.correction.service.CorrectionService;
import com.heang.koriaibackend.domain.dashboard.mapper.DashboardMapper;
import com.heang.koriaibackend.domain.users.dto.LevelSuggestionResponse;
import com.heang.koriaibackend.domain.users.mapper.UserMapper;
import com.heang.koriaibackend.domain.users.model.User;
import com.heang.koriaibackend.domain.vocab.dto.VocabItemResponse;
import com.heang.koriaibackend.domain.vocab.service.VocabService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Suggests leveling a learner up from their real activity (streak, vocab
 * mastery, grammar-correction accuracy) instead of leaving koreanLevel as a
 * one-time manual profile field. Never downgrades — only ever proposes moving
 * up, and only once enough activity exists to trust the signal.
 */
@Service
@RequiredArgsConstructor
public class LevelAdvisorService {

    private static final List<String> LEVEL_ORDER = List.of("BEGINNER", "INTERMEDIATE", "ADVANCED");
    private static final int MIN_CORRECTIONS_SAMPLE = 8;

    private record Thresholds(int streakDays, int wordsSaved, double avgMastery, double avgRating) {
    }

    private static final Map<String, Thresholds> UPGRADE_THRESHOLDS = Map.of(
            "INTERMEDIATE", new Thresholds(7, 20, 50, 3.5),
            "ADVANCED", new Thresholds(14, 60, 70, 4.0)
    );

    private final UserMapper userMapper;
    private final DashboardMapper dashboardMapper;
    private final VocabService vocabService;
    private final CorrectionService correctionService;

    public LevelSuggestionResponse getSuggestion(Long userId) {
        User user = userMapper.findById(userId)
                .orElseThrow(() -> new BusinessException(Code.NOT_FOUND, "User not found"));
        String currentLevel = normalize(user.getKoreanLevel());

        int streakDays = dashboardMapper.countStreakDays(userId);
        int wordsSaved = dashboardMapper.countTotalWordsSaved(userId);

        List<VocabItemResponse> words = vocabService.getSavedWords(userId);
        double avgMastery = words.isEmpty() ? 0
                : words.stream().mapToInt(VocabItemResponse::mastery).average().orElse(0);

        List<CorrectionResponse> recentCorrections = correctionService.history(userId, MIN_CORRECTIONS_SAMPLE);
        double avgRating = recentCorrections.isEmpty() ? 0
                : recentCorrections.stream()
                        .filter(c -> c.rating() != null)
                        .mapToInt(CorrectionResponse::rating)
                        .average().orElse(0);
        boolean enoughCorrectionData = recentCorrections.size() >= MIN_CORRECTIONS_SAMPLE;

        String nextLevel = nextLevel(currentLevel);
        if (nextLevel == null) {
            return new LevelSuggestionResponse(currentLevel, null, false,
                    "You're already at the highest level.", streakDays, wordsSaved, round(avgMastery), round(avgRating));
        }

        Thresholds t = UPGRADE_THRESHOLDS.get(nextLevel);
        boolean meets = streakDays >= t.streakDays()
                && wordsSaved >= t.wordsSaved()
                && avgMastery >= t.avgMastery()
                && enoughCorrectionData
                && avgRating >= t.avgRating();

        String reason = meets
                ? "Your streak, vocab mastery, and grammar accuracy all support moving up to " + nextLevel + "."
                : "Keep building your streak (%d/%d), saved words (%d/%d), vocab mastery (%.0f%%/%.0f%%) and grammar accuracy to unlock %s."
                        .formatted(streakDays, t.streakDays(), wordsSaved, t.wordsSaved(), avgMastery, t.avgMastery(), nextLevel);

        return new LevelSuggestionResponse(currentLevel, meets ? nextLevel : null, meets, reason,
                streakDays, wordsSaved, round(avgMastery), round(avgRating));
    }

    @Transactional
    public User applyLevel(Long userId, String requestedLevel) {
        LevelSuggestionResponse suggestion = getSuggestion(userId);
        if (!suggestion.upgradeAvailable() || !suggestion.suggestedLevel().equalsIgnoreCase(requestedLevel)) {
            throw new BusinessException(Code.BAD_REQUEST, "No matching level upgrade is currently available");
        }
        userMapper.updateKoreanLevel(userId, suggestion.suggestedLevel());
        return userMapper.findById(userId)
                .orElseThrow(() -> new BusinessException(Code.NOT_FOUND, "User not found"));
    }

    private static String nextLevel(String currentLevel) {
        int index = LEVEL_ORDER.indexOf(currentLevel);
        if (index < 0 || index + 1 >= LEVEL_ORDER.size()) {
            return null;
        }
        return LEVEL_ORDER.get(index + 1);
    }

    private static String normalize(String level) {
        if (level == null || !LEVEL_ORDER.contains(level.toUpperCase())) {
            return "BEGINNER";
        }
        return level.toUpperCase();
    }

    private static double round(double value) {
        return Math.round(value * 10) / 10.0;
    }
}
