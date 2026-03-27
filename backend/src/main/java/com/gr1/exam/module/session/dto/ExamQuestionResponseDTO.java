package com.gr1.exam.module.session.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * DTO trả về câu hỏi đã xáo trộn cho thí sinh.
 * KHÔNG chứa thông tin đáp án đúng.
 */
@Data
@Builder
public class ExamQuestionResponseDTO {
    private Integer examQuestionId;
    private Integer orderIndex;
    private String content;
    private List<ShuffledAnswerDTO> answers;

    @Data
    @Builder
    public static class ShuffledAnswerDTO {
        private Integer examAnswerId;
        private Integer orderIndex;
        private String content;
        // KHÔNG có trường isCorrect → bảo mật đáp án
    }
}
