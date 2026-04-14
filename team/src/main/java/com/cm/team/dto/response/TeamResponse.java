package com.cm.team.dto.response;

import com.cm.team.entity.Team;
import lombok.Getter;

@Getter
public class TeamResponse {

    private final String id;
    private final String name;
    private final String ownerId;
    private final String description;
    private final String createdAt;

    public TeamResponse(Team team) {
        this.id = team.getId();
        this.name = team.getName();
        this.ownerId = team.getOwner().getId();
        this.description = team.getDescription();
        this.createdAt = team.getCreatedAt() != null ? team.getCreatedAt().toString() + "Z" : null;
    }
}
