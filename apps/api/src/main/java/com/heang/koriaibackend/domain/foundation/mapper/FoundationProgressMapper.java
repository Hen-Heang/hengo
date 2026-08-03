package com.heang.koriaibackend.domain.foundation.mapper;

import com.heang.koriaibackend.domain.foundation.model.FoundationProgress;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface FoundationProgressMapper {

    String COLUMNS = "id, user_id, lesson_id, track, completed, accuracy, attempts, last_attempt_at, created_at, updated_at";

    @Select("SELECT " + COLUMNS + " FROM foundation_progress WHERE user_id = #{userId}")
    List<FoundationProgress> findByUser(@Param("userId") Long userId);

    @Select("SELECT " + COLUMNS + " FROM foundation_progress WHERE user_id = #{userId} AND lesson_id = #{lessonId}")
    FoundationProgress findByUserAndLesson(@Param("userId") Long userId, @Param("lessonId") String lessonId);

    // Upsert: keeps the best accuracy, makes completion sticky, and bumps the
    // attempt counter on every call.
    @Insert("""
            INSERT INTO foundation_progress (user_id, lesson_id, track, completed, accuracy, attempts, last_attempt_at)
            VALUES (#{userId}, #{lessonId}, #{track}, #{completed}, #{accuracy}, 1, NOW())
            ON CONFLICT (user_id, lesson_id) DO UPDATE SET
                completed = foundation_progress.completed OR EXCLUDED.completed,
                accuracy = GREATEST(foundation_progress.accuracy, EXCLUDED.accuracy),
                attempts = foundation_progress.attempts + 1,
                track = EXCLUDED.track,
                last_attempt_at = NOW(),
                updated_at = NOW()
            """)
    int upsert(FoundationProgress progress);
}
