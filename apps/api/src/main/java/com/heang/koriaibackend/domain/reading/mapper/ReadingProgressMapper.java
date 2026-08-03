package com.heang.koriaibackend.domain.reading.mapper;

import com.heang.koriaibackend.domain.reading.model.ReadingProgress;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReadingProgressMapper {

    List<ReadingProgress> findByUser(@Param("userId") Long userId);

    ReadingProgress findByUserAndUnit(@Param("userId") Long userId, @Param("unitId") Long unitId);

    int insertIfAbsent(@Param("userId") Long userId, @Param("unitId") Long unitId, @Param("status") String status);

    int upsertCompleted(@Param("userId") Long userId, @Param("unitId") Long unitId);

    int upsertQuizResult(ReadingProgress progress);
}
