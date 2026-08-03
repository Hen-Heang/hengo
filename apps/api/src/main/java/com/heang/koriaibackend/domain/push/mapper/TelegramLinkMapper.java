package com.heang.koriaibackend.domain.push.mapper;

import com.heang.koriaibackend.domain.push.model.TelegramLink;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface TelegramLinkMapper {

    String COLUMNS = "user_id, chat_id, link_code, linked_at, created_at";

    /**
     * Store (or replace) a pending link code for the user, leaving any existing
     * confirmed chat untouched until the new code is redeemed.
     */
    @Insert("""
            INSERT INTO user_telegram_links (user_id, link_code) VALUES (#{userId}, #{linkCode})
            ON CONFLICT (user_id) DO UPDATE SET link_code = EXCLUDED.link_code
            """)
    int upsertLinkCode(@Param("userId") Long userId, @Param("linkCode") String linkCode);

    @Select("SELECT " + COLUMNS + " FROM user_telegram_links WHERE user_id = #{userId}")
    TelegramLink findByUserId(@Param("userId") Long userId);

    @Select("SELECT " + COLUMNS + " FROM user_telegram_links WHERE link_code = #{linkCode}")
    TelegramLink findByLinkCode(@Param("linkCode") String linkCode);

    /** Bind the resolved chat to the user and clear the one-time link code. */
    @Update("UPDATE user_telegram_links SET chat_id = #{chatId}, link_code = NULL, linked_at = NOW() WHERE user_id = #{userId}")
    int confirmChat(@Param("userId") Long userId, @Param("chatId") Long chatId);

    @Delete("DELETE FROM user_telegram_links WHERE user_id = #{userId}")
    int deleteByUserId(@Param("userId") Long userId);
}
