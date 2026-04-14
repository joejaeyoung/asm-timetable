package com.cm.team.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;

@Getter
public class RegisterRequest {

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "색상은 hex 형식이어야 합니다 (e.g. #4A90E2)")
    private String color;
}
