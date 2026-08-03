package com.heang.koriaibackend.domain.achievements.service;

import com.heang.koriaibackend.domain.achievements.dto.AchievementResponse;
import com.heang.koriaibackend.domain.achievements.dto.AchievementSummaryResponse;
import com.heang.koriaibackend.domain.achievements.dto.LevelInfo;
import com.heang.koriaibackend.domain.achievements.mapper.AchievementMapper;
import com.heang.koriaibackend.domain.achievements.model.Achievement;
import com.heang.koriaibackend.domain.achievements.model.UserAchievement;
import com.heang.koriaibackend.domain.correction.mapper.SentenceCorrectionMapper;
import com.heang.koriaibackend.domain.dashboard.mapper.DashboardMapper;
import com.heang.koriaibackend.domain.listening.mapper.ListeningMapper;
import com.heang.koriaibackend.domain.usage.mapper.ApiUsageLogMapper;
import com.heang.koriaibackend.domain.users.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AchievementService {

    // XP thresholds for each learning level (ascending).
    private static final int[] LEVEL_XP = {0, 100, 300, 600, 1000, 1600};
    private static final String[] LEVEL_NAMES = {
            "Rookie", "Apprentice", "Practitioner", "Professional", "Expert", "Master"
    };

    private static final List<String> LEVEL_ORDER = List.of("BEGINNER", "INTERMEDIATE", "ADVANCED");

    private final AchievementMapper achievementMapper;
    private final DashboardMapper dashboardMapper;
    private final ListeningMapper listeningMapper;
    private final SentenceCorrectionMapper sentenceCorrectionMapper;
    private final ApiUsageLogMapper apiUsageLogMapper;
    private final UserMapper userMapper;

    /**
     * Evaluate the user's metrics and unlock any newly earned achievements.
     * Returns the achievements unlocked by this call (empty if none).
     */
    @Transactional
    public List<AchievementResponse> evaluate(Long userId) {
        Map<String, Integer> metrics = computeMetrics(userId);
        List<Achievement> catalog = achievementMapper.findCatalog();
        Map<String, OffsetDateTime> unlocked = unlockedMap(userId);

        List<AchievementResponse> newlyUnlocked = new ArrayList<>();
        for (Achievement a : catalog) {
            if (unlocked.containsKey(a.getCode())) {
                continue;
            }
            int value = metrics.getOrDefault(a.getMetric(), 0);
            if (value >= a.getThreshold()) {
                achievementMapper.insertUnlocked(userId, a.getCode());
                newlyUnlocked.add(toResponse(a, true, null));
            }
        }
        return newlyUnlocked;
    }

    @Transactional
    public AchievementSummaryResponse getSummary(Long userId) {
        evaluate(userId);

        List<Achievement> catalog = achievementMapper.findCatalog();
        Map<String, OffsetDateTime> unlocked = unlockedMap(userId);

        List<AchievementResponse> responses = new ArrayList<>();
        int totalXp = 0;
        int unlockedCount = 0;
        for (Achievement a : catalog) {
            boolean isUnlocked = unlocked.containsKey(a.getCode());
            OffsetDateTime at = unlocked.get(a.getCode());
            responses.add(toResponse(a, isUnlocked, at != null ? at.toString() : null));
            if (isUnlocked) {
                totalXp += a.getXp();
                unlockedCount++;
            }
        }

        return new AchievementSummaryResponse(
                buildLevel(totalXp),
                unlockedCount,
                catalog.size(),
                responses);
    }

    private Map<String, Integer> computeMetrics(Long userId) {
        int vocab = achievementMapper.countVocab(userId);
        int corrections = achievementMapper.countCorrections(userId);
        int chat = achievementMapper.countChatMessages(userId);
        int listening = listeningMapper.countCompletedAttempts(userId);
        int streak = dashboardMapper.countStreakDays(userId);
        int mistakesFixed = sentenceCorrectionMapper.countReviewed(userId);
        int messageGen = apiUsageLogMapper.countByUserAndFeature(userId, "MESSAGE_GEN");
        int dailyPhrase = apiUsageLogMapper.countByUserAndFeature(userId, "DAILY_PHRASE");
        int level = userMapper.findById(userId)
                .map(u -> Math.max(0, LEVEL_ORDER.indexOf(normalizeLevel(u.getKoreanLevel()))))
                .orElse(0);

        Map<String, Integer> metrics = new HashMap<>();
        metrics.put("vocab", vocab);
        metrics.put("corrections", corrections);
        metrics.put("chat", chat);
        metrics.put("listening", listening);
        metrics.put("streak", streak);
        metrics.put("activity", vocab + corrections + chat + listening);
        metrics.put("mistakes_fixed", mistakesFixed);
        metrics.put("message_gen", messageGen);
        metrics.put("daily_phrase", dailyPhrase);
        metrics.put("level", level);
        return metrics;
    }

    private static String normalizeLevel(String level) {
        return level != null && LEVEL_ORDER.contains(level.toUpperCase()) ? level.toUpperCase() : "BEGINNER";
    }

    private Map<String, OffsetDateTime> unlockedMap(Long userId) {
        Map<String, OffsetDateTime> map = new HashMap<>();
        for (UserAchievement ua : achievementMapper.findUnlockedByUser(userId)) {
            map.put(ua.getAchievementCode(), ua.getUnlockedAt());
        }
        return map;
    }

    private LevelInfo buildLevel(int totalXp) {
        int index = 0;
        for (int i = 0; i < LEVEL_XP.length; i++) {
            if (totalXp >= LEVEL_XP[i]) {
                index = i;
            }
        }
        int currentThreshold = LEVEL_XP[index];
        int xpIntoLevel = totalXp - currentThreshold;

        boolean hasNext = index < LEVEL_XP.length - 1;
        Integer xpForNextLevel = hasNext ? (LEVEL_XP[index + 1] - currentThreshold) : null;
        String nextLevelName = hasNext ? LEVEL_NAMES[index + 1] : null;

        return new LevelInfo(index + 1, LEVEL_NAMES[index], totalXp, xpIntoLevel, xpForNextLevel, nextLevelName);
    }

    private AchievementResponse toResponse(Achievement a, boolean unlocked, String unlockedAt) {
        return new AchievementResponse(
                a.getCode(),
                a.getTitle(),
                a.getDescription(),
                a.getIcon(),
                a.getCategory(),
                a.getXp(),
                unlocked,
                unlockedAt);
    }
}
