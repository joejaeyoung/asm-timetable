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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScheduleBlockServiceTest {

    @Mock
    private ScheduleBlockRepository blockRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TeamRepository teamRepository;

    @InjectMocks
    private ScheduleBlockService scheduleBlockService;

    private User user;
    private Team team;
    private ScheduleBlock block;

    @BeforeEach
    void setUp() {
        user = User.builder().id("user-1").name("김민준").email("minjun@test.com").color("#4A90E2").build();
        team = Team.builder().id("team-1").name("개발팀").owner(user).build();
        block = ScheduleBlock.builder()
                .id("block-1")
                .user(user)
                .team(team)
                .date(LocalDate.of(2026, 4, 14))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(11, 0))
                .description("스프린트 플래닝")
                .build();
    }

    @Nested
    @DisplayName("getByMonth()")
    class GetByMonth {

        @Test
        @DisplayName("월별 스케줄 블록 조회")
        void success() {
            LocalDate from = LocalDate.of(2026, 4, 1);
            LocalDate to = LocalDate.of(2026, 4, 30);
            when(blockRepository.findByTeamIdAndDateBetweenOrderByDateAscStartTimeAsc("team-1", from, to))
                    .thenReturn(List.of(block));

            List<ScheduleBlockResponse> result = scheduleBlockService.getByMonth("team-1", "2026-04");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getId()).isEqualTo("block-1");
            assertThat(result.get(0).getUserId()).isEqualTo("user-1");
            assertThat(result.get(0).getTeamId()).isEqualTo("team-1");
        }

        @Test
        @DisplayName("결과 없으면 빈 목록")
        void empty() {
            when(blockRepository.findByTeamIdAndDateBetweenOrderByDateAscStartTimeAsc(any(), any(), any()))
                    .thenReturn(List.of());

            List<ScheduleBlockResponse> result = scheduleBlockService.getByMonth("team-1", "2026-04");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getByWeek()")
    class GetByWeek {

        @Test
        @DisplayName("ISO 주차 파싱 — 2026-W16 → 4/13(월)~4/19(일)")
        void isoWeekParsing() {
            // 2026년 16주차: 월요일 = 4월 13일, 일요일 = 4월 19일
            LocalDate monday = LocalDate.of(2026, 4, 13);
            LocalDate sunday = LocalDate.of(2026, 4, 19);

            when(blockRepository.findByTeamIdAndDateBetweenOrderByDateAscStartTimeAsc("team-1", monday, sunday))
                    .thenReturn(List.of(block));

            List<ScheduleBlockResponse> result = scheduleBlockService.getByWeek("team-1", "2026-W16");

            assertThat(result).hasSize(1);
            verify(blockRepository).findByTeamIdAndDateBetweenOrderByDateAscStartTimeAsc(
                    eq("team-1"), eq(monday), eq(sunday));
        }

        @Test
        @DisplayName("첫 주차 파싱 — 2026-W01 정상 처리")
        void firstWeekOfYear() {
            scheduleBlockService.getByWeek("team-1", "2026-W01");

            verify(blockRepository).findByTeamIdAndDateBetweenOrderByDateAscStartTimeAsc(
                    eq("team-1"), any(LocalDate.class), any(LocalDate.class));
        }
    }

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("스케줄 블록 생성 성공")
        void success() {
            CreateScheduleBlockRequest req = mock(CreateScheduleBlockRequest.class);
            when(req.getUserId()).thenReturn("user-1");
            when(req.getTeamId()).thenReturn("team-1");
            when(req.getDate()).thenReturn("2026-04-14");
            when(req.getStartTime()).thenReturn("09:00");
            when(req.getEndTime()).thenReturn("11:00");
            when(req.getDescription()).thenReturn("스프린트 플래닝");

            when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
            when(teamRepository.findById("team-1")).thenReturn(Optional.of(team));
            when(blockRepository.save(any(ScheduleBlock.class))).thenAnswer(inv -> {
                ScheduleBlock b = inv.getArgument(0);
                b.setId("block-new");
                return b;
            });

            ScheduleBlockResponse result = scheduleBlockService.create(req);

            assertThat(result.getId()).isEqualTo("block-new");
            assertThat(result.getUserId()).isEqualTo("user-1");
            assertThat(result.getDate()).isEqualTo("2026-04-14");
            assertThat(result.getStartTime()).isEqualTo("09:00");
            assertThat(result.getEndTime()).isEqualTo("11:00");
        }

        @Test
        @DisplayName("endTime ≤ startTime → 400 BAD_REQUEST")
        void invalidTimeRange() {
            CreateScheduleBlockRequest req = mock(CreateScheduleBlockRequest.class);
            when(req.getUserId()).thenReturn("user-1");
            when(req.getTeamId()).thenReturn("team-1");
            when(req.getDate()).thenReturn("2026-04-14");
            when(req.getStartTime()).thenReturn("11:00");
            when(req.getEndTime()).thenReturn("09:00");

            when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
            when(teamRepository.findById("team-1")).thenReturn(Optional.of(team));

            assertThatThrownBy(() -> scheduleBlockService.create(req))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.BAD_REQUEST));
        }

        @Test
        @DisplayName("같은 시작/종료 시간 → 400 BAD_REQUEST")
        void sameStartEnd() {
            CreateScheduleBlockRequest req = mock(CreateScheduleBlockRequest.class);
            when(req.getUserId()).thenReturn("user-1");
            when(req.getTeamId()).thenReturn("team-1");
            when(req.getDate()).thenReturn("2026-04-14");
            when(req.getStartTime()).thenReturn("10:00");
            when(req.getEndTime()).thenReturn("10:00");

            when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
            when(teamRepository.findById("team-1")).thenReturn(Optional.of(team));

            assertThatThrownBy(() -> scheduleBlockService.create(req))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.BAD_REQUEST));
        }

        @Test
        @DisplayName("존재하지 않는 userId → 404 NOT_FOUND")
        void userNotFound() {
            CreateScheduleBlockRequest req = mock(CreateScheduleBlockRequest.class);
            when(req.getUserId()).thenReturn("no-user");

            when(userRepository.findById("no-user")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> scheduleBlockService.create(req))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.NOT_FOUND));
        }

        @Test
        @DisplayName("존재하지 않는 teamId → 404 NOT_FOUND")
        void teamNotFound() {
            CreateScheduleBlockRequest req = mock(CreateScheduleBlockRequest.class);
            when(req.getUserId()).thenReturn("user-1");
            when(req.getTeamId()).thenReturn("no-team");

            when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
            when(teamRepository.findById("no-team")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> scheduleBlockService.create(req))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("날짜/시간/설명 부분 수정")
        void partialUpdate() {
            UpdateScheduleBlockRequest req = mock(UpdateScheduleBlockRequest.class);
            when(req.getDate()).thenReturn("2026-04-15");
            when(req.getStartTime()).thenReturn("10:00");
            when(req.getEndTime()).thenReturn("12:00");
            when(req.getDescription()).thenReturn("수정된 설명");

            when(blockRepository.findById("block-1")).thenReturn(Optional.of(block));
            when(blockRepository.save(any(ScheduleBlock.class))).thenAnswer(inv -> inv.getArgument(0));

            ScheduleBlockResponse result = scheduleBlockService.update("block-1", req);

            assertThat(result.getDate()).isEqualTo("2026-04-15");
            assertThat(result.getStartTime()).isEqualTo("10:00");
            assertThat(result.getEndTime()).isEqualTo("12:00");
            assertThat(result.getDescription()).isEqualTo("수정된 설명");
        }

        @Test
        @DisplayName("null 필드는 기존 값 유지")
        void nullFieldsSkipped() {
            UpdateScheduleBlockRequest req = mock(UpdateScheduleBlockRequest.class);
            when(req.getDate()).thenReturn(null);
            when(req.getStartTime()).thenReturn(null);
            when(req.getEndTime()).thenReturn(null);
            when(req.getDescription()).thenReturn(null);

            when(blockRepository.findById("block-1")).thenReturn(Optional.of(block));
            when(blockRepository.save(any(ScheduleBlock.class))).thenAnswer(inv -> inv.getArgument(0));

            ScheduleBlockResponse result = scheduleBlockService.update("block-1", req);

            assertThat(result.getDate()).isEqualTo("2026-04-14");
            assertThat(result.getStartTime()).isEqualTo("09:00");
            assertThat(result.getEndTime()).isEqualTo("11:00");
        }

        @Test
        @DisplayName("존재하지 않는 블록 → 404 NOT_FOUND")
        void blockNotFound() {
            when(blockRepository.findById("no-block")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> scheduleBlockService.update("no-block", mock(UpdateScheduleBlockRequest.class)))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("스케줄 블록 삭제 성공")
        void success() {
            when(blockRepository.findById("block-1")).thenReturn(Optional.of(block));

            scheduleBlockService.delete("block-1");

            verify(blockRepository).delete(block);
        }

        @Test
        @DisplayName("존재하지 않는 블록 → 404 NOT_FOUND")
        void blockNotFound() {
            when(blockRepository.findById("no-block")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> scheduleBlockService.delete("no-block"))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.NOT_FOUND));
        }
    }
}
