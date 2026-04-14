package com.cm.team.repository;

import com.cm.team.entity.ScheduleBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleBlockRepository extends JpaRepository<ScheduleBlock, String> {

    List<ScheduleBlock> findByTeamIdAndDateBetweenOrderByDateAscStartTimeAsc(
            String teamId, LocalDate from, LocalDate to);

    List<ScheduleBlock> findByTeamIdAndDateOrderByStartTimeAsc(String teamId, LocalDate date);
}
