package com.gr1.exam.module.question.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class QuestionRequestDTO {

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String content;

    @NotNull(message = "Môn học không được để trống")
    private Integer subjectId;

    private List<AnswerDTO> answers;

    @Data
    public static class AnswerDTO {
        @NotBlank
        private String content;
        private Boolean isCorrect;
    }
}
