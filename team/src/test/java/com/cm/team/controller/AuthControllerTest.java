package com.cm.team.controller;

import com.cm.team.dto.response.UserResponse;
import com.cm.team.entity.User;
import com.cm.team.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private AuthController authController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        objectMapper = new ObjectMapper();
    }

    private UserResponse buildUserResponse() {
        User user = User.builder()
                .id("user-1").name("김민준").email("minjun@test.com").color("#4A90E2").build();
        return new UserResponse(user);
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class Login {

        @Test
        @DisplayName("로그인 성공 → 200 + UserResponse")
        void success() throws Exception {
            when(userService.login(any())).thenReturn(buildUserResponse());

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"minjun@test.com\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value("user-1"))
                    .andExpect(jsonPath("$.name").value("김민준"))
                    .andExpect(jsonPath("$.email").value("minjun@test.com"))
                    .andExpect(jsonPath("$.color").value("#4A90E2"));
        }

        @Test
        @DisplayName("등록되지 않은 이메일 → 401")
        void unauthorized() throws Exception {
            when(userService.login(any()))
                    .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "등록되지 않은 이메일입니다."));

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"unknown@test.com\"}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("이메일 형식 오류 → 400")
        void invalidEmail() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"not-an-email\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("이메일 필드 없음 → 400")
        void missingEmail() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/register")
    class Register {

        @Test
        @DisplayName("회원가입 성공 → 201 + UserResponse")
        void success() throws Exception {
            when(userService.register(any())).thenReturn(buildUserResponse());

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"김민준\",\"email\":\"minjun@test.com\",\"color\":\"#4A90E2\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value("user-1"));
        }

        @Test
        @DisplayName("중복 이메일 → 409")
        void conflict() throws Exception {
            when(userService.register(any()))
                    .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."));

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"김민준\",\"email\":\"minjun@test.com\",\"color\":\"#4A90E2\"}"))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("잘못된 color 형식 → 400")
        void invalidColor() throws Exception {
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"김민준\",\"email\":\"minjun@test.com\",\"color\":\"blue\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("name 누락 → 400")
        void missingName() throws Exception {
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"minjun@test.com\",\"color\":\"#4A90E2\"}"))
                    .andExpect(status().isBadRequest());
        }
    }
}
