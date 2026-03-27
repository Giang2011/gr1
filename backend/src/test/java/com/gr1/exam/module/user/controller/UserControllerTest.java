package com.gr1.exam.module.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gr1.exam.core.exception.GlobalExceptionHandler;
import com.gr1.exam.module.user.dto.LoginResponseDTO;
import com.gr1.exam.module.user.dto.UserRequestDTO;
import com.gr1.exam.module.user.dto.UserResponseDTO;
import com.gr1.exam.module.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void register_shouldReturnCreated() throws Exception {
        UserRequestDTO request = new UserRequestDTO();
        request.setName("alice");
        request.setPassword("password123");
        request.setRole("STUDENT");

        UserResponseDTO response = UserResponseDTO.builder()
                .id(1)
                .name("alice")
                .role("STUDENT")
                .build();

        when(userService.register(any(UserRequestDTO.class))).thenReturn(response);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("alice"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    void register_shouldReturnBadRequest_whenNameBlank() throws Exception {
        String invalidRequest = "{\"name\":\"\",\"password\":\"pass\",\"role\":\"STUDENT\"}";

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_shouldReturnOk() throws Exception {
        LoginResponseDTO response = LoginResponseDTO.builder()
                .token("jwt-token")
                .tokenType("Bearer")
                .user(UserResponseDTO.builder().id(2).name("admin").role("ADMIN").build())
                .build();

        when(userService.login(any())).thenReturn(response);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"admin\",\"password\":\"secret\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.name").value("admin"));
    }

    @Test
    void getAllUsers_shouldReturnOkWithList() throws Exception {
        when(userService.getAllUsers()).thenReturn(List.of(
                UserResponseDTO.builder().id(1).name("u1").role("STUDENT").build(),
                UserResponseDTO.builder().id(2).name("u2").role("ADMIN").build()
        ));

        mockMvc.perform(get("/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("u1"))
                .andExpect(jsonPath("$[1].role").value("ADMIN"));
    }

    @Test
    void getUserById_shouldReturnOk() throws Exception {
        when(userService.getUserById(5)).thenReturn(
                UserResponseDTO.builder().id(5).name("john").role("STUDENT").build()
        );

        mockMvc.perform(get("/users/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.name").value("john"));
    }

    @Test
    void updateUser_shouldReturnOk() throws Exception {
        UserRequestDTO request = new UserRequestDTO();
        request.setName("new-name");
        request.setPassword("new-password");
        request.setRole("ADMIN");

        when(userService.updateUser(eq(3), any(UserRequestDTO.class))).thenReturn(
                UserResponseDTO.builder().id(3).name("new-name").role("ADMIN").build()
        );

        mockMvc.perform(put("/users/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void deleteUser_shouldReturnNoContent() throws Exception {
        doNothing().when(userService).deleteUser(4);

        mockMvc.perform(delete("/users/4"))
                .andExpect(status().isNoContent());

        verify(userService).deleteUser(4);
    }
}
