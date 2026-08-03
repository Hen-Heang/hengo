package com.heang.koriaibackend.domain.listening.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heang.koriaibackend.common.ai.OpenAiService;
import com.heang.koriaibackend.common.utils.JsonUtils;
import com.heang.koriaibackend.common.ai.dto.OpenAiResult;
import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.exception.BusinessException;
import com.heang.koriaibackend.common.utils.PromptTemplates;
import com.heang.koriaibackend.domain.listening.dto.ListeningAttemptResponse;
import com.heang.koriaibackend.domain.listening.dto.ListeningLessonResponse;
import com.heang.koriaibackend.domain.listening.dto.QuizQuestion;
import com.heang.koriaibackend.domain.listening.dto.SubmitAttemptRequest;
import com.heang.koriaibackend.domain.listening.dto.TranscriptLine;
import com.heang.koriaibackend.domain.listening.mapper.ListeningMapper;
import com.heang.koriaibackend.domain.listening.model.ListeningAttempt;
import com.heang.koriaibackend.domain.listening.model.ListeningLesson;
import com.heang.koriaibackend.domain.usage.service.ApiUsageLogService;
import com.heang.koriaibackend.domain.users.mapper.UserMapper;
import com.heang.koriaibackend.domain.users.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ListeningService {

    public static final List<String> TOPICS = List.of(
            "Daily Standup",
            "Code Review",
            "Team Meeting",
            "Bug Discussion",
            "Deployment"
    );

    private final ListeningMapper listeningMapper;
    private final OpenAiService openAiService;
    private final ApiUsageLogService apiUsageLogService;
    private final UserMapper userMapper;
    private final ObjectMapper objectMapper;

    @Value("${openai.model:gpt-5-mini}")
    private String model;

    public List<String> topics() {
        return TOPICS;
    }

    @Transactional
    public ListeningLessonResponse generate(Long userId, String topic) {
        User user = userMapper.findById(userId).orElse(null);
        String level = (user != null && user.getKoreanLevel() != null) ? user.getKoreanLevel() : "BEGINNER";
        String safeTopic = (topic == null || topic.isBlank()) ? TOPICS.get(0) : topic.trim();

        String prompt = PromptTemplates.listeningLessonPrompt(safeTopic, level);
        OpenAiResult result = openAiService.generate(prompt, model);
        apiUsageLogService.log(userId, "LISTENING", result);

        LessonPayload payload = parsePayload(result.content());

        ListeningLesson lesson = ListeningLesson.builder()
                .userId(userId)
                .topic(safeTopic)
                .title(payload.title() != null ? payload.title() : safeTopic)
                .level(level)
                .transcript(toJson(payload.lines()))
                .quiz(toJson(payload.quiz()))
                .modelUsed(result.model())
                .build();
        listeningMapper.insertLesson(lesson);

        return toResponse(lesson, payload.lines(), payload.quiz());
    }

    public List<ListeningLessonResponse> listLessons(Long userId) {
        return listeningMapper.findLessonsByUserId(userId).stream()
                .map(l -> toResponse(l, parseLines(l.getTranscript()), parseQuiz(l.getQuiz())))
                .toList();
    }

    public ListeningLessonResponse getLesson(Long userId, Long id) {
        ListeningLesson lesson = listeningMapper.findLessonByIdAndUser(id, userId);
        if (lesson == null) {
            throw new BusinessException(Code.NOT_FOUND, "Listening lesson not found");
        }
        return toResponse(lesson, parseLines(lesson.getTranscript()), parseQuiz(lesson.getQuiz()));
    }

    @Transactional
    public ListeningAttemptResponse submitAttempt(Long userId, SubmitAttemptRequest request) {
        ListeningLesson lesson = listeningMapper.findLessonByIdAndUser(request.lessonId(), userId);
        if (lesson == null) {
            throw new BusinessException(Code.NOT_FOUND, "Listening lesson not found");
        }
        List<QuizQuestion> quiz = parseQuiz(lesson.getQuiz());
        List<Integer> answers = request.answers() != null ? request.answers() : Collections.emptyList();

        List<Boolean> results = new ArrayList<>();
        int score = 0;
        for (int i = 0; i < quiz.size(); i++) {
            Integer given = i < answers.size() ? answers.get(i) : null;
            boolean correct = given != null && given == quiz.get(i).answerIndex();
            results.add(correct);
            if (correct) {
                score++;
            }
        }
        int total = quiz.size();
        int accuracy = total == 0 ? 0 : Math.round((score * 100f) / total);

        ListeningAttempt attempt = ListeningAttempt.builder()
                .userId(userId)
                .lessonId(lesson.getId())
                .score(score)
                .total(total)
                .accuracy(accuracy)
                .completed(true)
                .build();
        listeningMapper.insertAttempt(attempt);

        return new ListeningAttemptResponse(String.valueOf(lesson.getId()), score, total, accuracy, results);
    }

    private ListeningLessonResponse toResponse(ListeningLesson lesson, List<TranscriptLine> lines, List<QuizQuestion> quiz) {
        return new ListeningLessonResponse(
                String.valueOf(lesson.getId()),
                lesson.getTopic(),
                lesson.getTitle(),
                lesson.getLevel(),
                lines,
                quiz,
                lesson.getCreatedAt() != null ? lesson.getCreatedAt().toString() : null
        );
    }

    private LessonPayload parsePayload(String json) {
        try {
            String cleaned = json.trim();
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start != -1 && end != -1) {
                cleaned = cleaned.substring(start, end + 1);
            }
            JsonNode node = objectMapper.readTree(cleaned);
            String title = node.path("title").asText(null);
            List<TranscriptLine> lines = objectMapper.convertValue(
                    node.path("lines"),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, TranscriptLine.class));
            List<QuizQuestion> quiz = objectMapper.convertValue(
                    node.path("quiz"),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, QuizQuestion.class));
            return new LessonPayload(
                    title,
                    lines != null ? lines : Collections.emptyList(),
                    quiz != null ? quiz : Collections.emptyList());
        } catch (JsonProcessingException | IllegalArgumentException e) {
            return new LessonPayload("Listening Lesson", Collections.emptyList(), Collections.emptyList());
        }
    }

    private List<TranscriptLine> parseLines(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, TranscriptLine.class));
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    private List<QuizQuestion> parseQuiz(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, QuizQuestion.class));
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    private <T> String toJson(List<T> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? Collections.emptyList() : values);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private record LessonPayload(String title, List<TranscriptLine> lines, List<QuizQuestion> quiz) {
    }
}
