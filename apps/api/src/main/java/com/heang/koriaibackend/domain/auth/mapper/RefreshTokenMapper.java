package com.heang.koriaibackend.domain.auth.mapper;

import com.heang.koriaibackend.domain.auth.model.RefreshToken;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.Optional;

@Mapper
public interface RefreshTokenMapper {

    @Insert("""
            INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
            VALUES (#{userId}, #{tokenHash}, #{expiresAt})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(RefreshToken token);

    @Select("""
            SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
            FROM refresh_tokens WHERE token_hash = #{tokenHash}
            """)
    Optional<RefreshToken> findByTokenHash(@Param("tokenHash") String tokenHash);

    /** Revokes a single token by hash (no-op if already revoked). Returns rows affected. */
    @Update("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = #{tokenHash} AND revoked_at IS NULL")
    int revokeByTokenHash(@Param("tokenHash") String tokenHash);

    /** Revokes every active token for a user ("log out of all devices"). */
    @Update("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = #{userId} AND revoked_at IS NULL")
    int revokeAllByUserId(@Param("userId") Long userId);

    /** Housekeeping: removes expired or revoked rows. */
    @Delete("DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at IS NOT NULL")
    int deleteExpired();
}
