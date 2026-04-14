package com.cm.team.controller;

import com.cm.team.dto.request.CreateTeamRequest;
import com.cm.team.dto.request.InviteMemberRequest;
import com.cm.team.dto.response.TeamMemberResponse;
import com.cm.team.dto.response.TeamResponse;
import com.cm.team.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    /** GET /api/teams?userId={userId} */
    @GetMapping
    public List<TeamResponse> getMyTeams(@RequestParam String userId) {
        return teamService.getMyTeams(userId);
    }

    /** POST /api/teams — header: X-User-Id */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TeamResponse createTeam(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateTeamRequest req) {
        return teamService.createTeam(userId, req);
    }

    /** DELETE /api/teams/{teamId} — header: X-User-Id */
    @DeleteMapping("/{teamId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTeam(
            @PathVariable String teamId,
            @RequestHeader("X-User-Id") String userId) {
        teamService.deleteTeam(teamId, userId);
    }

    /** GET /api/teams/{teamId}/members */
    @GetMapping("/{teamId}/members")
    public List<TeamMemberResponse> getTeamMembers(@PathVariable String teamId) {
        return teamService.getTeamMembers(teamId);
    }

    /** POST /api/teams/{teamId}/members — header: X-User-Id */
    @PostMapping("/{teamId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public TeamMemberResponse inviteMember(
            @PathVariable String teamId,
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody InviteMemberRequest req) {
        return teamService.inviteMember(teamId, userId, req);
    }

    /** DELETE /api/teams/{teamId}/members/{targetUserId} — header: X-User-Id */
    @DeleteMapping("/{teamId}/members/{targetUserId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
            @PathVariable String teamId,
            @PathVariable String targetUserId,
            @RequestHeader("X-User-Id") String userId) {
        teamService.removeMember(teamId, targetUserId, userId);
    }
}
