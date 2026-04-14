package com.cm.team.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class InviteMemberRequest {

    @NotBlank
    @Email
    private String email;
}
