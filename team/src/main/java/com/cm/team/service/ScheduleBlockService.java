package com.cm.team.service;

import com.cm.team.dto.request.CreateRecurringScheduleBlockRequest;
import com.cm.team.dto.request.CreateScheduleBlockRequest;
import com.cm.team.dto.request.DeleteScheduleBlockRequest;
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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.IsoFields;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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

    @Transactional
    public List<ScheduleBlockResponse> createRecurring(CreateRecurringScheduleBlockRequest req) {
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        Team team = teamRepository.findById(req.getTeamId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "팀을 찾을 수 없습니다."));

        LocalTime startTime = LocalTime.parse(req.getStartTime());
        LocalTime endTime = LocalTime.parse(req.getEndTime());

        if (!endTime.isAfter(startTime)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "종료 시간은 시작 시간 이후여야 합니다.");
        }

        // 요일 목록 (ISO: 1=월 ~ 7=일)
        List<DayOfWeek> targetDays = req.getDaysOfWeek().stream()
                .map(DayOfWeek::of)
                .toList();

        // 반복 종료 조건
        LocalDate endDate = "date".equals(req.getEndCondition())
                ? LocalDate.parse(req.getEndDate())
                : null;
        int maxOccurrences = "count".equals(req.getEndCondition())
                ? req.getOccurrences()
                : 52; // 최대 52회 안전 제한

        String groupId = UUID.randomUUID().toString();
        List<ScheduleBlock> blocks = new ArrayList<>();
        LocalDate cursor = LocalDate.parse(req.getStartDate());
        int index = 0;

        while (index < maxOccurrences) {
            if (endDate != null && cursor.isAfter(endDate)) break;
            if (targetDays.contains(cursor.getDayOfWeek())) {
                blocks.add(ScheduleBlock.builder()
                        .user(user)
                        .team(team)
                        .date(cursor)
                        .startTime(startTime)
                        .endTime(endTime)
                        .description(req.getDescription())
                        .recurrenceGroupId(groupId)
                        .recurrenceIndex(index)
                        .build());
                index++;
            }
            cursor = cursor.plusDays(1);
            // 안전 장치: startDate 기준 1년 초과 시 중단
            if (cursor.isAfter(LocalDate.parse(req.getStartDate()).plusYears(1))) break;
        }

        if (blocks.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "생성할 반복 일정이 없습니다.");
        }

        return blockRepository.saveAll(blocks).stream()
                .map(ScheduleBlockResponse::new)
                .toList();
    }

    @Transactional
    public void deleteWithScope(String blockId, DeleteScheduleBlockRequest.DeleteScope scope) {
        ScheduleBlock block = findBlock(blockId);
        String groupId = block.getRecurrenceGroupId();

        if (groupId == null || scope == DeleteScheduleBlockRequest.DeleteScope.THIS_ONLY) {
            blockRepository.delete(block);
            return;
        }

        switch (scope) {
            case ALL -> blockRepository.deleteByRecurrenceGroupId(groupId);
            case THIS_AND_AFTER -> blockRepository
                    .deleteByRecurrenceGroupIdAndRecurrenceIndexGreaterThanEqual(
                            groupId, block.getRecurrenceIndex());
        }
    }

    private ScheduleBlock findBlock(String id) {
        return blockRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "스케줄 블록을 찾을 수 없습니다."));
    }
}
