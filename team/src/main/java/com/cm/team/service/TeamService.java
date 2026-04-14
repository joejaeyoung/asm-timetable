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
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMembershipRepository membershipRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<TeamResponse> getMyTeams(String userId) {
        return teamRepository.findAllByMemberUserId(userId)
                .stream()
                .map(TeamResponse::new)
                .toList();
    }

    @Transactional
    public TeamResponse createTeam(String ownerId, CreateTeamRequest req) {
        User owner = findUser(ownerId);

        Team team = Team.builder()
                .name(req.getName())
                .owner(owner)
                .description(req.getDescription())
                .build();
        team = teamRepository.save(team);

        // Add owner as member
        TeamMembership ownership = TeamMembership.builder()
                .id(new TeamMembershipId(team.getId(), ownerId))
                .team(team)
                .user(owner)
                .role(TeamMembership.Role.owner)
                .build();
        membershipRepository.save(ownership);

        return new TeamResponse(team);
    }

    @Transactional
    public void deleteTeam(String teamId, String requesterId) {
        Team team = findTeam(teamId);
        assertOwner(team, requesterId);
        membershipRepository.deleteByIdTeamId(teamId);
        teamRepository.delete(team);
    }

    @Transactional(readOnly = true)
    public List<TeamMemberResponse> getTeamMembers(String teamId) {
        return membershipRepository.findByIdTeamId(teamId)
                .stream()
                .map(TeamMemberResponse::new)
                .toList();
    }

    @Transactional
    public TeamMemberResponse inviteMember(String teamId, String requesterId, InviteMemberRequest req) {
        Team team = findTeam(teamId);
        assertOwner(team, requesterId);

        User target = userRepository.findByEmail(req.getEmail().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "등록되지 않은 이메일입니다."));

        if (membershipRepository.existsByIdTeamIdAndIdUserId(teamId, target.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 팀원입니다.");
        }

        TeamMembership membership = TeamMembership.builder()
                .id(new TeamMembershipId(teamId, target.getId()))
                .team(team)
                .user(target)
                .role(TeamMembership.Role.member)
                .build();
        return new TeamMemberResponse(membershipRepository.save(membership));
    }

    @Transactional
    public void removeMember(String teamId, String targetUserId, String requesterId) {
        Team team = findTeam(teamId);
        assertOwner(team, requesterId);

        if (team.getOwner().getId().equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "팀장은 팀에서 제거할 수 없습니다.");
        }

        TeamMembershipId id = new TeamMembershipId(teamId, targetUserId);
        if (!membershipRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "팀원이 아닙니다.");
        }
        membershipRepository.deleteById(id);
    }

    // ── helpers ──────────────────────────────────────────────

    private Team findTeam(String teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "팀을 찾을 수 없습니다."));
    }

    private User findUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    private void assertOwner(Team team, String userId) {
        if (!team.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "권한이 없습니다.");
        }
    }
}
