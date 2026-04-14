package com.cm.team.controller;

import com.cm.team.dto.response.TeamMemberResponse;
import com.cm.team.dto.response.TeamResponse;
import com.cm.team.entity.Team;
import com.cm.team.entity.TeamMembership;
import com.cm.team.entity.TeamMembershipId;
import com.cm.team.entity.User;
import com.cm.team.service.TeamService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TeamControllerTest {

    @Mock
    private TeamService teamService;

    @InjectMocks
    private TeamController teamController;

    private MockMvc mockMvc;
    private TeamResponse teamResponse;
    private TeamMemberResponse memberResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(teamController).build();

        User owner = User.builder()
                .id("owner-1").name("팀장").email("owner@test.com").color("#4A90E2").build();
        owner.setCreatedAt(LocalDateTime.now());

        Team team = Team.builder()
                .id("team-1").name("개발팀").owner(owner).description("설명").build();
        team.setCreatedAt(LocalDateTime.now());
        teamResponse = new TeamResponse(team);

        TeamMembership membership = TeamMembership.builder()
                .id(new TeamMembershipId("team-1", "owner-1"))
                .team(team)
                .user(owner)
                .role(TeamMembership.Role.owner)
                .build();
        membership.setJoinedAt(LocalDateTime.now());
        memberResponse = new TeamMemberResponse(membership);
    }

    @Nested
    @DisplayName("GET /api/teams?userId={}")
    class GetMyTeams {

        @Test
        @DisplayName("팀 목록 조회 성공 → 200")
        void success() throws Exception {
            when(teamService.getMyTeams("owner-1")).thenReturn(List.of(teamResponse));

            mockMvc.perform(get("/api/teams").param("userId", "owner-1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value("team-1"))
                    .andExpect(jsonPath("$[0].name").value("개발팀"))
                    .andExpect(jsonPath("$[0].ownerId").value("owner-1"));
        }

        @Test
        @DisplayName("userId 파라미터 없음 → 400")
        void missingUserId() throws Exception {
            mockMvc.perform(get("/api/teams"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/teams")
    class CreateTeam {

        @Test
        @DisplayName("팀 생성 성공 → 201")
        void success() throws Exception {
            when(teamService.createTeam(eq("owner-1"), any())).thenReturn(teamResponse);

            mockMvc.perform(post("/api/teams")
                            .header("X-User-Id", "owner-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"개발팀\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value("team-1"));
        }

        @Test
        @DisplayName("name 누락 → 400")
        void missingName() throws Exception {
            mockMvc.perform(post("/api/teams")
                            .header("X-User-Id", "owner-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("X-User-Id 헤더 없음 → 400")
        void missingHeader() throws Exception {
            mockMvc.perform(post("/api/teams")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"개발팀\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("DELETE /api/teams/{teamId}")
    class DeleteTeam {

        @Test
        @DisplayName("팀 삭제 성공 → 204")
        void success() throws Exception {
            doNothing().when(teamService).deleteTeam("team-1", "owner-1");

            mockMvc.perform(delete("/api/teams/team-1")
                            .header("X-User-Id", "owner-1"))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("owner 아님 → 403")
        void forbidden() throws Exception {
            doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "권한이 없습니다."))
                    .when(teamService).deleteTeam("team-1", "member-1");

            mockMvc.perform(delete("/api/teams/team-1")
                            .header("X-User-Id", "member-1"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("팀 없음 → 404")
        void notFound() throws Exception {
            doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "팀을 찾을 수 없습니다."))
                    .when(teamService).deleteTeam("no-team", "owner-1");

            mockMvc.perform(delete("/api/teams/no-team")
                            .header("X-User-Id", "owner-1"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/teams/{teamId}/members")
    class GetTeamMembers {

        @Test
        @DisplayName("팀원 목록 조회 → 200")
        void success() throws Exception {
            when(teamService.getTeamMembers("team-1")).thenReturn(List.of(memberResponse));

            mockMvc.perform(get("/api/teams/team-1/members"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].teamId").value("team-1"))
                    .andExpect(jsonPath("$[0].role").value("owner"))
                    .andExpect(jsonPath("$[0].user.id").value("owner-1"));
        }
    }

    @Nested
    @DisplayName("POST /api/teams/{teamId}/members")
    class InviteMember {

        @Test
        @DisplayName("팀원 초대 성공 → 201")
        void success() throws Exception {
            when(teamService.inviteMember(eq("team-1"), eq("owner-1"), any())).thenReturn(memberResponse);

            mockMvc.perform(post("/api/teams/team-1/members")
                            .header("X-User-Id", "owner-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"owner@test.com\"}"))
                    .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("owner 아님 → 403")
        void forbidden() throws Exception {
            when(teamService.inviteMember(eq("team-1"), eq("member-1"), any()))
                    .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN));

            mockMvc.perform(post("/api/teams/team-1/members")
                            .header("X-User-Id", "member-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"other@test.com\"}"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("이미 팀원 → 409")
        void alreadyMember() throws Exception {
            when(teamService.inviteMember(any(), any(), any()))
                    .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT));

            mockMvc.perform(post("/api/teams/team-1/members")
                            .header("X-User-Id", "owner-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"owner@test.com\"}"))
                    .andExpect(status().isConflict());
        }
    }

    @Nested
    @DisplayName("DELETE /api/teams/{teamId}/members/{targetUserId}")
    class RemoveMember {

        @Test
        @DisplayName("팀원 제거 성공 → 204")
        void success() throws Exception {
            doNothing().when(teamService).removeMember("team-1", "member-1", "owner-1");

            mockMvc.perform(delete("/api/teams/team-1/members/member-1")
                            .header("X-User-Id", "owner-1"))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("owner 제거 시도 → 400")
        void removeOwner() throws Exception {
            doThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST))
                    .when(teamService).removeMember("team-1", "owner-1", "owner-1");

            mockMvc.perform(delete("/api/teams/team-1/members/owner-1")
                            .header("X-User-Id", "owner-1"))
                    .andExpect(status().isBadRequest());
        }
    }
}
