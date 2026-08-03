package com.heang.koriaibackend.domain.vocab.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heang.koriaibackend.common.ai.OpenAiService;
import com.heang.koriaibackend.common.ai.dto.OpenAiResult;
import com.heang.koriaibackend.common.utils.PromptTemplates;
import com.heang.koriaibackend.domain.users.mapper.UserMapper;
import com.heang.koriaibackend.domain.users.model.User;
import com.heang.koriaibackend.domain.vocab.dto.BestStreakResponse;
import com.heang.koriaibackend.domain.vocab.dto.ImportVocabRequest;
import com.heang.koriaibackend.domain.vocab.dto.SaveVocabRequest;
import com.heang.koriaibackend.domain.vocab.dto.SentenceChallengeResponse;
import com.heang.koriaibackend.domain.vocab.dto.SentenceCheckRequest;
import com.heang.koriaibackend.domain.vocab.dto.UpdateVocabRequest;
import com.heang.koriaibackend.domain.vocab.dto.SentenceCheckResponse;
import com.heang.koriaibackend.domain.vocab.dto.VocabItemResponse;
import com.heang.koriaibackend.domain.vocab.dto.WordLookupResponse;
import com.heang.koriaibackend.domain.vocab.mapper.VocabCardMapper;
import com.heang.koriaibackend.domain.vocab.model.ReviewRating;
import com.heang.koriaibackend.domain.vocab.model.VocabCard;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VocabService {

    private final VocabCardMapper vocabCardMapper;
    private final UserMapper userMapper;
    private final OpenAiService openAiService;
    private final ObjectMapper objectMapper;

    @Value("${openai.model:gpt-5-mini}")
    private String model;

    public List<VocabItemResponse> getSavedWords(Long userId) {
        return vocabCardMapper.findByUserId(userId).stream()
                .map(VocabItemResponse::from)
                .toList();
    }

    public List<VocabItemResponse> getDueWords(Long userId) {
        return vocabCardMapper.findDueByUserId(userId).stream()
                .map(VocabItemResponse::from)
                .toList();
    }

    public BestStreakResponse getBestStreak(Long userId) {
        return new BestStreakResponse(userMapper.findById(userId).map(User::getVocabBestStreak).orElse(0));
    }

    /** A submitted streak only ever raises the stored best; returns the resulting best. */
    @Transactional
    public BestStreakResponse submitBestStreak(Long userId, int streak) {
        userMapper.updateVocabBestStreakIfHigher(userId, streak);
        return getBestStreak(userId);
    }

    @Transactional
    public VocabItemResponse saveManual(Long userId, SaveVocabRequest request) {
        VocabCard card = VocabCard.builder()
                .userId(userId)
                .category(normalizeCategory(request.category()))
                .term(request.term().trim())
                .meaning(request.meaning().trim())
                .example(hasText(request.example()) ? request.example().trim() : null)
                .mastery(0)
                .tags("[]")
                .build();
        vocabCardMapper.insert(card);
        return VocabItemResponse.from(card);
    }

    /** Legacy binary review — kept for older clients; maps onto the SM-2 grades. */
    @Transactional
    public void markReviewed(Long userId, Long cardId, boolean correct) {
        rateCard(userId, cardId, correct ? ReviewRating.GOOD : ReviewRating.AGAIN);
    }

    @Transactional
    public VocabItemResponse rateCard(Long userId, Long cardId, ReviewRating rating) {
        VocabCard card = vocabCardMapper.findByIdAndUser(cardId, userId);
        if (card == null) {
            throw new RuntimeException("Card not found");
        }

        SrsScheduler.Result next = SrsScheduler.rate(
                card.getEaseFactor(), card.getIntervalDays(), card.getRepetitions(), card.getLapses(), rating);

        card.setEaseFactor(next.easeFactor());
        card.setIntervalDays(next.intervalDays());
        card.setRepetitions(next.repetitions());
        card.setLapses(next.lapses());
        card.setMastery(next.mastery());
        card.setNextReviewDate(next.nextReview());
        vocabCardMapper.updateSrs(card);
        return VocabItemResponse.from(card);
    }

    @Transactional
    public List<VocabItemResponse> generateByCategory(Long userId, String category, int count) {
        User user = userMapper.findById(userId).orElse(null);
        String level = (user != null) ? user.getKoreanLevel() : "BEGINNER";

        String prompt = PromptTemplates.vocabGenerationPrompt(category, level, count);
        OpenAiResult result = openAiService.generate(prompt, model);

        List<VocabCard> cards = parseVocabCards(userId, category, result.content());
        cards.forEach(vocabCardMapper::insert);
        return cards.stream().map(VocabItemResponse::from).toList();
    }

    @Transactional
    public VocabItemResponse updateCard(Long userId, Long cardId, UpdateVocabRequest request) {
        VocabCard existing = vocabCardMapper.findByIdAndUser(cardId, userId);
        if (existing == null) {
            throw new RuntimeException("Card not found");
        }
        String category = hasText(request.category()) ? request.category().trim() : existing.getCategory();
        vocabCardMapper.updateCard(
                cardId,
                userId,
                category,
                request.term().trim(),
                request.meaning().trim(),
                hasText(request.example()) ? request.example().trim() : null,
                hasText(request.pronunciation()) ? request.pronunciation().trim() : null
        );
        return VocabItemResponse.from(vocabCardMapper.findByIdAndUser(cardId, userId));
    }

    @Transactional
    public void deleteCard(Long userId, Long cardId) {
        int deleted = vocabCardMapper.deleteByIdAndUser(cardId, userId);
        if (deleted == 0) {
            throw new RuntimeException("Card not found");
        }
    }

    @Transactional
    public List<VocabItemResponse> importList(Long userId, ImportVocabRequest request) {
        String prompt = PromptTemplates.vocabImportPrompt(request.text());
        OpenAiResult result = openAiService.generate(prompt, model);

        List<VocabCard> cards = parseImportedCards(userId, request.category().trim(), result.content());
        cards.forEach(vocabCardMapper::insert);
        return cards.stream().map(VocabItemResponse::from).toList();
    }

    private List<VocabCard> parseImportedCards(Long userId, String category, String json) {
        try {
            String cleaned = json.trim();
            int start = cleaned.indexOf('[');
            int end = cleaned.lastIndexOf(']');
            if (start == -1 || end == -1) return Collections.emptyList();
            cleaned = cleaned.substring(start, end + 1);

            JsonNode array = objectMapper.readTree(cleaned);
            List<VocabCard> cards = new ArrayList<>();
            for (JsonNode node : array) {
                String term = node.path("term").asText("").trim();
                String meaning = node.path("meaning").asText("").trim();
                if (term.isEmpty() || meaning.isEmpty()) continue;

                String meaningEn = node.path("meaningEn").asText(null);
                String pos = node.path("partOfSpeech").asText(null);
                String pronunciation = node.path("pronunciation").asText(null);
                String tags = hasText(pos) ? "[\"" + pos.replace("\"", "") + "\"]" : "[]";

                // The user's own translation is the primary meaning; the English
                // gloss rides along so Korean→English study modes still work.
                cards.add(VocabCard.builder()
                        .userId(userId)
                        .category(category)
                        .term(term)
                        .meaning(hasText(meaningEn) ? meaning + " — " + meaningEn : meaning)
                        .pronunciation(hasText(pronunciation) ? pronunciation : null)
                        .mastery(0)
                        .tags(tags)
                        .build());
            }
            return cards;
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    public SentenceChallengeResponse getSentenceChallenge(Long userId, Long cardId) {
        VocabCard card = vocabCardMapper.findByUserId(userId).stream()
                .filter(c -> c.getId().equals(cardId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Card not found"));

        String prompt = PromptTemplates.sentenceChallengePrompt(card.getTerm(), card.getMeaning());
        OpenAiResult result = openAiService.generate(prompt, model);

        try {
            String cleaned = result.content().trim();
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start != -1 && end != -1) cleaned = cleaned.substring(start, end + 1);
            JsonNode node = objectMapper.readTree(cleaned);
            return new SentenceChallengeResponse(
                    String.valueOf(cardId),
                    card.getTerm(),
                    card.getMeaning(),
                    node.path("challengePrompt").asText("Write a sentence using this word."),
                    node.path("contextHint").asText(""),
                    node.path("exampleAnswer").asText("")
            );
        } catch (JsonProcessingException e) {
            return new SentenceChallengeResponse(
                    String.valueOf(cardId), card.getTerm(), card.getMeaning(),
                    "Write a Korean sentence using the word: " + card.getTerm(), "", "");
        }
    }

    public SentenceCheckResponse checkSentence(Long userId, Long cardId, SentenceCheckRequest request) {
        VocabCard card = vocabCardMapper.findByUserId(userId).stream()
                .filter(c -> c.getId().equals(cardId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Card not found"));

        String prompt = PromptTemplates.sentenceCheckPrompt(
                card.getTerm(), card.getMeaning(),
                request.challengePrompt(), request.attempt());
        OpenAiResult result = openAiService.generate(prompt, model);

        try {
            String cleaned = result.content().trim();
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start != -1 && end != -1) cleaned = cleaned.substring(start, end + 1);
            JsonNode node = objectMapper.readTree(cleaned);
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

    public WordLookupResponse lookupWord(String word) {
        String term = word.trim();
        String prompt = PromptTemplates.wordLookupPrompt(term);
        OpenAiResult result = openAiService.generate(prompt, model);

        try {
            String cleaned = result.content().trim();
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start != -1 && end != -1) cleaned = cleaned.substring(start, end + 1);
            JsonNode node = objectMapper.readTree(cleaned);
            String hanja = node.path("hanja").asText(null);
            return new WordLookupResponse(
                    term,
                    node.path("definition").asText("No definition found."),
                    node.path("example").asText(null),
                    node.path("exampleTranslation").asText(null),
                    hasText(hanja) && !"null".equalsIgnoreCase(hanja) ? hanja : null
            );
        } catch (JsonProcessingException e) {
            return new WordLookupResponse(term, "Could not fetch definition.", null, null, null);
        }
    }

    private List<VocabCard> parseVocabCards(Long userId, String category, String json) {
        try {
            String cleaned = json.trim();
            int start = cleaned.indexOf('[');
            int end = cleaned.lastIndexOf(']');
            if (start == -1 || end == -1) return Collections.emptyList();
            cleaned = cleaned.substring(start, end + 1);

            JsonNode array = objectMapper.readTree(cleaned);
            List<VocabCard> cards = new ArrayList<>();
            for (JsonNode node : array) {
                String tagsJson = node.has("tags") ? node.get("tags").toString() : "[]";
                String pronunciation = node.path("pronunciation").asText(null);
                String difficulty = node.path("difficultyLevel").asText(null);
                cards.add(VocabCard.builder()
                        .userId(userId)
                        .category(category)
                        .term(node.path("term").asText(""))
                        .meaning(node.path("meaning").asText(""))
                        .pronunciation(hasText(pronunciation) ? pronunciation : null)
                        .difficultyLevel(hasText(difficulty) ? difficulty : null)
                        .example(node.path("example").asText(null))
                        .exampleTranslation(node.path("exampleTranslation").asText(null))
                        .mastery(0)
                        .tags(tagsJson)
                        .build());
            }
            return cards;
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    private String normalizeCategory(String category) {
        return hasText(category) ? category.trim() : "Saved phrases";
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
