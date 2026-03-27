package com.gr1.exam.module.session.entity;

import com.gr1.exam.module.question.entity.Question;
import jakarta.persistence.*;
import lombok.*;

/**
 * Entity: Câu hỏi đã xáo trộn trong phiên thi.
 * Mapping: bảng `exam_questions`
 */
@Entity
@Table(name = "exam_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_session_id", nullable = false)
    private ExamSession examSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
}
