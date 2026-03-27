package com.gr1.exam.module.user.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class UserResponseDTO {
    private Integer id;
    private String name;
    private String role;
}
