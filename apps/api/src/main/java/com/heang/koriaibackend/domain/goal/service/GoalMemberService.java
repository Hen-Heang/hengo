package com.heang.koriaibackend.domain.goal.service;

import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.exception.BusinessException;
import com.heang.koriaibackend.domain.goal.dto.GoalMemberResponse;
import com.heang.koriaibackend.domain.goal.dto.GoalResponse;
import com.heang.koriaibackend.domain.goal.mapper.GoalMapper;
import com.heang.koriaibackend.domain.goal.mapper.GoalMemberMapper;
import com.heang.koriaibackend.domain.goal.model.Goal;
import com.heang.koriaibackend.domain.goal.model.GoalRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Goal sharing / membership. Mirrors the original Supabase RPCs
 * (join_goal, get_goal_members, remove_goal_member, regenerate_goal_share_code,
 * update_member_last_seen) with service-layer authorization.
 */
@Service
@RequiredArgsConstructor
public class GoalMemberService {

    private final GoalMapper goalMapper;
    private final GoalMemberMapper goalMemberMapper;
    private final GoalResponseAssembler assembler;

    public List<GoalMemberResponse> listMembers(Long userId, UUID goalId) {
        requireMember(userId, goalId);
        return goalMemberMapper.findByGoal(goalId).stream().map(GoalMemberResponse::of).toList();
    }

    /** Preview a goal from its share code (used before joining). */
    public GoalResponse getByShareCode(UUID shareCode) {
        Goal goal = goalMapper.findByShareCode(shareCode);
        if (goal == null) {
            throw new BusinessException(Code.NOT_FOUND);
        }
        return assembler.toResponse(goal);
    }

    /** Join a goal via its share code; idempotent. */
    @Transactional
    public GoalResponse joinByShareCode(Long userId, UUID shareCode) {
        Goal goal = goalMapper.findByShareCode(shareCode);
        if (goal == null) {
            throw new BusinessException(Code.NOT_FOUND);
        }
        goalMemberMapper.insertMember(goal.getId(), userId, GoalRole.MEMBER);
        return assembler.toResponse(goalMapper.findByIdEnriched(goal.getId(), userId));
    }

    /** Leave a goal. The creator cannot leave their own goal. */
    @Transactional
    public void leave(Long userId, UUID goalId) {
        String role = goalMemberMapper.findRole(goalId, userId);
        if (role == null) {
            throw new BusinessException(Code.NOT_FOUND);
        }
        if (GoalRole.CREATOR.equals(role)) {
            throw new BusinessException(Code.BAD_REQUEST, "The goal creator cannot leave the goal");
        }
        goalMemberMapper.deleteMember(goalId, userId);
    }

    /** Remove another member. Only the creator may do this, and not on themselves. */
    @Transactional
    public void removeMember(Long actingUserId, UUID goalId, Long targetUserId) {
        if (!GoalRole.CREATOR.equals(goalMemberMapper.findRole(goalId, actingUserId))) {
            throw new BusinessException(Code.INSUFFICIENT_PERMISSIONS);
        }
        if (actingUserId.equals(targetUserId)) {
            throw new BusinessException(Code.BAD_REQUEST, "The creator cannot remove themselves");
        }
        if (goalMemberMapper.deleteMember(goalId, targetUserId) == 0) {
            throw new BusinessException(Code.NOT_FOUND);
        }
    }

    @Transactional
    public UUID regenerateShareCode(Long userId, UUID goalId) {
        if (!GoalRole.CREATOR.equals(goalMemberMapper.findRole(goalId, userId))) {
            throw new BusinessException(Code.INSUFFICIENT_PERMISSIONS);
        }
        UUID newCode = UUID.randomUUID();
        goalMapper.regenerateShareCode(goalId, newCode);
        return newCode;
    }

    @Transactional
    public void touchLastSeen(Long userId, UUID goalId) {
        goalMemberMapper.touchLastSeen(goalId, userId);
    }

    private void requireMember(Long userId, UUID goalId) {
        if (goalMemberMapper.countMembership(goalId, userId) == 0) {
            throw new BusinessException(Code.INSUFFICIENT_PERMISSIONS);
        }
    }
}
