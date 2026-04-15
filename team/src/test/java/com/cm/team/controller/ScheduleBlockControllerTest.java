package com.cm.team.controller;

import com.cm.team.dto.response.ScheduleBlockResponse;
import com.cm.team.entity.ScheduleBlock;
import com.cm.team.entity.Team;
import com.cm.team.entity.User;
import com.cm.team.service.ScheduleBlockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ScheduleBlockControllerTest {

    @Mock
    private ScheduleBlockService scheduleBlockService;

    @InjectMocks
    private ScheduleBlockController scheduleBlockController;

    private MockMvc mockMvc;
    private ScheduleBlockResponse blockResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(scheduleBlockController).build();

        User user = User.builder().id("user-1").name("김민준").email("minjun@test.com").color("#4A90E2").build();
        Team team = Team.builder().id("team-1").name("개발팀").owner(user).build();
        ScheduleBlock block = ScheduleBlock.builder()
                .id("block-1")
                .user(user)
                .team(team)
                .date(LocalDate.of(2026, 4, 14))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(11, 0))
                .description("스프린트 플래닝")
                .build();
        blockResponse = new ScheduleBlockResponse(block);
    }

    @Nested
    @DisplayName("GET /api/schedule")
    class GetSchedule {

        @Test
        @DisplayName("월별 조회 → 200")
        void byMonth() throws Exception {
            when(scheduleBlockService.getByMonth("team-1", "2026-04")).thenReturn(List.of(blockResponse));

            mockMvc.perform(get("/api/schedule")
                            .param("teamId", "team-1")
                            .param("month", "2026-04"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value("block-1"))
                    .andExpect(jsonPath("$[0].userId").value("user-1"))
                    .andExpect(jsonPath("$[0].teamId").value("team-1"))
                    .andExpect(jsonPath("$[0].date").value("2026-04-14"))
                    .andExpect(jsonPath("$[0].startTime").value("09:00"))
                    .andExpect(jsonPath("$[0].endTime").value("11:00"));
        }

        @Test
        @DisplayName("주별 조회 → 200")
        void byWeek() throws Exception {
            when(scheduleBlockService.getByWeek("team-1", "2026-W16")).thenReturn(List.of(blockResponse));

            mockMvc.perform(get("/api/schedule")
                            .param("teamId", "team-1")
                            .param("week", "2026-W16"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value("block-1"));
        }

        @Test
        @DisplayName("month/week 모두 없음 → 400")
        void missingParams() throws Exception {
            mockMvc.perform(get("/api/schedule")
                            .param("teamId", "team-1"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("teamId 없음 → 400")
        void missingTeamId() throws Exception {
            mockMvc.perform(get("/api/schedule")
                            .param("month", "2026-04"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("month 파라미터 우선 처리")
        void monthTakesPriority() throws Exception {
            when(scheduleBlockService.getByMonth(any(), any())).thenReturn(List.of());

            mockMvc.perform(get("/api/schedule")
                            .param("teamId", "team-1")
                            .param("month", "2026-04")
                            .param("week", "2026-W16"))
                    .andExpect(status().isOk());

            verify(scheduleBlockService).getByMonth("team-1", "2026-04");
            verify(scheduleBlockService, never()).getByWeek(any(), any());
        }
    }

    @Nested
    @DisplayName("POST /api/schedule")
    class CreateBlock {

        @Test
        @DisplayName("블록 생성 성공 → 201")
        void success() throws Exception {
            when(scheduleBlockService.create(any())).thenReturn(blockResponse);

            mockMvc.perform(post("/api/schedule")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"userId\":\"user-1\",\"teamId\":\"team-1\",\"date\":\"2026-04-14\",\"startTime\":\"09:00\",\"endTime\":\"11:00\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value("block-1"));
        }

        @Test
        @DisplayName("userId 누락 → 팀 블록 생성 → 201")
        void missingUserId() throws Exception {
            // userId=null은 팀 전체 일정으로 처리 → 201 Created
            Team team = Team.builder().id("team-1").name("개발팀").build();
            ScheduleBlock teamBlock = ScheduleBlock.builder()
                    .id("team-block-1")
                    .user(null)
                    .team(team)
                    .date(LocalDate.of(2026, 4, 14))
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(11, 0))
                    .build();
            when(scheduleBlockService.create(any())).thenReturn(new ScheduleBlockResponse(teamBlock));

            mockMvc.perform(post("/api/schedule")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"teamId\":\"team-1\",\"date\":\"2026-04-14\",\"startTime\":\"09:00\",\"endTime\":\"11:00\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value("team-block-1"));
        }

        @Test
        @DisplayName("잘못된 날짜 형식 → 400")
        void invalidDateFormat() throws Exception {
            mockMvc.perform(post("/api/schedule")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"userId\":\"user-1\",\"teamId\":\"team-1\",\"date\":\"2026/04/14\",\"startTime\":\"09:00\",\"endTime\":\"11:00\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("endTime ≤ startTime → 400")
        void invalidTimeRange() throws Exception {
            when(scheduleBlockService.create(any()))
                    .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "종료 시간은 시작 시간 이후여야 합니다."));

            mockMvc.perform(post("/api/schedule")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"userId\":\"user-1\",\"teamId\":\"team-1\",\"date\":\"2026-04-14\",\"startTime\":\"11:00\",\"endTime\":\"09:00\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PUT /api/schedule/{id}")
    class UpdateBlock {

        @Test
        @DisplayName("블록 수정 성공 → 200")
        void success() throws Exception {
            when(scheduleBlockService.update(eq("block-1"), any())).thenReturn(blockResponse);

            mockMvc.perform(put("/api/schedule/block-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"date\":\"2026-04-15\",\"startTime\":\"10:00\",\"endTime\":\"12:00\"}"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("빈 바디로 수정 → 200 (모든 필드 optional)")
        void emptyBody() throws Exception {
            when(scheduleBlockService.update(eq("block-1"), any())).thenReturn(blockResponse);

            mockMvc.perform(put("/api/schedule/block-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("블록 없음 → 404")
        void notFound() throws Exception {
            when(scheduleBlockService.update(eq("no-block"), any()))
                    .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

            mockMvc.perform(put("/api/schedule/no-block")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/schedule/{id}")
    class DeleteBlock {

        @Test
        @DisplayName("블록 삭제 성공 → 204")
        void success() throws Exception {
            doNothing().when(scheduleBlockService).delete("block-1");

            mockMvc.perform(delete("/api/schedule/block-1"))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("블록 없음 → 404")
        void notFound() throws Exception {
            doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND))
                    .when(scheduleBlockService).delete("no-block");

            mockMvc.perform(delete("/api/schedule/no-block"))
                    .andExpect(status().isNotFound());
        }
    }
}
