package com.heang.koriaibackend.domain.reading.mapper;

import com.heang.koriaibackend.domain.reading.model.ReadingUnit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReadingUnitMapper {
    int insertUnit(ReadingUnit unit);

    int updateUnit(ReadingUnit unit);

    int deleteUnitByIdAndUser(@Param("id") Long id, @Param("userId") Long userId);

    ReadingUnit findUnitByIdAndUser(@Param("id") Long id, @Param("userId") Long userId);

    List<ReadingUnit> findUnitsByUserId(@Param("userId") Long userId);
}
