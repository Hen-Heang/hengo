package com.heang.koriaibackend.domain.goal.mapper;

import com.heang.koriaibackend.domain.goal.model.GoalMember;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;
import java.util.UUID;

@Mapper
public interface GoalMemberMapper {

    @Insert("""
            INSERT INTO goal_members (goal_id, user_id, role) VALUES (#{goalId}, #{userId}, #{role})
            ON CONFLICT (goal_id, user_id) DO NOTHING
            """)
    int insertMember(@Param("goalId") UUID goalId,
                     @Param("userId") Long userId,
                     @Param("role") String role);

    @Select("""
            SELECT CASE WHEN EXISTS (
                SELECT 1 FROM goal_members WHERE goal_id = #{goalId} AND user_id = #{userId}
            ) THEN 1 ELSE 0 END
            """)
    int countMembership(@Param("goalId") UUID goalId, @Param("userId") Long userId);

    /** Members of a goal, joined with user display info. */
    @Select("""
            SELECT m.id, m.goal_id, m.user_id, m.role, m.joined_at, m.last_seen,
                   u.display_name, u.email
            FROM goal_members m JOIN users u ON u.id = m.user_id
            WHERE m.goal_id = #{goalId} ORDER BY m.joined_at
            """)
    List<GoalMember> findByGoal(@Param("goalId") UUID goalId);

    @Select("SELECT role FROM goal_members WHERE goal_id = #{goalId} AND user_id = #{userId}")
    String findRole(@Param("goalId") UUID goalId, @Param("userId") Long userId);

    @Delete("DELETE FROM goal_members WHERE goal_id = #{goalId} AND user_id = #{userId}")
    int deleteMember(@Param("goalId") UUID goalId, @Param("userId") Long userId);

    @Update("UPDATE goal_members SET last_seen = NOW() WHERE goal_id = #{goalId} AND user_id = #{userId}")
    int touchLastSeen(@Param("goalId") UUID goalId, @Param("userId") Long userId);
}
