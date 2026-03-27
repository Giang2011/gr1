package com.gr1.exam.module.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequestDTO {
    @NotBlank
    private String name;
    @NotBlank
    private String password;
}
