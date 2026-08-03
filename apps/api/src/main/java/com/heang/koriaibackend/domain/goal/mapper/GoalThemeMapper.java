package com.heang.koriaibackend.domain.goal.mapper;

import com.heang.koriaibackend.domain.goal.model.GoalTheme;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.ResultMap;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;
import java.util.UUID;

@Mapper
public interface GoalThemeMapper {

    String COLUMNS = "id, user_id, name, goal_profile_image, card_background_image, " +
            "page_background_image, is_public, created_at, updated_at";

    @Insert("""
            INSERT INTO goal_themes (
                id, user_id, name, goal_profile_image, card_background_image, page_background_image, is_public
            ) VALUES (
                #{id}, #{userId}, #{name}, #{goalProfileImage}, #{cardBackgroundImage}, #{pageBackgroundImage}, #{publicTheme}
            )
            """)
    int insert(GoalTheme theme);

    @Select("SELECT " + COLUMNS + " FROM goal_themes WHERE id = #{id}")
    @Results(id = "GoalThemeResultMap", value = {
            @Result(property = "publicTheme", column = "is_public")
    })
    GoalTheme findById(@Param("id") UUID id);

    @Select("SELECT " + COLUMNS + " FROM goal_themes WHERE user_id = #{userId} ORDER BY created_at DESC")
    @ResultMap("GoalThemeResultMap")
    List<GoalTheme> findByUser(@Param("userId") Long userId);

    @Update("""
            UPDATE goal_themes SET
                name = #{name}, goal_profile_image = #{goalProfileImage},
                card_background_image = #{cardBackgroundImage}, page_background_image = #{pageBackgroundImage},
                is_public = #{publicTheme}, updated_at = NOW()
            WHERE id = #{id}
            """)
    int update(GoalTheme theme);

    @Delete("DELETE FROM goal_themes WHERE id = #{id} AND user_id = #{userId}")
    int deleteByIdAndOwner(@Param("id") UUID id, @Param("userId") Long userId);
}
