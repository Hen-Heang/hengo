package com.heang.koriaibackend.domain.listening.mapper;

import com.heang.koriaibackend.domain.listening.model.ListeningAttempt;
import com.heang.koriaibackend.domain.listening.model.ListeningLesson;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ListeningMapper {

    @Insert("""
            INSERT INTO listening_lessons (user_id, topic, title, level, transcript, quiz, model_used)
            VALUES (#{userId}, #{topic}, #{title}, #{level}, CAST(#{transcript} AS jsonb), CAST(#{quiz} AS jsonb), #{modelUsed})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertLesson(ListeningLesson lesson);

    @Select("""
            SELECT id, user_id, topic, title, level, transcript::text AS transcript, quiz::text AS quiz, model_used, created_at
            FROM listening_lessons WHERE id = #{id} AND user_id = #{userId}
            """)
    ListeningLesson findLessonByIdAndUser(@Param("id") Long id, @Param("userId") Long userId);

    @Select("""
            SELECT id, user_id, topic, title, level, transcript::text AS transcript, quiz::text AS quiz, model_used, created_at
            FROM listening_lessons WHERE user_id = #{userId} ORDER BY created_at DESC
            """)
    List<ListeningLesson> findLessonsByUserId(@Param("userId") Long userId);

    @Insert("""
            INSERT INTO listening_attempts (user_id, lesson_id, score, total, accuracy, completed)
            VALUES (#{userId}, #{lessonId}, #{score}, #{total}, #{accuracy}, #{completed})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertAttempt(ListeningAttempt attempt);

    @Select("SELECT COUNT(*) FROM listening_attempts WHERE user_id = #{userId} AND completed = TRUE")
    int countCompletedAttempts(@Param("userId") Long userId);
}
