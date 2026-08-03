package com.heang.koriaibackend.domain.goal.mapper;

import com.heang.koriaibackend.domain.goal.model.Goal;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.UUID;

@Mapper
public interface GoalMapper {

    int insert(Goal goal);

    Goal findById(@Param("id") UUID id);

    /** Single goal enriched with taskCounts + starred for the given viewer. */
    Goal findByIdEnriched(@Param("id") UUID id, @Param("userId") Long userId);

    Goal findByShareCode(@Param("shareCode") UUID shareCode);

    int regenerateShareCode(@Param("id") UUID id, @Param("shareCode") UUID shareCode);

    /** Goals the user owns or is a member of, newest first. */
    List<Goal> findAccessibleByUser(@Param("userId") Long userId);

    int update(Goal goal);

    int deleteByIdAndOwner(@Param("id") UUID id, @Param("userId") Long userId);

    /** 1 if the user owns or is a member of the goal (or it is public), else 0. */
    int countAccess(@Param("id") UUID id, @Param("userId") Long userId);

    /** 1 if the user is the goal owner, else 0. */
    int countOwner(@Param("id") UUID id, @Param("userId") Long userId);
}
