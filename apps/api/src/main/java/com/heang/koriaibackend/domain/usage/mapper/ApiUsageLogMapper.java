package com.heang.koriaibackend.domain.usage.mapper;

import com.heang.koriaibackend.domain.usage.model.ApiUsageLog;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface ApiUsageLogMapper {

    @Insert("""
            INSERT INTO api_usage_logs (
                user_id, model, feature, prompt_tokens, completion_tokens, estimated_cost_usd, response_time_ms
            ) VALUES (
                #{userId}, #{model}, #{feature}, #{promptTokens}, #{completionTokens}, #{estimatedCostUsd}, #{responseTimeMs}
            )
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(ApiUsageLog usageLog);

    @Select("SELECT COUNT(*) FROM api_usage_logs WHERE user_id = #{userId} AND feature = #{feature}")
    int countByUserAndFeature(@Param("userId") Long userId, @Param("feature") String feature);
}
