package com.gr1.exam.module.exam.entity;

import com.gr1.exam.module.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

/**
 * Entity: Thí sinh tham gia kỳ thi.
 * Mapping: bảng `exam_participants`
 */
@Entity
@Table(name = "exam_participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
