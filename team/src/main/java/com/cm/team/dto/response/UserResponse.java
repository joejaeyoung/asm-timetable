package com.cm.team.dto.response;

import com.cm.team.entity.User;
import lombok.Getter;

@Getter
public class UserResponse {

    private final String id;
    private final String name;
    private final String email;
    private final String color;
    private final boolean virtualUser;

    public UserResponse(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.color = user.getColor();
        this.virtualUser = user.isTeamUser();
    }
}
