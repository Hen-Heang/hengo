package com.heang.koriaibackend.domain.interview.mapper;

import com.heang.koriaibackend.domain.interview.model.InterviewScript;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface InterviewScriptMapper {

    @Select("""
            SELECT id, user_id, topic_id, sections::text AS sections, created_at, updated_at
            FROM interview_scripts WHERE user_id = #{userId} AND topic_id = #{topicId}
            """)
    InterviewScript findByUserAndTopic(@Param("userId") Long userId, @Param("topicId") String topicId);

    @Insert("""
            INSERT INTO interview_scripts (user_id, topic_id, sections)
            VALUES (#{userId}, #{topicId}, CAST(#{sections} AS jsonb))
            ON CONFLICT (user_id, topic_id)
            DO UPDATE SET sections = CAST(#{sections} AS jsonb), updated_at = NOW()
            """)
    int upsert(InterviewScript script);
}
