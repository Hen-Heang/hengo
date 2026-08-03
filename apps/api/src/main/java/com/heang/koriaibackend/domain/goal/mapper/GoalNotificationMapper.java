package com.heang.koriaibackend.domain.goal.mapper;

import com.heang.koriaibackend.domain.goal.model.GoalNotification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Mapper
public interface GoalNotificationMapper {

    int insert(GoalNotification notification);

    GoalNotification findById(@Param("id") UUID id);

    /** Notifications for a receiver, enriched with sender name + goal title, newest first. */
    List<GoalNotification> findEnrichedByReceiver(@Param("receiverId") Long receiverId,
                                                  @Param("onlyUnread") boolean onlyUnread);

    int markRead(@Param("id") UUID id, @Param("receiverId") Long receiverId);

    int updateInvitationStatus(@Param("id") UUID id,
                               @Param("receiverId") Long receiverId,
                               @Param("status") String status);

    /** Housekeeping: removes read notifications older than the cutoff. Unread ones are kept regardless of age. */
    int deleteReadOlderThan(@Param("cutoff") OffsetDateTime cutoff);
}
