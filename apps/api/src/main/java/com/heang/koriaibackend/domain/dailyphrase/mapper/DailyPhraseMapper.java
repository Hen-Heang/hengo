package com.heang.koriaibackend.domain.dailyphrase.mapper;

import com.heang.koriaibackend.domain.dailyphrase.model.DailyPhrase;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface DailyPhraseMapper {

    String COLUMNS = "id, user_id, phrase_date, phrase_kr, meaning_en, romanization, when_to_use, formality_level, " +
            "similar_expressions::text AS similar_expressions, learned, model_used, created_at";

    @Insert("""
            INSERT INTO daily_phrases (user_id, phrase_date, phrase_kr, meaning_en, romanization, when_to_use,
                formality_level, similar_expressions, learned, model_used)
            VALUES (#{userId}, CURRENT_DATE, #{phraseKr}, #{meaningEn}, #{romanization}, #{whenToUse},
                #{formalityLevel}, CAST(#{similarExpressions} AS jsonb), #{learned}, #{modelUsed})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(DailyPhrase phrase);

    @Select("SELECT " + COLUMNS + " FROM daily_phrases WHERE user_id = #{userId} AND phrase_date = #{phraseDate}")
    DailyPhrase findByUserAndDate(@Param("userId") Long userId, @Param("phraseDate") LocalDate phraseDate);

    @Select("SELECT " + COLUMNS + " FROM daily_phrases WHERE id = #{id} AND user_id = #{userId}")
    DailyPhrase findByIdAndUser(@Param("id") Long id, @Param("userId") Long userId);

    @Select("SELECT " + COLUMNS + " FROM daily_phrases WHERE user_id = #{userId} ORDER BY phrase_date DESC")
    List<DailyPhrase> findByUserId(@Param("userId") Long userId);

    @Select("SELECT phrase_kr FROM daily_phrases WHERE user_id = #{userId} ORDER BY phrase_date DESC LIMIT #{limit}")
    List<String> findRecentPhrases(@Param("userId") Long userId, @Param("limit") int limit);

    @Update("UPDATE daily_phrases SET learned = #{learned} WHERE id = #{id} AND user_id = #{userId}")
    int updateLearned(@Param("id") Long id, @Param("userId") Long userId, @Param("learned") boolean learned);

    @Delete("DELETE FROM daily_phrases WHERE id = #{id} AND user_id = #{userId}")
    int deleteByIdAndUser(@Param("id") Long id, @Param("userId") Long userId);
}
