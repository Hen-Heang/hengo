package com.heang.koriaibackend.domain.goal.service;

import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.exception.BusinessException;
import com.heang.koriaibackend.domain.goal.dto.CreateInviteRequest;
import com.heang.koriaibackend.domain.goal.dto.GoalNotificationResponse;
import com.heang.koriaibackend.domain.goal.mapper.GoalMemberMapper;
import com.heang.koriaibackend.domain.goal.mapper.GoalNotificationMapper;
import com.heang.koriaibackend.domain.goal.model.GoalNotification;
import com.heang.koriaibackend.domain.goal.model.GoalRole;
import com.heang.koriaibackend.domain.push.service.PushDispatcher;
import com.heang.koriaibackend.domain.push.service.PushMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Goal notifications / invitations. A member of a goal can invite another user;
 * the receiver lists, reads, and accepts/declines. Accepting adds membership.
 * Task activity also produces self-notifications for the acting user so the
 * in-app bell reflects their own progress (mirrors Orbit's notifySelfTask).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoalNotificationService {

    private static final String TYPE_INVITATION = "invitation";
    private static final String STATUS_PENDING = "pending";
    private static final String STATUS_ACCEPTED = "accepted";
    private static final String STATUS_DECLINED = "declined";
    private final GoalNotificationMapper notificationMapper;
    private final GoalMemberMapper goalMemberMapper;
    private final PushDispatcher pushDispatcher;

    public List<GoalNotificationResponse> list(Long userId, boolean onlyUnread) {
        return notificationMapper.findEnrichedByReceiver(userId, onlyUnread).stream()
                .map(GoalNotificationResponse::of).toList();
    }

    /** Invite a user to a goal. Only an existing member of the goal may invite. */
    @Transactional
    public GoalNotificationResponse invite(Long senderId, CreateInviteRequest req) {
        if (goalMemberMapper.countMembership(req.goalId(), senderId) == 0) {
            throw new BusinessException(Code.INSUFFICIENT_PERMISSIONS);
        }
        if (senderId.equals(req.receiverUserId())) {
            throw new BusinessException(Code.BAD_REQUEST, "You cannot invite yourself");
        }
        if (goalMemberMapper.countMembership(req.goalId(), req.receiverUserId()) > 0) {
            throw new BusinessException(Code.BAD_REQUEST, "User is already a member");
        }
        GoalNotification n = GoalNotification.builder()
                .id(UUID.randomUUID())
                .type(TYPE_INVITATION)
                .goalId(req.goalId())
                .senderId(senderId)
                .receiverId(req.receiverUserId())
                .payload("{}")
                .invitationStatus(STATUS_PENDING)
                .build();
        notificationMapper.insert(n);
        pushDispatcher.dispatch(req.receiverUserId(),
                new PushMessage("New goal invitation", "You've been invited to join a goal.", "/goals"));
        return GoalNotificationResponse.of(notificationMapper.findById(n.getId()));
    }

    @Transactional
    public void markRead(Long userId, UUID notificationId) {
        if (notificationMapper.markRead(notificationId, userId) == 0) {
            throw new BusinessException(Code.NOT_FOUND);
        }
    }

    /** Accept or decline an invitation. Accepting joins the goal. */
    @Transactional
    public void respond(Long userId, UUID notificationId, boolean accept) {
        GoalNotification n = notificationMapper.findById(notificationId);
        if (n == null || !userId.equals(n.getReceiverId())) {
            throw new BusinessException(Code.NOT_FOUND);
        }
        if (!TYPE_INVITATION.equals(n.getType())) {
            throw new BusinessException(Code.BAD_REQUEST, "Not an invitation");
        }
        if (!STATUS_PENDING.equals(n.getInvitationStatus())) {
            throw new BusinessException(Code.BAD_REQUEST, "Invitation already resolved");
        }
        String status = accept ? STATUS_ACCEPTED : STATUS_DECLINED;
        notificationMapper.updateInvitationStatus(notificationId, userId, status);
        if (accept && n.getGoalId() != null) {
            goalMemberMapper.insertMember(n.getGoalId(), userId, GoalRole.MEMBER);
        }
    }

    /**
     * Best-effort self-notification for the acting user's own activity (task
     * created / completed). Never throws: a notification failure must not roll
     * back or break the underlying task write.
     */
    public void notifySelf(Long userId, String type, UUID goalId, String url) {
        try {
            GoalNotification n = GoalNotification.builder()
                    .id(UUID.randomUUID())
                    .type(type)
                    .goalId(goalId)
                    .senderId(userId)
                    .receiverId(userId)
                    .payload("{}")
                    .url(url)
                    .build();
            notificationMapper.insert(n);
            pushDispatcher.dispatch(userId, toPushMessage(type, url));
        } catch (Exception e) {
            log.warn("Failed to create self-notification (type={}, goalId={})", type, goalId, e);
        }
    }

    /** Housekeeping: purges read notifications older than the cutoff. Unread ones are kept regardless of age. */
    @Transactional
    public int cleanupRead(OffsetDateTime cutoff) {
        return notificationMapper.deleteReadOlderThan(cutoff);
    }

    /** Map a self-notification type to a human-readable push payload. */
    private static PushMessage toPushMessage(String type, String url) {
        return switch (type) {
            case "task_created" -> new PushMessage("Task created", "You added a new task.", url);
            case "task_updated" -> new PushMessage("Task completed 🎉", "You completed a task.", url);
            default -> new PushMessage("Goal update", "You have a new update.", url);
        };
    }
}
