package com.heang.koriaibackend.domain.goal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heang.koriaibackend.common.ai.OpenAiService;
import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.exception.BusinessException;
import com.heang.koriaibackend.domain.goal.dto.CoachStreamRequest;
import com.heang.koriaibackend.domain.goal.mapper.GoalMapper;
import com.heang.koriaibackend.domain.goal.mapper.TaskMapper;
import com.heang.koriaibackend.domain.goal.model.Goal;
import com.heang.koriaibackend.domain.goal.model.Task;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Per-goal AI coach — a lightweight conversational chat scoped to one goal.
 * Ephemeral (no persistence): the client sends recent history each turn. The
 * coach prompt is seeded with the goal's details + task progress so replies are
 * grounded in the actual goal. Reuses {@link OpenAiService} streaming.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoalCoachService {

    private final GoalMapper goalMapper;
    private final TaskMapper taskMapper;
    private final OpenAiService openAiService;
    private final ObjectMapper objectMapper;

    @Value("${openai.model:gpt-5-mini}")
    private String aiModel;

    private static final int MAX_HISTORY = 12;

    public SseEmitter stream(Long userId, java.util.UUID goalId, CoachStreamRequest req) {
        if (goalMapper.findById(goalId) == null) {
            throw new BusinessException(Code.NOT_FOUND);
        }
        if (goalMapper.countAccess(goalId, userId) == 0) {
            throw new BusinessException(Code.INSUFFICIENT_PERMISSIONS);
        }
        Goal goal = goalMapper.findById(goalId);
        List<Task> tasks = taskMapper.findByGoal(goalId);
        String prompt = buildPrompt(goal, tasks, req);

        SseEmitter emitter = new SseEmitter(120_000L);
        CompletableFuture.runAsync(() -> {
            try {
                openAiService.generateStream(prompt, aiModel, token -> {
                    try {
                        emitter.send(SseEmitter.event()
                                .name("token")
                                .data(objectMapper.writeValueAsString(Map.of("token", token))));
                    } catch (IOException e) {
                        throw new RuntimeException("Client disconnected", e);
                    }
                });
                emitter.send(SseEmitter.event().name("done").data("{}"));
                emitter.complete();
            } catch (Exception e) {
                if (e.getMessage() == null || !e.getMessage().contains("Client disconnected")) {
                    try {
                        emitter.send(SseEmitter.event()
                                .name("error")
                                .data(objectMapper.writeValueAsString(Map.of("message", "Coach is unavailable right now."))));
                    } catch (Exception ignored) {
                        // nothing else we can do
                    }
                }
                emitter.completeWithError(e);
            }
        });
        return emitter;
    }

    private String buildPrompt(Goal goal, List<Task> tasks, CoachStreamRequest req) {
        long completed = tasks.stream().filter(Task::isCompleted).count();
        StringBuilder pending = new StringBuilder();
        tasks.stream()
                .filter(t -> !t.isCompleted())
                .limit(8)
                .forEach(t -> pending.append("- ").append(t.getTitle()).append("\n"));

        StringBuilder sb = new StringBuilder();
        sb.append("You are KoriAI's goal coach: an encouraging, practical assistant that helps the ")
                .append("user make progress on ONE specific goal. Keep replies concise and actionable. ")
                .append("Suggest concrete next steps; you may reference their tasks. Do not invent facts ")
                .append("about their progress beyond what is given.\n\n");
        sb.append("=== Goal ===\n");
        sb.append("Title: ").append(nullSafe(goal.getTitle())).append("\n");
        if (goal.getDescription() != null && !goal.getDescription().isBlank()) {
            sb.append("Description: ").append(goal.getDescription()).append("\n");
        }
        sb.append("Status: ").append(nullSafe(goal.getStatus())).append("\n");
        if (goal.getTargetDate() != null) {
            sb.append("Target date: ").append(goal.getTargetDate().toLocalDate()).append("\n");
        }
        sb.append("Tasks: ").append(completed).append("/").append(tasks.size()).append(" completed.\n");
        if (pending.length() > 0) {
            sb.append("Pending tasks:\n").append(pending);
        }
        sb.append("\n");

        if (req.history() != null && !req.history().isEmpty()) {
            sb.append("=== Conversation so far ===\n");
            int from = Math.max(0, req.history().size() - MAX_HISTORY);
            for (int i = from; i < req.history().size(); i++) {
                CoachStreamRequest.CoachMessage m = req.history().get(i);
                String speaker = "assistant".equalsIgnoreCase(m.role()) ? "Coach" : "User";
                sb.append(speaker).append(": ").append(nullSafe(m.content())).append("\n");
            }
            sb.append("\n");
        }
        sb.append("User: ").append(req.message().trim()).append("\nCoach:");
        return sb.toString();
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }
}
