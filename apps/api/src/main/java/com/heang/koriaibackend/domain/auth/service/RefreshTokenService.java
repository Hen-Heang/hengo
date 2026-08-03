package com.heang.koriaibackend.domain.auth.service;

import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.exception.BusinessException;
import com.heang.koriaibackend.domain.auth.mapper.RefreshTokenMapper;
import com.heang.koriaibackend.domain.auth.model.RefreshToken;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Issues, rotates and revokes opaque refresh tokens.
 *
 * <p>The raw token is a 256-bit random string handed to the client once. Only its
 * SHA-256 hash is persisted, so the stored value is useless if the DB leaks. Each
 * successful {@link #rotate} revokes the presented token and issues a fresh one
 * (refresh-token rotation), which limits the blast radius of a stolen token.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();

    private final RefreshTokenMapper refreshTokenMapper;

    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    /** Result of a rotation: the new raw refresh token plus the owning user id. */
    public record Rotation(String refreshToken, Long userId) {
    }

    /** Creates and stores a new refresh token for the user, returning the raw value. */
    @Transactional
    public String issue(Long userId) {
        String rawToken = generateRawToken();
        RefreshToken entity = RefreshToken.builder()
                .userId(userId)
                .tokenHash(hash(rawToken))
                .expiresAt(OffsetDateTime.now().plusNanos(refreshTokenExpirationMs * 1_000_000L))
                .build();
        refreshTokenMapper.insert(entity);
        return rawToken;
    }

    /**
     * Validates the presented raw token, revokes it, and issues a replacement.
     *
     * @throws BusinessException {@link Code#REFRESH_TOKEN_INVALID} if unknown/revoked,
     *                           {@link Code#REFRESH_TOKEN_EXPIRED} if past expiry.
     */
    @Transactional
    public Rotation rotate(String rawToken) {
        RefreshToken stored = requireActive(rawToken);
        refreshTokenMapper.revokeByTokenHash(stored.getTokenHash());
        String newRawToken = issue(stored.getUserId());
        return new Rotation(newRawToken, stored.getUserId());
    }

    /** Revokes a single token (logout). Silently ignores unknown/already-revoked tokens. */
    @Transactional
    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        refreshTokenMapper.revokeByTokenHash(hash(rawToken));
    }

    /** Revokes all of a user's tokens ("log out of all devices"). */
    @Transactional
    public void revokeAll(Long userId) {
        refreshTokenMapper.revokeAllByUserId(userId);
    }

    /** Housekeeping: purges expired/revoked rows. Returns the number deleted. */
    @Transactional
    public int cleanupExpired() {
        return refreshTokenMapper.deleteExpired();
    }

    private RefreshToken requireActive(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new BusinessException(Code.REFRESH_TOKEN_INVALID);
        }
        RefreshToken stored = Optional.ofNullable(hash(rawToken))
                .flatMap(refreshTokenMapper::findByTokenHash)
                .orElseThrow(() -> new BusinessException(Code.REFRESH_TOKEN_INVALID));

        if (stored.getRevokedAt() != null) {
            throw new BusinessException(Code.REFRESH_TOKEN_INVALID);
        }
        if (stored.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BusinessException(Code.REFRESH_TOKEN_EXPIRED);
        }
        return stored;
    }

    private static String generateRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return URL_ENCODER.encodeToString(bytes);
    }

    private static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is guaranteed present on every JVM; treat absence as a config error.
            throw new BusinessException(Code.SECURITY_ERROR);
        }
    }
}
