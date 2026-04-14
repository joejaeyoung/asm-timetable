package com.cm.team.service;

import com.cm.team.dto.request.LoginRequest;
import com.cm.team.dto.request.RegisterRequest;
import com.cm.team.dto.response.UserResponse;
import com.cm.team.entity.User;
import com.cm.team.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "등록되지 않은 이메일입니다."));
        return new UserResponse(user);
    }

    @Transactional
    public UserResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다.");
        }
        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail().toLowerCase())
                .color(req.getColor())
                .build();
        return new UserResponse(userRepository.save(user));
    }
}
