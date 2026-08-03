package com.heang.koriaibackend.domain.goal.mapper;

import com.heang.koriaibackend.domain.goal.model.Goal;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.ResultMap;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.UUID;

@Mapper
public interface GoalStarMapper {

    @Insert("""
            INSERT INTO goal_stars (user_id, goal_id) VALUES (#{userId}, #{goalId})
            ON CONFLICT (user_id, goal_id) DO NOTHING
            """)
    int insertStar(@Param("userId") Long userId, @Param("goalId") UUID goalId);

    @Delete("DELETE FROM goal_stars WHERE user_id = #{userId} AND goal_id = #{goalId}")
    int deleteStar(@Param("userId") Long userId, @Param("goalId") UUID goalId);

    @Select("""
            SELECT CASE WHEN EXISTS (
                SELECT 1 FROM goal_stars WHERE user_id = #{userId} AND goal_id = #{goalId}
            ) THEN 1 ELSE 0 END
            """)
    int existsStar(@Param("userId") Long userId, @Param("goalId") UUID goalId);

    /** Goals this user has starred, newest star first. Reuses GoalMapper's XML result map. */
    @Select("""
            SELECT g.id, g.user_id, g.title, g.description, g.target_date, g.status,
                   g.metadata::text AS metadata, g.share_code, g.is_public, g.public_slug,
                   g.ai_prompt, g.theme_id, g.preferences::text AS preferences, g.created_at, g.updated_at
            FROM goals g JOIN goal_stars s ON s.goal_id = g.id
            WHERE s.user_id = #{userId} ORDER BY s.created_at DESC
            """)
    @ResultMap("com.heang.koriaibackend.domain.goal.mapper.GoalMapper.GoalResultMap")
    List<Goal> findStarredGoals(@Param("userId") Long userId);
}
