package com.cm.team.dto.response;

import com.cm.team.entity.TeamMembership;
import lombok.Getter;

@Getter
public class TeamMemberResponse {

    private final UserResponse user;
    private final String teamId;
    private final String role;
    private final String joinedAt;

    public TeamMemberResponse(TeamMembership membership) {
        this.user = new UserResponse(membership.getUser());
        this.teamId = membership.getId().getTeamId();
        this.role = membership.getRole().name();
        this.joinedAt = membership.getJoinedAt() != null ? membership.getJoinedAt().toString() + "Z" : null;
    }
}
