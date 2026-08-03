package com.heang.koriaibackend.domain.dailyphrase.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heang.koriaibackend.common.ai.OpenAiService;
import com.heang.koriaibackend.common.utils.JsonUtils;
import com.heang.koriaibackend.common.ai.dto.OpenAiResult;
import com.heang.koriaibackend.common.exception.BusinessException;
import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.utils.PromptTemplates;
import com.heang.koriaibackend.domain.dailyphrase.dto.DailyPhraseResponse;
import com.heang.koriaibackend.domain.dailyphrase.dto.SimilarExpression;
import com.heang.koriaibackend.domain.dailyphrase.mapper.DailyPhraseMapper;
import com.heang.koriaibackend.domain.dailyphrase.model.DailyPhrase;
import com.heang.koriaibackend.domain.usage.service.ApiUsageLogService;
import com.heang.koriaibackend.domain.users.mapper.UserMapper;
import com.heang.koriaibackend.domain.users.model.User;
import com.heang.koriaibackend.domain.vocab.dto.SentenceChallengeResponse;
import com.heang.koriaibackend.domain.vocab.dto.SentenceCheckRequest;
import com.heang.koriaibackend.domain.vocab.dto.SentenceCheckResponse;
import com.heang.koriaibackend.domain.vocab.dto.VocabItemResponse;
import com.heang.koriaibackend.domain.vocab.mapper.VocabCardMapper;
import com.heang.koriaibackend.domain.vocab.model.VocabCard;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DailyPhraseService {

    private final DailyPhraseMapper dailyPhraseMapper;
    private final VocabCardMapper vocabCardMapper;
    private final UserMapper userMapper;
    private final OpenAiService openAiService;
    private final ApiUsageLogService apiUsageLogService;
    private final ObjectMapper objectMapper;

    @Value("${openai.model:gpt-5-mini}")
    private String model;

    @Transactional
    public DailyPhraseResponse getToday(Long userId) {
        DailyPhrase existing = dailyPhraseMapper.findByUserAndDate(userId, LocalDate.now());
        if (existing != null) {
            return DailyPhraseResponse.from(existing, parseSimilar(existing.getSimilarExpressions()));
        }
        return generateForToday(userId);
    }

    @Transactional
    public DailyPhraseResponse generateForToday(Long userId) {
        User user = userMapper.findById(userId).orElse(null);
        String level = (user != null && user.getKoreanLevel() != null) ? user.getKoreanLevel() : "BEGINNER";

        List<String> recent = dailyPhraseMapper.findRecentPhrases(userId, 10);
        String avoidList = String.join(", ", recent);

        String prompt = PromptTemplates.dailyPhrasePrompt(level, avoidList);
        OpenAiResult result = openAiService.generate(prompt, model);

        PhrasePayload payload = parsePayload(result.content());
        String similarJson = toJson(payload.similarExpressions());

        DailyPhrase phrase = DailyPhrase.builder()
                .userId(userId)
                .phraseKr(payload.phrase())
                .meaningEn(payload.meaning())
                .romanization(payload.romanization())
                .whenToUse(payload.whenToUse())
                .formalityLevel(payload.formality())
                .similarExpressions(similarJson)
                .learned(false)
                .modelUsed(result.model())
                .build();
        dailyPhraseMapper.insert(phrase);
        apiUsageLogService.log(userId, "DAILY_PHRASE", result);

        return DailyPhraseResponse.from(phrase, payload.similarExpressions());
    }

    public List<DailyPhraseResponse> history(Long userId) {
        return dailyPhraseMapper.findByUserId(userId).stream()
                .map(p -> DailyPhraseResponse.from(p, parseSimilar(p.getSimilarExpressions())))
                .toList();
    }

    @Transactional
    public void markLearned(Long userId, Long id, boolean learned) {
        dailyPhraseMapper.updateLearned(id, userId, learned);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        int deleted = dailyPhraseMapper.deleteByIdAndUser(id, userId);
        if (deleted == 0) {
            throw new BusinessException(Code.NOT_FOUND, "Daily phrase not found");
        }
    }

    @Transactional
    public VocabItemResponse addToFlashcards(Long userId, Long id) {
        DailyPhrase phrase = dailyPhraseMapper.findByIdAndUser(id, userId);
        if (phrase == null) {
            throw new BusinessException(Code.NOT_FOUND, "Daily phrase not found");
        }
        VocabCard card = VocabCard.builder()
                .userId(userId)
                .category("Daily phrase")
                .term(phrase.getPhraseKr())
                .meaning(phrase.getMeaningEn())
                .example(phrase.getWhenToUse())
                .mastery(0)
                .tags("[]")
                .build();
        vocabCardMapper.insert(card);
        return VocabItemResponse.from(card);
    }

    public SentenceChallengeResponse getPracticeChallenge(Long userId, Long id) {
        DailyPhrase phrase = dailyPhraseMapper.findByIdAndUser(id, userId);
        if (phrase == null) throw new BusinessException(Code.NOT_FOUND, "Daily phrase not found");

        String prompt = PromptTemplates.sentenceChallengePrompt(phrase.getPhraseKr(), phrase.getMeaningEn());
        OpenAiResult result = openAiService.generate(prompt, model);

        try {
            String cleaned = result.content().trim();
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start != -1 && end != -1) cleaned = cleaned.substring(start, end + 1);
            var node = objectMapper.readTree(cleaned);
            return new SentenceChallengeResponse(
                    String.valueOf(id),
                    phrase.getPhraseKr(),
                    phrase.getMeaningEn(),
                    node.path("challengePrompt").asText("Write a sentence using today's phrase."),
                    node.path("contextHint").asText(""),
                    node.path("exampleAnswer").asText("")
            );
        } catch (JsonProcessingException e) {
            return new SentenceChallengeResponse(String.valueOf(id), phrase.getPhraseKr(), phrase.getMeaningEn(),
                    "Write a Korean sentence using today's phrase: " + phrase.getPhraseKr(), "", "");
        }
    }

    public SentenceCheckResponse checkPractice(Long userId, Long id, SentenceCheckRequest request) {
        DailyPhrase phrase = dailyPhraseMapper.findByIdAndUser(id, userId);
        if (phrase == null) throw new BusinessException(Code.NOT_FOUND, "Daily phrase not found");

        String prompt = PromptTemplates.sentenceCheckPrompt(
                phrase.getPhraseKr(), phrase.getMeaningEn(),
                request.challengePrompt(), request.attempt());
        OpenAiResult result = openAiService.generate(prompt, model);

        try {
            String cleaned = result.content().trim();
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start != -1 && end != -1) cleaned = cleaned.substring(start, end + 1);
            var node = objectMapper.readTree(cleaned);
            return new SentenceCheckResponse(
                    node.path("score").asInt(0),
                    node.path("correct").asBoolean(false),
                    node.path("feedback").asText(""),
                    node.path("correctedSentence").asText(""),
                    node.path("betterAlternative").asText(""),
                    node.path("grammarNote").asText("")
            );
        } catch (JsonProcessingException e) {
            return new SentenceCheckResponse(0, false, "Could not evaluate. Please try again.", "", "", "");
        }
    }

    private List<SimilarExpression> parseSimilar(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, SimilarExpression.class));
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    private PhrasePayload parsePayload(String json) {
        try {
            String cleaned = json.trim();
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start != -1 && end != -1) {
                cleaned = cleaned.substring(start, end + 1);
            }
            return objectMapper.readValue(cleaned, PhrasePayload.class);
        } catch (JsonProcessingException e) {
            return new PhrasePayload(
                    "확인 후 말씀드리겠습니다.",
                    "I will check and get back to you.",
                    "hwagin hu malsseumdeurigesseumnida",
                    "Use this when you need time to verify something before answering a coworker.",
                    "Formal business",
                    Collections.emptyList());
        }
    }

    private String toJson(List<SimilarExpression> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? Collections.emptyList() : values);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private record PhrasePayload(
            String phrase,
            String meaning,
            String romanization,
            String whenToUse,
            String formality,
            List<SimilarExpression> similarExpressions) {
    }
}
