package com.gr1.exam.module.user.controller;

import com.gr1.exam.module.user.dto.*;
import com.gr1.exam.module.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho User & Authentication.
 * Endpoints: /auth/**, /users/**
 * (Prefix /api/v1 được thêm bởi context-path trong application.properties)
 */
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ==================== Authentication (Public) ====================

    /**
     * POST /api/v1/auth/register — Đăng ký tài khoản mới.
     */
    @PostMapping("/auth/register")
    public ResponseEntity<UserResponseDTO> register(@Valid @RequestBody UserRequestDTO request) {
        UserResponseDTO response = userService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * POST /api/v1/auth/login — Đăng nhập, nhận JWT token.
     */
    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = userService.login(request);
        return ResponseEntity.ok(response);
    }

    // ==================== User Management (ADMIN only) ====================

    /**
     * GET /api/v1/users — Danh sách tất cả user.
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * GET /api/v1/users/{id} — Chi tiết user theo ID.
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    /**
     * PUT /api/v1/users/{id} — Cập nhật thông tin user.
     */
    @PutMapping("/users/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable Integer id,
                                                       @Valid @RequestBody UserRequestDTO request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    /**
     * DELETE /api/v1/users/{id} — Xoá user.
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
