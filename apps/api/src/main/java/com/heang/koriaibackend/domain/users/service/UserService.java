package com.heang.koriaibackend.domain.users.service;

import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.domain.users.dto.CreateUserRequest;
import com.heang.koriaibackend.domain.users.dto.UpdatePreferredModelRequest;
import com.heang.koriaibackend.domain.users.dto.UpdateStudyRemindersRequest;
import com.heang.koriaibackend.domain.users.dto.UpdateUserProfileRequest;
import com.heang.koriaibackend.domain.users.mapper.UserMapper;
import com.heang.koriaibackend.domain.users.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public boolean existsByEmail(String email) {

        return userMapper.findByEmail(email.trim().toLowerCase()).isPresent();
    }

    @Transactional
    public User create(CreateUserRequest req) {
        String email = req.email().trim().toLowerCase();
        if (existsByEmail(email)) {
            throw new IllegalArgumentException(Code.EMAIL_ALREADY_EXISTS.getMessage());
        }
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(req.password()))
                .displayName(req.displayName().trim())
                .koreanLevel(req.koreanLevel().trim().toUpperCase())
                .preferredModel(req.preferredModel().trim())
                .build();
        userMapper.insert(user);
        return user;
    }

    public Optional<User> findById(Long id) {
        return userMapper.findById(id);
    }

    public List<User> search(String query, Long excludeId, int limit) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return userMapper.searchByQuery(query.trim(), excludeId, Math.min(Math.max(limit, 1), 25));
    }

    @Transactional
    public Optional<User> updateProfile(Long id, UpdateUserProfileRequest req) {
        int updated = userMapper.updateProfile(
                id,
                req.displayName().trim(),
                req.koreanLevel().trim().toUpperCase(),
                trimToNull(req.country()),
                trimToNull(req.nativeLanguage()),
                trimToNull(req.occupation()),
                req.yearsOfExperience(),
                trimToNull(req.learningGoal()));
        if (updated == 0) {
            return Optional.empty();
        }
        return userMapper.findById(id);
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    @Transactional
    public Optional<User> updatePreferredModel(Long id, UpdatePreferredModelRequest req) {
        int updated = userMapper.updatePreferredModel(id, req.preferredModel().trim());
        if (updated == 0) {
            return Optional.empty();
        }
        return userMapper.findById(id);
    }

    @Transactional
    public Optional<User> updateStudyReminders(Long id, UpdateStudyRemindersRequest req) {
        int updated = userMapper.updateStudyReminders(id, req.enabled(), req.hour());
        if (updated == 0) {
            return Optional.empty();
        }
        return userMapper.findById(id);
    }

    @Transactional
    public Optional<User> updateProfileImage(Long id, String contentType, byte[] data) {
        int updated = userMapper.updateProfileImage(id, contentType, data);
        if (updated == 0) {
            return Optional.empty();
        }
        return userMapper.findById(id);
    }

    public Optional<User> getProfileImage(Long id) {
        return userMapper.findProfileImage(id)
                .filter(user -> user.getProfileImageData() != null && user.getProfileImageData().length > 0);
    }

    @Transactional
    public boolean deleteById(Long id) {
        return userMapper.deleteById(id) > 0;
    }
}
