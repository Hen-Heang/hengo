package com.heang.koriaibackend.domain.analyzer.mapper;

import com.heang.koriaibackend.domain.analyzer.model.MessageAnalysis;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MessageAnalysisMapper {

    @Insert("""
            INSERT INTO message_analysis (
                user_id, source, original_text, literal_meaning, natural_meaning, business_context,
                politeness_level, tone, breakdown, suggested_replies, model_used
            ) VALUES (
                #{userId}, #{source}, #{originalText}, #{literalMeaning}, #{naturalMeaning}, #{businessContext},
                #{politenessLevel}, #{tone}, CAST(#{breakdown} AS jsonb), CAST(#{suggestedReplies} AS jsonb), #{modelUsed}
            )
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(MessageAnalysis analysis);

    @Select("""
            SELECT id, user_id, source, original_text, literal_meaning, natural_meaning,
                   business_context, politeness_level, tone, breakdown, suggested_replies,
                   model_used, created_at
            FROM message_analysis WHERE user_id = #{userId} ORDER BY created_at DESC LIMIT #{limit}
            """)
    List<MessageAnalysis> findByUserId(@Param("userId") Long userId, @Param("limit") int limit);
}
