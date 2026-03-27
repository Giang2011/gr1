package com.gr1.exam.module.question.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity: Đáp án của câu hỏi.
 * Mapping: bảng `answers`
 */
@Entity
@Table(name = "answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_correct")
    private Boolean isCorrect;
}
