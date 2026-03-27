package com.gr1.exam.module.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserRequestDTO {
    @NotBlank(message = "Tên không được để trống")
    private String name;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;

    private String role; // "STUDENT" or "ADMIN"
}
