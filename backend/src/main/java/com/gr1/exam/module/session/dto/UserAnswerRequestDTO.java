package com.gr1.exam.module.session.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserAnswerRequestDTO {

    @NotNull(message = "ID câu hỏi trong đề thi không được để trống")
    private Integer examQuestionId;

    private Integer selectedExamAnswerId; // null nếu bỏ trống
}
