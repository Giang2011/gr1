package com.gr1.exam.module.question.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubjectResponseDTO {
    private Integer id;
    private String name;
}
