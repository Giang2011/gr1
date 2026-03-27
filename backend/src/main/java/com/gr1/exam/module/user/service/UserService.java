package com.gr1.exam.module.user.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.core.exception.UnauthorizedException;
import com.gr1.exam.core.security.JwtTokenProvider;
import com.gr1.exam.module.user.dto.*;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý nghiệp vụ User: đăng ký, đăng nhập, CRUD.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    // ==================== Authentication ====================

    /**
     * Đăng ký tài khoản mới.
     * - Kiểm tra username đã tồn tại
     * - Mã hoá password bằng BCrypt
     * - Lưu vào DB
     */
    public UserResponseDTO register(UserRequestDTO request) {
        // Kiểm tra username trùng
        if (userRepository.existsByName(request.getName())) {
            throw new BadRequestException("Tên đăng nhập đã tồn tại: " + request.getName());
        }

        // Xác định role (mặc định STUDENT)
        User.Role role = User.Role.STUDENT;
        if (request.getRole() != null && !request.getRole().isBlank()) {
            try {
                role = User.Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Role không hợp lệ: " + request.getRole());
            }
        }

        // Tạo user mới
        User user = User.builder()
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        User savedUser = userRepository.save(user);
        return toResponseDTO(savedUser);
    }

    /**
     * Đăng nhập — Xác thực qua AuthenticationManager, tạo JWT.
     */
    public LoginResponseDTO login(LoginRequestDTO request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getName(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new UnauthorizedException("Sai tên đăng nhập hoặc mật khẩu.");
        }

        User user = userRepository.findByName(request.getName())
                .orElseThrow(() -> new UnauthorizedException("User không tồn tại."));

        String token = jwtTokenProvider.generateToken(user.getName());

        return LoginResponseDTO.builder()
                .token(token)
                .tokenType("Bearer")
                .user(toResponseDTO(user))
                .build();
    }

    // ==================== CRUD (ADMIN) ====================

    /**
     * Lấy danh sách tất cả user.
     */
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy user theo ID.
     */
    public UserResponseDTO getUserById(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User không tìm thấy với id: " + id));
        return toResponseDTO(user);
    }

    /**
     * Cập nhật thông tin user.
     */
    public UserResponseDTO updateUser(Integer id, UserRequestDTO request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User không tìm thấy với id: " + id));

        // Cập nhật name (kiểm tra trùng nếu đổi)
        if (!user.getName().equals(request.getName()) && userRepository.existsByName(request.getName())) {
            throw new BadRequestException("Tên đăng nhập đã tồn tại: " + request.getName());
        }
        user.setName(request.getName());

        // Cập nhật password nếu có
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Cập nhật role nếu có
        if (request.getRole() != null && !request.getRole().isBlank()) {
            try {
                user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Role không hợp lệ: " + request.getRole());
            }
        }

        User updatedUser = userRepository.save(user);
        return toResponseDTO(updatedUser);
    }

    /**
     * Xoá user theo ID.
     */
    public void deleteUser(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User không tìm thấy với id: " + id));
        userRepository.delete(user);
    }

    // ==================== Helper ====================

    private UserResponseDTO toResponseDTO(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }
}
