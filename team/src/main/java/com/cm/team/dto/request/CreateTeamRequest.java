package com.cm.team.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class CreateTeamRequest {

    @NotBlank
    private String name;

    private String description;
}
