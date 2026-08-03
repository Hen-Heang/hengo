package com.heang.koriaibackend.domain.achievements.mapper;

import com.heang.koriaibackend.domain.achievements.model.Achievement;
import com.heang.koriaibackend.domain.achievements.model.UserAchievement;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface AchievementMapper {

    @Select("""
            SELECT code, title, description, icon, category, xp, metric, threshold, sort_order
            FROM achievements ORDER BY sort_order ASC
            """)
    List<Achievement> findCatalog();

    @Select("SELECT id, user_id, achievement_code, unlocked_at FROM user_achievements WHERE user_id = #{userId}")
    List<UserAchievement> findUnlockedByUser(@Param("userId") Long userId);

    @Insert("""
            INSERT INTO user_achievements (user_id, achievement_code) VALUES (#{userId}, #{code})
            ON CONFLICT (user_id, achievement_code) DO NOTHING
            """)
    int insertUnlocked(@Param("userId") Long userId, @Param("code") String code);

    @Select("SELECT COUNT(*) FROM vocab_cards WHERE user_id = #{userId}")
    int countVocab(@Param("userId") Long userId);

    @Select("SELECT COUNT(*) FROM sentence_corrections WHERE user_id = #{userId}")
    int countCorrections(@Param("userId") Long userId);

    @Select("""
            SELECT COUNT(*) FROM messages m JOIN conversations c ON m.conversation_id = c.id
            WHERE c.user_id = #{userId} AND m.role = 'USER'
            """)
    int countChatMessages(@Param("userId") Long userId);
}
