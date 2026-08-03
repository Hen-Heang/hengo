package com.heang.koriaibackend.domain.correction.mapper;

import com.heang.koriaibackend.domain.correction.model.SentenceCorrection;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface SentenceCorrectionMapper {

    String COLUMNS = "id, user_id, original_text, corrected_text, rating, explanation, grammar_points, changes, " +
            "model_used, created_at, mastery, next_review_date, ease_factor, interval_days, repetitions, lapses";

    @Insert("""
            INSERT INTO sentence_corrections (
                user_id, original_text, corrected_text, rating, explanation, grammar_points, changes, model_used
            ) VALUES (
                #{userId}, #{originalText}, #{correctedText}, #{rating}, #{explanation},
                CAST(#{grammarPoints} AS jsonb), CAST(#{changes} AS jsonb), #{modelUsed}
            )
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(SentenceCorrection correction);

    @Select("SELECT " + COLUMNS + " FROM sentence_corrections WHERE user_id = #{userId} ORDER BY created_at DESC LIMIT #{limit}")
    List<SentenceCorrection> findByUserId(@Param("userId") Long userId, @Param("limit") int limit);

    @Select("SELECT " + COLUMNS + " FROM sentence_corrections " +
            "WHERE user_id = #{userId} AND next_review_date <= CURRENT_DATE ORDER BY next_review_date ASC")
    List<SentenceCorrection> findDueByUserId(@Param("userId") Long userId);

    @Select("SELECT COUNT(*) FROM sentence_corrections WHERE user_id = #{userId} AND repetitions >= 1")
    int countReviewed(@Param("userId") Long userId);

    @Select("SELECT " + COLUMNS + " FROM sentence_corrections WHERE id = #{id} AND user_id = #{userId}")
    SentenceCorrection findByIdAndUser(@Param("id") Long id, @Param("userId") Long userId);

    @Update("""
            UPDATE sentence_corrections SET
                mastery = #{mastery}, next_review_date = #{nextReviewDate}, ease_factor = #{easeFactor},
                interval_days = #{intervalDays}, repetitions = #{repetitions}, lapses = #{lapses},
                last_reviewed_at = NOW()
            WHERE id = #{id} AND user_id = #{userId}
            """)
    int updateSrs(SentenceCorrection correction);

    @Delete("DELETE FROM sentence_corrections WHERE id = #{id} AND user_id = #{userId}")
    int deleteByIdAndUser(@Param("id") Long id, @Param("userId") Long userId);
}
