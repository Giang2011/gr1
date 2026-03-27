package com.gr1.exam.module.user.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gr1.exam.core.security.JwtAuthenticationFilter;
import com.gr1.exam.module.user.controller.UserController;
import com.gr1.exam.module.user.dto.LoginResponseDTO;
import com.gr1.exam.module.user.dto.UserRequestDTO;
import com.gr1.exam.module.user.dto.UserResponseDTO;
import com.gr1.exam.module.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthIntegrationWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

        @MockBean
        private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void register_shouldReturn201_withExpectedBody() throws Exception {
        UserRequestDTO request = new UserRequestDTO();
        request.setName("new-user");
        request.setPassword("secret123");
        request.setRole("STUDENT");

        UserResponseDTO response = UserResponseDTO.builder()
                .id(10)
                .name("new-user")
                .role("STUDENT")
                .build();

        when(userService.register(any(UserRequestDTO.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/register")
                .contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.name").value("new-user"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    void register_shouldReturn400_whenRequestValidationFails() throws Exception {
        String invalidRequest = "{\"name\":\"\",\"password\":\"\",\"role\":\"STUDENT\"}";

        mockMvc.perform(post("/api/v1/auth/register")
                .contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_shouldReturn200_withJwtPayload() throws Exception {
        LoginResponseDTO response = LoginResponseDTO.builder()
                .token("jwt-token")
                .tokenType("Bearer")
                .user(UserResponseDTO.builder().id(1).name("admin").role("ADMIN").build())
                .build();

        when(userService.login(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                .contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"admin\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.name").value("admin"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
    }
}
