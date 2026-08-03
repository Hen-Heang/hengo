package com.heang.koriaibackend.domain.activity.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ActivityLogMapper {
    void insert(@Param("userId") Long userId,
                @Param("feature") String feature,
                @Param("durationMs") long durationMs);
}
