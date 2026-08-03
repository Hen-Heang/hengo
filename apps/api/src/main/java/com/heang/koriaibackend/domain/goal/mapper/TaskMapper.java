package com.heang.koriaibackend.domain.goal.mapper;

import com.heang.koriaibackend.domain.goal.model.DueTaskReminder;
import com.heang.koriaibackend.domain.goal.model.Task;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Mapper
public interface TaskMapper {

    int insert(Task task);

    Task findById(@Param("id") UUID id);

    /** Tasks for a goal. */
    List<Task> findByGoal(@Param("goalId") UUID goalId);

    /**
     * Calendar/range query. {@code goalId} null = all the user's tasks; otherwise that goal's tasks.
     * {@code from}/{@code to} are optional bounds on start_date.
     */
    List<Task> findRange(@Param("userId") Long userId,
                         @Param("goalId") UUID goalId,
                         @Param("from") OffsetDateTime from,
                         @Param("to") OffsetDateTime to);

    int update(Task task);

    int updateCompleted(@Param("id") UUID id,
                        @Param("completed") boolean completed,
                        @Param("updatedBy") Long updatedBy);

    int deleteById(@Param("id") UUID id);

    /**
     * Timed, incomplete, not-yet-reminded tasks whose start is within the owner's
     * reminder-offset window (and still upcoming). Drives the per-minute reminder job.
     */
    List<DueTaskReminder> findDueReminders();

    /** Fire-once stamp so a task is reminded at most one time. */
    int markReminderSent(@Param("id") UUID id);

    /**
     * Timed, incomplete, not-yet-warned tasks whose end (daily_end_time) is within
     * the owner's reminder-offset window and still upcoming. Drives the "due soon"
     * reminder.
     */
    List<DueTaskReminder> findDueSoonReminders();

    /** Fire-once stamp for the "due soon" reminder. */
    int markDueSoonSent(@Param("id") UUID id);

    /**
     * Timed, incomplete, not-yet-warned tasks whose end (daily_end_time) has
     * already passed. Drives the "overdue" reminder.
     */
    List<DueTaskReminder> findOverdueReminders();

    /** Fire-once stamp for the "overdue" reminder. */
    int markOverdueSent(@Param("id") UUID id);
}
