package com.gr1.exam.module.session.entity;

import com.gr1.exam.module.question.entity.Answer;
import jakarta.persistence.*;
import lombok.*;

/**
 * Entity: Đáp án đã xáo trộn trong phiên thi.
 * Mapping: bảng `exam_answers`
 */
@Entity
@Table(name = "exam_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_question_id", nullable = false)
    private ExamQuestion examQuestion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id", nullable = false)
    private Answer answer;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
}
