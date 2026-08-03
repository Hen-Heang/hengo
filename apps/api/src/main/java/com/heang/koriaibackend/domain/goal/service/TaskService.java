package com.heang.koriaibackend.domain.goal.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heang.koriaibackend.common.ai.OpenAiService;
import com.heang.koriaibackend.common.ai.dto.OpenAiResult;
import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.exception.BusinessException;
import com.heang.koriaibackend.common.utils.DateTimeUtils;
import com.heang.koriaibackend.domain.goal.dto.CreateTaskRequest;
import com.heang.koriaibackend.domain.goal.dto.GenerateTasksRequest;
import com.heang.koriaibackend.domain.goal.dto.TaskResponse;
import com.heang.koriaibackend.domain.goal.dto.UpdateTaskRequest;
import com.heang.koriaibackend.domain.goal.mapper.GoalMapper;
import com.heang.koriaibackend.domain.goal.mapper.GoalMemberMapper;
import com.heang.koriaibackend.domain.goal.mapper.TaskMapper;
import com.heang.koriaibackend.domain.goal.model.Goal;
import com.heang.koriaibackend.domain.goal.model.Task;
import com.heang.koriaibackend.domain.usage.service.ApiUsageLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Task CRUD with service-layer authorization (replacing Supabase RLS):
 *   a task is writable by its owner or by the owner/members of its goal.
 *   A standalone task (null goal) is private to its owner.
 */

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskMapper taskMapper;
    private final GoalMapper goalMapper;
    private final GoalMemberMapper goalMemberMapper;
    private final GoalNotificationService notificationService;
    private final OpenAiService openAiService;
    private final ApiUsageLogService apiUsageLogService;
    private final ObjectMapper objectMapper;

    @Value("${openai.model:gpt-5-mini}")
    private String aiModel;

    private static String taskUrl(UUID goalId) {
        return goalId != null ? "/goals/" + goalId : "/goals/calendar";
    }

    /** Tasks for a goal (used by GET /goals/{id}/tasks). */
    public List<TaskResponse> listByGoal(Long userId, UUID goalId) {
        requireGoalAccess(userId, goalId);
        return taskMapper.findByGoal(goalId).stream().map(TaskResponse::of).toList();
    }

    /** Calendar range query: goalId null = all the user's tasks; otherwise that goal's tasks. */
    public List<TaskResponse> listRange(Long userId, UUID goalId, String from, String to) {
        if (goalId != null) {
            requireGoalAccess(userId, goalId);
        }
        return taskMapper.findRange(userId, goalId, DateTimeUtils.parseTimestamp(from), DateTimeUtils.parseTimestamp(to))
                .stream().map(TaskResponse::of).toList();
    }

    @Transactional
    public TaskResponse createTask(Long userId, CreateTaskRequest req) {
        if (req.goalId() != null) {
            requireGoalWrite(userId, req.goalId());
        }
        String title = (req.title() != null && !req.title().isBlank()) ? req.title().trim() : "Untitled task";
        Task task = Task.builder()
                .id(UUID.randomUUID())
                .goalId(req.goalId())
                .userId(userId)
                .title(title)
                .description(req.description())
                .completed(Boolean.TRUE.equals(req.completed()))
                .startDate(DateTimeUtils.parseTimestamp(req.startDate()))
                .endDate(DateTimeUtils.parseTimestamp(req.endDate()))
                .dailyStartTime(parseTime(req.dailyStartTime()))
                .dailyEndTime(parseTime(req.dailyEndTime()))
                .anytime(Boolean.TRUE.equals(req.isAnytime()))
                .durationMinutes(req.durationMinutes())
                .color(req.color())
                .tags(req.tags() == null ? Collections.emptyList() : req.tags())
                .updatedBy(userId)
                .build();
        taskMapper.insert(task);
        notificationService.notifySelf(userId, "task_created", task.getGoalId(), taskUrl(task.getGoalId()));
        return TaskResponse.of(taskMapper.findById(task.getId()));
    }

    /**
     * AI-generate a set of tasks for a goal and insert them, spread across the
     * goal's date window. Ported from Orbit's generate-tasks edge function;
     * reuses KoriAI's existing {@link OpenAiService}. Returns the created tasks.
     */
    @Transactional
    public List<TaskResponse> generateTasks(Long userId, UUID goalId, GenerateTasksRequest req) {
        requireGoalWrite(userId, goalId);
        Goal goal = goalMapper.findById(goalId);
        if (goal == null) {
            throw new BusinessException(Code.NOT_FOUND);
        }

        int count = req != null && req.count() != null ? Math.max(1, Math.min(14, req.count())) : 7;
        OffsetDateTime start = goalStart(goal);
        int windowDays = goalWindowDays(goal, start);
        String goalType = metadataText(goal, "goal_type", "general");

        String prompt = buildTaskPrompt(goal.getTitle(), goal.getDescription(), goalType,
                windowDays, count, req != null ? req.note() : null);

        OpenAiResult result = openAiService.generate(prompt, aiModel);
        apiUsageLogService.log(userId, "GOAL_TASKGEN", result);

        List<GeneratedTask> generated = parseGeneratedTasks(result.content());
        if (generated.isEmpty()) {
            throw new BusinessException(Code.BAD_REQUEST, "The AI did not return any tasks. Please try again.");
        }

        List<TaskResponse> created = new ArrayList<>();
        for (GeneratedTask g : generated) {
            int dayOffset = Math.max(0, Math.min(windowDays - 1, g.dayOffset));
            OffsetDateTime day = start.plusDays(dayOffset);
            LocalTime startTime = parseTimeSafe(g.dailyStartTime);
            LocalTime endTime = parseTimeSafe(g.dailyEndTime);
            boolean anytime = startTime == null;
            String title = (g.title != null && !g.title.isBlank()) ? g.title.trim() : "Untitled task";

            Task task = Task.builder()
                    .id(UUID.randomUUID())
                    .goalId(goalId)
                    .userId(userId)
                    .title(title)
                    .description(g.description)
                    .completed(false)
                    .startDate(day)
                    .endDate(day)
                    .dailyStartTime(anytime ? null : startTime)
                    .dailyEndTime(anytime ? null : endTime)
                    .anytime(anytime)
                    .tags(Collections.emptyList())
                    .updatedBy(userId)
                    .build();
            taskMapper.insert(task);
            created.add(TaskResponse.of(taskMapper.findById(task.getId())));
        }
        return created;
    }

    @Transactional
    public TaskResponse updateTask(Long userId, UUID taskId, UpdateTaskRequest req) {
        Task task = requireTaskWrite(userId, taskId);
        boolean wasCompleted = task.isCompleted();
        if (req.title() != null) task.setTitle(req.title().trim());
        if (req.description() != null) task.setDescription(req.description());
        if (req.completed() != null) task.setCompleted(req.completed());
        if (req.startDate() != null) task.setStartDate(DateTimeUtils.parseTimestamp(req.startDate()));
        if (req.endDate() != null) task.setEndDate(DateTimeUtils.parseTimestamp(req.endDate()));
        if (req.dailyStartTime() != null) task.setDailyStartTime(parseTime(req.dailyStartTime()));
        if (req.dailyEndTime() != null) task.setDailyEndTime(parseTime(req.dailyEndTime()));
        if (req.isAnytime() != null) task.setAnytime(req.isAnytime());
        if (req.durationMinutes() != null) task.setDurationMinutes(req.durationMinutes());
        if (req.color() != null) task.setColor(req.color());
        if (req.tags() != null) task.setTags(req.tags());
        task.setUpdatedBy(userId);
        taskMapper.update(task);
        // Self-notify on the incomplete → complete transition only (a milestone,
        // not on every edit) so the bell stays meaningful and low-noise.
        if (!wasCompleted && task.isCompleted()) {
            notificationService.notifySelf(userId, "task_updated", task.getGoalId(), taskUrl(task.getGoalId()));
        }
        return TaskResponse.of(taskMapper.findById(taskId));
    }

    @Transactional
    public void deleteTask(Long userId, UUID taskId) {
        requireTaskWrite(userId, taskId);
        taskMapper.deleteById(taskId);
    }

    private Task requireTaskWrite(Long userId, UUID taskId) {
        Task task = taskMapper.findById(taskId);
        if (task == null) {
            throw new BusinessException(Code.NOT_FOUND);
        }
        boolean writable = task.getUserId().equals(userId)
                || (task.getGoalId() != null && canWriteGoal(userId, task.getGoalId()));
        if (!writable) {
            throw new BusinessException(Code.INSUFFICIENT_PERMISSIONS);
        }
        return task;
    }

    private void requireGoalAccess(Long userId, UUID goalId) {
        if (goalMapper.findById(goalId) == null) {
            throw new BusinessException(Code.NOT_FOUND);
        }
        if (goalMapper.countAccess(goalId, userId) == 0) {
            throw new BusinessException(Code.INSUFFICIENT_PERMISSIONS);
        }
    }

    private void requireGoalWrite(Long userId, UUID goalId) {
        if (goalMapper.findById(goalId) == null) {
            throw new BusinessException(Code.NOT_FOUND);
        }
        if (!canWriteGoal(userId, goalId)) {
            throw new BusinessException(Code.INSUFFICIENT_PERMISSIONS);
        }
    }

    /** Owner or member may write tasks in a goal (public visibility alone is not enough). */
    private boolean canWriteGoal(Long userId, UUID goalId) {
        return goalMapper.countOwner(goalId, userId) > 0
                || goalMemberMapper.countMembership(goalId, userId) > 0;
    }

    // ── AI task generation helpers ──────────────────────────────────────────

    /** Goal start instant: metadata.start_date, else createdAt, else now (UTC midnight). */
    private OffsetDateTime goalStart(Goal goal) {
        String startDate = metadataText(goal, "start_date", null);
        if (startDate != null) {
            OffsetDateTime parsed = DateTimeUtils.parseTimestamp(startDate);
            if (parsed != null) return parsed;
        }
        return goal.getCreatedAt() != null ? goal.getCreatedAt() : OffsetDateTime.now();
    }

    /** Days from start to target_date (clamped 1..60); 14 when there's no deadline. */
    private int goalWindowDays(Goal goal, OffsetDateTime start) {
        if (goal.getTargetDate() == null) return 14;
        long days = java.time.Duration.between(start, goal.getTargetDate()).toDays();
        return (int) Math.max(1, Math.min(60, days));
    }

    /** Read a string field from the goal's JSONB metadata, or a default. */
    private String metadataText(Goal goal, String field, String fallback) {
        if (goal.getMetadata() == null || goal.getMetadata().isBlank()) return fallback;
        try {
            JsonNode node = objectMapper.readTree(goal.getMetadata()).get(field);
            return (node != null && !node.isNull()) ? node.asText() : fallback;
        } catch (Exception e) {
            return fallback;
        }
    }

    private String buildTaskPrompt(String title, String description, String goalType,
                                   int windowDays, int count, String note) {
        return """
                You are a goal-planning assistant. Break the user's goal into %d concrete, actionable tasks.

                Goal title: %s
                Description: %s
                Goal type: %s
                Timeframe: %d days, starting at day 0.
                %s

                Rules:
                - Each task is a single, specific, achievable action (imperative title, max ~60 chars).
                - Spread tasks across the timeframe; order them by day_offset (0..%d).
                - daily_start_time / daily_end_time are optional "HH:MM" 24h strings; use null for flexible tasks.

                Respond with ONLY valid JSON, no prose:
                {"tasks":[{"title":"...","description":"one sentence","day_offset":0,"daily_start_time":"09:00","daily_end_time":"10:00"}]}
                """
                .formatted(
                        count,
                        title != null ? title : "",
                        description != null && !description.isBlank() ? description : "(none)",
                        goalType,
                        windowDays,
                        note != null && !note.isBlank() ? "Extra instructions: " + note : "",
                        windowDays - 1);
    }

    private List<GeneratedTask> parseGeneratedTasks(String content) {
        List<GeneratedTask> out = new ArrayList<>();
        if (content == null || content.isBlank()) return out;
        try {
            String cleaned = content.trim();
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start == -1 || end == -1) return out;
            JsonNode tasks = objectMapper.readTree(cleaned.substring(start, end + 1)).get("tasks");
            if (tasks == null || !tasks.isArray()) return out;
            for (JsonNode t : tasks) {
                GeneratedTask g = new GeneratedTask();
                g.title = text(t, "title");
                g.description = text(t, "description");
                JsonNode off = t.get("day_offset");
                g.dayOffset = (off != null && off.isNumber()) ? off.asInt() : 0;
                g.dailyStartTime = text(t, "daily_start_time");
                g.dailyEndTime = text(t, "daily_end_time");
                if (g.title != null && !g.title.isBlank()) out.add(g);
            }
        } catch (Exception e) {
            log.warn("Failed to parse AI task generation output: {}", e.getMessage());
        }
        return out;
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v != null && !v.isNull()) ? v.asText() : null;
    }

    /** Lenient "HH:MM"/"H:MM" parse for AI output; null on blank/invalid (no throw). */
    private static LocalTime parseTimeSafe(String value) {
        if (value == null || value.isBlank() || "null".equalsIgnoreCase(value.trim())) return null;
        try {
            String[] parts = value.trim().split(":");
            int h = Integer.parseInt(parts[0].trim());
            int m = parts.length > 1 ? Integer.parseInt(parts[1].trim()) : 0;
            if (h < 0 || h > 23 || m < 0 || m > 59) return null;
            return LocalTime.of(h, m);
        } catch (Exception e) {
            return null;
        }
    }

    private static final class GeneratedTask {
        String title;
        String description;
        int dayOffset;
        String dailyStartTime;
        String dailyEndTime;
    }



    private LocalTime parseTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalTime.parse(value);
        } catch (Exception e) {
            throw new BusinessException(Code.BAD_REQUEST, "Invalid time: " + value);
        }
    }
}
