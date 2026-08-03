package com.heang.koriaibackend.domain.activity.service;


import com.heang.koriaibackend.domain.activity.mapper.ActivityLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor

public class ActivityService {


    private final ActivityLogMapper activityLogMapper;

    public void log(Long userId, String feature, long durationMs) {

        activityLogMapper.insert(userId, feature, durationMs);
    }
}
