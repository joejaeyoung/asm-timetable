package com.cm.team.controller;

import com.cm.team.dto.request.LoginRequest;
import com.cm.team.dto.request.RegisterRequest;
import com.cm.team.dto.response.UserResponse;
import com.cm.team.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest req) {
        return userService.login(req);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest req) {
        return userService.register(req);
    }
}
