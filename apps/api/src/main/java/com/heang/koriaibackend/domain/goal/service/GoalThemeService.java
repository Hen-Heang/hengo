package com.heang.koriaibackend.domain.goal.service;

import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.exception.BusinessException;
import com.heang.koriaibackend.domain.goal.dto.GoalThemeResponse;
import com.heang.koriaibackend.domain.goal.dto.SaveGoalThemeRequest;
import com.heang.koriaibackend.domain.goal.mapper.GoalThemeMapper;
import com.heang.koriaibackend.domain.goal.model.GoalTheme;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Goal theme CRUD, owned by the user. */
@Service
@RequiredArgsConstructor
public class GoalThemeService {

    private final GoalThemeMapper goalThemeMapper;

    public List<GoalThemeResponse> listThemes(Long userId) {
        return goalThemeMapper.findByUser(userId).stream().map(GoalThemeResponse::of).toList();
    }

    @Transactional
    public GoalThemeResponse create(Long userId, SaveGoalThemeRequest req) {
        GoalTheme theme = GoalTheme.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .name(req.name().trim())
                .goalProfileImage(req.goalProfileImage())
                .cardBackgroundImage(req.cardBackgroundImage())
                .pageBackgroundImage(req.pageBackgroundImage())
                .publicTheme(Boolean.TRUE.equals(req.isPublic()))
                .build();
        goalThemeMapper.insert(theme);
        return GoalThemeResponse.of(goalThemeMapper.findById(theme.getId()));
    }

    @Transactional
    public GoalThemeResponse update(Long userId, UUID themeId, SaveGoalThemeRequest req) {
        GoalTheme theme = requireOwner(userId, themeId);
        theme.setName(req.name().trim());
        theme.setGoalProfileImage(req.goalProfileImage());
        theme.setCardBackgroundImage(req.cardBackgroundImage());
        theme.setPageBackgroundImage(req.pageBackgroundImage());
        if (req.isPublic() != null) theme.setPublicTheme(req.isPublic());
        goalThemeMapper.update(theme);
        return GoalThemeResponse.of(goalThemeMapper.findById(themeId));
    }

    @Transactional
    public void delete(Long userId, UUID themeId) {
        if (goalThemeMapper.deleteByIdAndOwner(themeId, userId) == 0) {
            throw new BusinessException(Code.INSUFFICIENT_PERMISSIONS);
        }
    }

    private GoalTheme requireOwner(Long userId, UUID themeId) {
        GoalTheme theme = goalThemeMapper.findById(themeId);
        if (theme == null) {
            throw new BusinessException(Code.NOT_FOUND);
        }
        if (!theme.getUserId().equals(userId)) {
            throw new BusinessException(Code.INSUFFICIENT_PERMISSIONS);
        }
        return theme;
    }
}
