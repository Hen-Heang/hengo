package com.heang.koriaibackend.domain.push.mapper;

import com.heang.koriaibackend.domain.push.model.UserDevice;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface UserDeviceMapper {

    /** Register a device token, or re-point an existing token to this user. */
    @Insert("""
            INSERT INTO user_devices (id, user_id, fcm_token, platform)
            VALUES (#{id}, #{userId}, #{fcmToken}, #{platform})
            ON CONFLICT (fcm_token) DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform
            """)
    int upsert(UserDevice device);

    @Select("SELECT id, user_id, fcm_token, platform, created_at FROM user_devices WHERE user_id = #{userId}")
    List<UserDevice> findByUserId(@Param("userId") Long userId);

    /** Remove a stale/unregistered token (called when FCM reports it invalid). */
    @Delete("DELETE FROM user_devices WHERE fcm_token = #{fcmToken}")
    int deleteByToken(@Param("fcmToken") String fcmToken);
}
