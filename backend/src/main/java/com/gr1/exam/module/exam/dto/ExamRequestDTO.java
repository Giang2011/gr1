package com.gr1.exam.module.exam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ExamRequestDTO {

    @NotBlank(message = "Tiêu đề kỳ thi không được để trống")
    private String title;

    @NotNull(message = "Môn học không được để trống")
    private Integer subjectId;

    @NotNull @Positive(message = "Thời lượng phải lớn hơn 0")
    private Integer duration;

    @NotNull @Positive(message = "Số câu hỏi phải lớn hơn 0")
    private Integer totalQuestions;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
