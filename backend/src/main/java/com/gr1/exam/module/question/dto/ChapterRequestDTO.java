package com.gr1.exam.module.question.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * DTO: Tạo/sửa chương trong môn học.
 */
@Data
public class ChapterRequestDTO {
    @NotBlank(message = "Tên chương không được để trống")
    private String name;

    @NotNull
    @Positive
    private Integer chapterOrder;
}
