package com.cm.team.service;

import com.cm.team.dto.request.CreateTeamRequest;
import com.cm.team.dto.request.InviteMemberRequest;
import com.cm.team.dto.response.TeamMemberResponse;
import com.cm.team.dto.response.TeamResponse;
import com.cm.team.entity.Team;
import com.cm.team.entity.TeamMembership;
import com.cm.team.entity.TeamMembershipId;
import com.cm.team.entity.User;
import com.cm.team.repository.TeamMembershipRepository;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock
    private TeamRepository teamRepository;
    @Mock
    private TeamMembershipRepository membershipRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TeamService teamService;

    private User owner;
    private User member;
    private Team team;

    @BeforeEach
    void setUp() {
        owner = User.builder().id("owner-1").name("팀장").email("owner@test.com").color("#4A90E2").build();
        member = User.builder().id("member-1").name("팀원").email("member@test.com").color("#E25C5C").build();
        team = Team.builder().id("team-1").name("개발팀").owner(owner).description("설명").build();
    }

    @Nested
    @DisplayName("getMyTeams()")
    class GetMyTeams {

        @Test
        @DisplayName("사용자가 속한 팀 목록 반환")
        void success() {
            when(teamRepository.findAllByMemberUserId("owner-1")).thenReturn(List.of(team));

            List<TeamResponse> result = teamService.getMyTeams("owner-1");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getId()).isEqualTo("team-1");
            assertThat(result.get(0).getName()).isEqualTo("개발팀");
            assertThat(result.get(0).getOwnerId()).isEqualTo("owner-1");
        }

        @Test
        @DisplayName("팀이 없으면 빈 목록 반환")
        void empty() {
            when(teamRepository.findAllByMemberUserId("owner-1")).thenReturn(List.of());

            List<TeamResponse> result = teamService.getMyTeams("owner-1");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("createTeam()")
    class CreateTeam {

        @Test
        @DisplayName("팀 생성 + owner 멤버십 자동 등록")
        void success() {
            CreateTeamRequest req = mock(CreateTeamRequest.class);
            when(req.getName()).thenReturn("새팀");
            when(req.getDescription()).thenReturn("설명");

            when(userRepository.findById("owner-1")).thenReturn(Optional.of(owner));
            when(teamRepository.save(any(Team.class))).thenAnswer(inv -> {
                Team t = inv.getArgument(0);
                t.setId("team-new");
                return t;
            });
            when(membershipRepository.save(any(TeamMembership.class))).thenAnswer(inv -> inv.getArgument(0));

            TeamResponse result = teamService.createTeam("owner-1", req);

            assertThat(result.getId()).isEqualTo("team-new");
            assertThat(result.getName()).isEqualTo("새팀");
            assertThat(result.getOwnerId()).isEqualTo("owner-1");
            verify(membershipRepository).save(argThat(m -> m.getRole() == TeamMembership.Role.owner));
        }

        @Test
        @DisplayName("존재하지 않는 owner → 404 NOT_FOUND")
        void ownerNotFound() {
            when(userRepository.findById("no-user")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.createTeam("no-user", mock(CreateTeamRequest.class)))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("deleteTeam()")
    class DeleteTeam {

        @Test
        @DisplayName("owner가 팀 삭제 성공")
        void success() {
            when(teamRepository.findById("team-1")).thenReturn(Optional.of(team));

            teamService.deleteTeam("team-1", "owner-1");

            verify(membershipRepository).deleteByIdTeamId("team-1");
            verify(teamRepository).delete(team);
        }

        @Test
        @DisplayName("owner 아닌 사용자 → 403 FORBIDDEN")
        void notOwner() {
            when(teamRepository.findById("team-1")).thenReturn(Optional.of(team));

            assertThatThrownBy(() -> teamService.deleteTeam("team-1", "member-1"))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));

            verify(teamRepository, never()).delete(any());
        }

        @Test
        @DisplayName("팀 없음 → 404 NOT_FOUND")
        void teamNotFound() {
            when(teamRepository.findById("no-team")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.deleteTeam("no-team", "owner-1"))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("inviteMember()")
    class InviteMember {

        @Test
        @DisplayName("owner가 이메일로 팀원 초대 성공")
        void success() {
            InviteMemberRequest req = mock(InviteMemberRequest.class);
            when(req.getEmail()).thenReturn("Member@Test.com");

            when(teamRepository.findById("team-1")).thenReturn(Optional.of(team));
            when(userRepository.findByEmail("member@test.com")).thenReturn(Optional.of(member));
            when(membershipRepository.existsByIdTeamIdAndIdUserId("team-1", "member-1")).thenReturn(false);
            when(membershipRepository.save(any(TeamMembership.class))).thenAnswer(inv -> {
                TeamMembership m = inv.getArgument(0);
                m.setTeam(team);
                m.setUser(member);
                return m;
            });

            TeamMemberResponse result = teamService.inviteMember("team-1", "owner-1", req);

            assertThat(result.getRole()).isEqualTo("member");
            assertThat(result.getTeamId()).isEqualTo("team-1");
        }

        @Test
        @DisplayName("owner 아닌 사람 초대 시도 → 403 FORBIDDEN")
        void notOwner() {
            when(teamRepository.findById("team-1")).thenReturn(Optional.of(team));

            assertThatThrownBy(() -> teamService.inviteMember("team-1", "member-1", mock(InviteMemberRequest.class)))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }

        @Test
        @DisplayName("등록되지 않은 이메일 초대 → 404 NOT_FOUND")
        void userNotFound() {
            InviteMemberRequest req = mock(InviteMemberRequest.class);
            when(req.getEmail()).thenReturn("nobody@test.com");

            when(teamRepository.findById("team-1")).thenReturn(Optional.of(team));
            when(userRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.inviteMember("team-1", "owner-1", req))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.NOT_FOUND));
        }

        @Test
        @DisplayName("이미 팀원인 사용자 초대 → 409 CONFLICT")
        void alreadyMember() {
            InviteMemberRequest req = mock(InviteMemberRequest.class);
            when(req.getEmail()).thenReturn("member@test.com");

            when(teamRepository.findById("team-1")).thenReturn(Optional.of(team));
            when(userRepository.findByEmail("member@test.com")).thenReturn(Optional.of(member));
            when(membershipRepository.existsByIdTeamIdAndIdUserId("team-1", "member-1")).thenReturn(true);

            assertThatThrownBy(() -> teamService.inviteMember("team-1", "owner-1", req))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.CONFLICT));
        }
    }

    @Nested
    @DisplayName("removeMember()")
    class RemoveMember {

        @Test
        @DisplayName("owner가 팀원 제거 성공")
        void success() {
            when(teamRepository.findById("team-1")).thenReturn(Optional.of(team));
            when(membershipRepository.existsById(new TeamMembershipId("team-1", "member-1"))).thenReturn(true);

            teamService.removeMember("team-1", "member-1", "owner-1");

            verify(membershipRepository).deleteById(new TeamMembershipId("team-1", "member-1"));
        }

        @Test
        @DisplayName("owner 아닌 사람이 제거 시도 → 403 FORBIDDEN")
        void notOwner() {
            when(teamRepository.findById("team-1")).thenReturn(Optional.of(team));

            assertThatThrownBy(() -> teamService.removeMember("team-1", "member-1", "member-1"))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }

        @Test
        @DisplayName("owner 본인 제거 시도 → 400 BAD_REQUEST")
        void cannotRemoveOwner() {
            when(teamRepository.findById("team-1")).thenReturn(Optional.of(team));

            assertThatThrownBy(() -> teamService.removeMember("team-1", "owner-1", "owner-1"))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.BAD_REQUEST));
        }

        @Test
        @DisplayName("팀원 아닌 사용자 제거 시도 → 404 NOT_FOUND")
        void notMember() {
            when(teamRepository.findById("team-1")).thenReturn(Optional.of(team));
            when(membershipRepository.existsById(new TeamMembershipId("team-1", "nobody"))).thenReturn(false);

            assertThatThrownBy(() -> teamService.removeMember("team-1", "nobody", "owner-1"))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.NOT_FOUND));
        }
    }
}
