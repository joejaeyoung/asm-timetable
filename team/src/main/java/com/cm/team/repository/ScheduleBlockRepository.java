package com.cm.team.repository;

import com.cm.team.entity.ScheduleBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleBlockRepository extends JpaRepository<ScheduleBlock, String> {

    List<ScheduleBlock> findByTeamIdAndDateBetweenOrderByDateAscStartTimeAsc(
            String teamId, LocalDate from, LocalDate to);

    List<ScheduleBlock> findByTeamIdAndDateOrderByStartTimeAsc(String teamId, LocalDate date);

    @Modifying
    void deleteByRecurrenceGroupId(String recurrenceGroupId);

    @Modifying
    @Query("DELETE FROM ScheduleBlock b WHERE b.recurrenceGroupId = :groupId AND b.recurrenceIndex >= :index")
    void deleteByRecurrenceGroupIdAndRecurrenceIndexGreaterThanEqual(
            @Param("groupId") String recurrenceGroupId,
            @Param("index") int recurrenceIndex);
}
