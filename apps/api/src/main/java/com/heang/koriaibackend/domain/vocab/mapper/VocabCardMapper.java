package com.heang.koriaibackend.domain.vocab.mapper;

import com.heang.koriaibackend.domain.vocab.model.VocabCard;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface VocabCardMapper {
    int insert(VocabCard card);
    List<VocabCard> findByUserId(@Param("userId") Long userId);
    List<VocabCard> findDueByUserId(@Param("userId") Long userId);
    int updateMastery(@Param("id") Long id, @Param("userId") Long userId, @Param("mastery") int mastery, @Param("nextReviewDate") String nextReviewDate);
    int updateSrs(VocabCard card);
    VocabCard findByIdAndUser(@Param("id") Long id, @Param("userId") Long userId);
    int updateCard(@Param("id") Long id, @Param("userId") Long userId,
                   @Param("category") String category, @Param("term") String term,
                   @Param("meaning") String meaning, @Param("example") String example,
                   @Param("pronunciation") String pronunciation);
    int deleteByIdAndUser(@Param("id") Long id, @Param("userId") Long userId);
}