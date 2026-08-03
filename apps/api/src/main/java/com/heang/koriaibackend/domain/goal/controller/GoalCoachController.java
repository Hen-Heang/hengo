package com.heang.koriaibackend.domain.goal.controller;

import com.heang.koriaibackend.domain.goal.dto.CoachStreamRequest;
import com.heang.koriaibackend.domain.goal.service.GoalCoachService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

/** Per-goal AI coach chat (Server-Sent Events stream). */
@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalCoachController {

    private final GoalCoachService coachService;

    @PostMapping(value = "/{id}/coach/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter coachStream(@PathVariable UUID id, @Valid @RequestBody CoachStreamRequest req) {
        return coachService.stream(SecurityUtils.currentUserId(), id, req);
    }
}
