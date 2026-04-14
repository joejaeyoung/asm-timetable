package com.cm.team.service;

import com.cm.team.dto.request.CreateScheduleBlockRequest;
import com.cm.team.dto.request.UpdateScheduleBlockRequest;
import com.cm.team.dto.response.ScheduleBlockResponse;
import com.cm.team.entity.ScheduleBlock;
import com.cm.team.entity.Team;
import com.cm.team.entity.User;
import com.cm.team.repository.ScheduleBlockRepository;
import com.cm.team.repository.TeamRepository;
import com.cm.team.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.IsoFields;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleBlockService {

    private final ScheduleBlockRepository blockRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;

    /** month = "YYYY-MM" */
    @Transactional(readOnly = true)
    public List<ScheduleBlockResponse> getByMonth(String teamId, String month) {
        YearMonth ym = YearMonth.parse(month, DateTimeFormatter.ofPattern("yyyy-MM"));
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();
        return blockRepository.findByTeamIdAndDateBetweenOrderByDateAscStartTimeAsc(teamId, from, to)
                .stream()
                .map(ScheduleBlockResponse::new)
                .toList();
    }

    /** weekId = "YYYY-W##" */
    @Transactional(readOnly = true)
    public List<ScheduleBlockResponse> getByWeek(String teamId, String weekId) {
        // Parse "2026-W16" → Monday of that ISO week
        String[] parts = weekId.split("-W");
        int year = Integer.parseInt(parts[0]);
        int week = Integer.parseInt(parts[1]);

        LocalDate monday = LocalDate.of(year, 1, 4)
                .with(IsoFields.WEEK_OF_WEEK_BASED_YEAR, week)
                .with(java.time.DayOfWeek.MONDAY);
        LocalDate sunday = monday.plusDays(6);

        return blockRepository.findByTeamIdAndDateBetweenOrderByDateAscStartTimeAsc(teamId, monday, sunday)
                .stream()
                .map(ScheduleBlockResponse::new)
                .toList();
    }

    @Transactional
    public ScheduleBlockResponse create(CreateScheduleBlockRequest req) {
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        Team team = teamRepository.findById(req.getTeamId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "팀을 찾을 수 없습니다."));

        LocalDate date = LocalDate.parse(req.getDate());
        LocalTime startTime = LocalTime.parse(req.getStartTime());
        LocalTime endTime = LocalTime.parse(req.getEndTime());

        if (!endTime.isAfter(startTime)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "종료 시간은 시작 시간 이후여야 합니다.");
        }

        ScheduleBlock block = ScheduleBlock.builder()
                .user(user)
                .team(team)
                .date(date)
                .startTime(startTime)
                .endTime(endTime)
                .description(req.getDescription())
                .build();

        return new ScheduleBlockResponse(blockRepository.save(block));
    }

    @Transactional
    public ScheduleBlockResponse update(String blockId, UpdateScheduleBlockRequest req) {
        ScheduleBlock block = findBlock(blockId);

        if (req.getDate() != null) block.setDate(LocalDate.parse(req.getDate()));
        if (req.getStartTime() != null) block.setStartTime(LocalTime.parse(req.getStartTime()));
        if (req.getEndTime() != null) block.setEndTime(LocalTime.parse(req.getEndTime()));
        if (req.getDescription() != null) block.setDescription(req.getDescription());

        return new ScheduleBlockResponse(blockRepository.save(block));
    }

    @Transactional
    public void delete(String blockId) {
        blockRepository.delete(findBlock(blockId));
    }

    private ScheduleBlock findBlock(String id) {
        return blockRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "스케줄 블록을 찾을 수 없습니다."));
    }
}
