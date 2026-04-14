package com.cm.team.service;

import com.cm.team.dto.request.LoginRequest;
import com.cm.team.dto.request.RegisterRequest;
import com.cm.team.dto.response.UserResponse;
import com.cm.team.entity.User;
import com.cm.team.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user-1")
                .name("김민준")
                .email("minjun@test.com")
                .color("#4A90E2")
                .build();
    }

    @Nested
    @DisplayName("login()")
    class Login {

        @Test
        @DisplayName("이메일로 로그인 성공")
        void success() {
            LoginRequest req = mock(LoginRequest.class);
            when(req.getEmail()).thenReturn("Minjun@Test.com"); // 대소문자 혼합
            when(userRepository.findByEmail("minjun@test.com")).thenReturn(Optional.of(testUser));

            UserResponse response = userService.login(req);

            assertThat(response.getId()).isEqualTo("user-1");
            assertThat(response.getName()).isEqualTo("김민준");
            assertThat(response.getEmail()).isEqualTo("minjun@test.com");
            assertThat(response.getColor()).isEqualTo("#4A90E2");
        }

        @Test
        @DisplayName("이메일 소문자 변환 후 조회")
        void emailLowercase() {
            LoginRequest req = mock(LoginRequest.class);
            when(req.getEmail()).thenReturn("UPPER@TEST.COM");
            when(userRepository.findByEmail("upper@test.com")).thenReturn(Optional.of(testUser));

            userService.login(req);

            verify(userRepository).findByEmail("upper@test.com");
        }

        @Test
        @DisplayName("등록되지 않은 이메일 → 401 UNAUTHORIZED")
        void emailNotFound() {
            LoginRequest req = mock(LoginRequest.class);
            when(req.getEmail()).thenReturn("unknown@test.com");
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.login(req))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.UNAUTHORIZED));
        }
    }

    @Nested
    @DisplayName("register()")
    class Register {

        @Test
        @DisplayName("신규 계정 생성 성공")
        void success() {
            RegisterRequest req = mock(RegisterRequest.class);
            when(req.getName()).thenReturn("이서연");
            when(req.getEmail()).thenReturn("Seoyeon@Test.com");
            when(req.getColor()).thenReturn("#E25C5C");

            when(userRepository.existsByEmail("seoyeon@test.com")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId("user-2");
                return u;
            });

            UserResponse response = userService.register(req);

            assertThat(response.getName()).isEqualTo("이서연");
            assertThat(response.getEmail()).isEqualTo("seoyeon@test.com"); // 소문자 변환
            assertThat(response.getColor()).isEqualTo("#E25C5C");
        }

        @Test
        @DisplayName("이메일 소문자로 저장")
        void emailSavedLowercase() {
            RegisterRequest req = mock(RegisterRequest.class);
            when(req.getName()).thenReturn("테스트");
            when(req.getEmail()).thenReturn("TEST@EXAMPLE.COM");
            when(req.getColor()).thenReturn("#123456");

            when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            userService.register(req);

            verify(userRepository).existsByEmail("test@example.com");
            verify(userRepository).save(argThat(u -> "test@example.com".equals(u.getEmail())));
        }

        @Test
        @DisplayName("이미 사용 중인 이메일 → 409 CONFLICT")
        void duplicateEmail() {
            RegisterRequest req = mock(RegisterRequest.class);
            when(req.getEmail()).thenReturn("minjun@test.com");
            when(userRepository.existsByEmail("minjun@test.com")).thenReturn(true);

            assertThatThrownBy(() -> userService.register(req))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.CONFLICT));

            verify(userRepository, never()).save(any());
        }
    }
}
