package com.heang.koriaibackend.domain.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.exception.BusinessException;
import com.heang.koriaibackend.domain.auth.dto.AuthResponse;
import com.heang.koriaibackend.domain.auth.dto.GoogleLoginRequest;
import com.heang.koriaibackend.domain.auth.dto.LoginRequest;
import com.heang.koriaibackend.domain.auth.dto.RefreshTokenRequest;
import com.heang.koriaibackend.domain.auth.dto.RegisterRequest;
import com.heang.koriaibackend.domain.users.mapper.UserMapper;
import com.heang.koriaibackend.domain.users.model.User;
import com.heang.koriaibackend.security.jwt.JwtTokenProvider;
import com.heang.koriaibackend.security.oauth.GoogleTokenVerifier;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final RefreshTokenService refreshTokenService;

    @Value("${openai.model:gpt-5-mini}")
    private String defaultPreferredModel;


    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        userMapper.findByEmail(email).ifPresent(existing -> {
            throw new BusinessException(Code.EMAIL_ALREADY_EXISTS);
        });

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(req.password()))
                .displayName(req.displayName().trim())
                .koreanLevel(req.koreanLevel().trim().toUpperCase())
                .preferredModel(defaultPreferredModel)
                .build();
        userMapper.insert(user);
        User savedUser = userMapper.findById(user.getId()).orElseThrow(() -> new BusinessException(Code.REGISTRATION_FAILED));
        return issueTokens(savedUser);
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        User user = userMapper.findByEmail(email).orElseThrow(() -> new BusinessException(Code.INVALID_CREDENTIALS));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BusinessException(Code.INVALID_CREDENTIALS);
        }
        return issueTokens(user);
    }

    /**
     * Logs in (or transparently registers) a user from a verified Google ID token, then issues
     * the same JWT used by the email/password flow. This lets one Google sign-on grant access to
     * both the Spring backend and Supabase (via {@code signInWithIdToken}) under a single identity.
     */
    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest req) {
        GoogleIdToken.Payload payload = googleTokenVerifier.verify(req.idToken());

        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new BusinessException(Code.OAUTH_EMAIL_NOT_VERIFIED);
        }
        String rawEmail = payload.getEmail();
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new BusinessException(Code.OAUTH_ERROR);
        }
        String email = rawEmail.trim().toLowerCase();

        User user = userMapper.findByEmail(email).orElseGet(() -> createGoogleUser(email, payload));
        return issueTokens(user);
    }

    /**
     * Exchanges a valid refresh token for a new access token (and a rotated refresh token).
     * This is what keeps users logged in after the short-lived access token expires, without
     * re-entering credentials.
     */
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest req) {
        RefreshTokenService.Rotation rotation = refreshTokenService.rotate(req.refreshToken());
        User user = userMapper.findById(rotation.userId())
                .orElseThrow(() -> new BusinessException(Code.TOKEN_INVALID));
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
        return AuthResponse.of(accessToken, rotation.refreshToken(), user);
    }

    /**
     * Revokes the presented refresh token so it can no longer be used (logout).
     */
    @Transactional
    public void logout(RefreshTokenRequest req) {
        refreshTokenService.revoke(req.refreshToken());
    }

    /**
     * Issues a fresh access token + a new refresh token for an authenticated user.
     */
    private AuthResponse issueTokens(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
        String refreshToken = refreshTokenService.issue(user.getId());
        return AuthResponse.of(accessToken, refreshToken, user);
    }

    private User createGoogleUser(String email, GoogleIdToken.Payload payload) {
        String name = (String) payload.get("name");
        String displayName = (name != null && !name.isBlank()) ? name.trim() : email;
        if (displayName.length() > 100) {
            displayName = displayName.substring(0, 100);
        }
        User newUser = User.builder()
                .email(email)
                // No password for OAuth accounts: store a random, unguessable hash so the
                // password login path can never match. password_hash is NOT NULL in the schema.
                .passwordHash(passwordEncoder.encode("google-oauth:" + UUID.randomUUID()))
                .displayName(displayName)
                .koreanLevel("BEGINNER")
                .preferredModel(defaultPreferredModel)
                .build();
        userMapper.insert(newUser);
        return userMapper.findById(newUser.getId())
                .orElseThrow(() -> new BusinessException(Code.REGISTRATION_FAILED));
    }
}
