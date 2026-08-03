package com.heang.koriaibackend.domain.practice.service;

import com.heang.koriaibackend.common.utils.RandomUtils;
import com.heang.koriaibackend.domain.correction.dto.CorrectionReviewResponse;
import com.heang.koriaibackend.domain.correction.service.CorrectionService;
import com.heang.koriaibackend.domain.dailyphrase.dto.DailyPhraseResponse;
import com.heang.koriaibackend.domain.dailyphrase.service.DailyPhraseService;
import com.heang.koriaibackend.domain.listening.service.ListeningService;
import com.heang.koriaibackend.domain.messagegen.service.MessageGeneratorService;
import com.heang.koriaibackend.domain.practice.dto.PracticeTodayResponse;
import com.heang.koriaibackend.domain.scenarios.dto.ScenarioResponse;
import com.heang.koriaibackend.domain.scenarios.service.ScenarioService;
import com.heang.koriaibackend.domain.users.mapper.UserMapper;
import com.heang.koriaibackend.domain.users.model.User;
import com.heang.koriaibackend.domain.vocab.dto.VocabItemResponse;
import com.heang.koriaibackend.domain.vocab.service.VocabService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PracticeService {

    private static final int VOCAB_SAMPLE_SIZE = 3;
    private static final int CORRECTION_SAMPLE_SIZE = 2;

    private final VocabService vocabService;
    private final DailyPhraseService dailyPhraseService;
    private final ScenarioService scenarioService;
    private final ListeningService listeningService;
    private final CorrectionService correctionService;
    private final UserMapper userMapper;

    public PracticeTodayResponse getToday(Long userId) {
        User user = userMapper.findById(userId).orElse(null);
        String level = (user != null && user.getKoreanLevel() != null) ? user.getKoreanLevel() : "BEGINNER";

        List<VocabItemResponse> dueWords = vocabService.getDueWords(userId);
        List<CorrectionReviewResponse> dueCorrections = correctionService.getDueReviews(userId);
        DailyPhraseResponse dailyPhrase = dailyPhraseService.getToday(userId);
        ScenarioResponse scenario = scenarioService.getRandomByLevel(toScenarioLevel(level));

        String messageCategory = RandomUtils.pickRandom(MessageGeneratorService.CATEGORIES);
        String listeningTopic = RandomUtils.pickRandom(listeningService.topics());

        return new PracticeTodayResponse(
                level,
                dueWords.size(),
                dueWords.stream().limit(VOCAB_SAMPLE_SIZE).toList(),
                dueCorrections.size(),
                dueCorrections.stream().limit(CORRECTION_SAMPLE_SIZE).toList(),
                dailyPhrase,
                scenario,
                messageCategory,
                listeningTopic
        );
    }

    private String toScenarioLevel(String koreanLevel) {
        return switch (koreanLevel.toUpperCase()) {
            case "ADVANCED" -> "Advanced";
            case "INTERMEDIATE" -> "Intermediate";
            default -> "Beginner";
        };
    }
}
