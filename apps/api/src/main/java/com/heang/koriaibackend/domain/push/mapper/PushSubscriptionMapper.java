package com.heang.koriaibackend.domain.push.mapper;

import com.heang.koriaibackend.domain.push.model.PushSubscription;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface PushSubscriptionMapper {

    /** Insert a subscription, or re-point an existing endpoint to this user/keys. */
    @Insert("""
            INSERT INTO user_push_subscriptions (id, user_id, endpoint, p256dh, auth)
            VALUES (#{id}, #{userId}, #{endpoint}, #{p256dh}, #{auth})
            ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
            """)
    int upsert(PushSubscription subscription);

    @Select("SELECT id, user_id, endpoint, p256dh, auth, created_at FROM user_push_subscriptions WHERE user_id = #{userId}")
    List<PushSubscription> findByUserId(@Param("userId") Long userId);

    /** Remove a dead/unsubscribed endpoint (called on 404/410 from the push service). */
    @Delete("DELETE FROM user_push_subscriptions WHERE endpoint = #{endpoint}")
    int deleteByEndpoint(@Param("endpoint") String endpoint);
}
