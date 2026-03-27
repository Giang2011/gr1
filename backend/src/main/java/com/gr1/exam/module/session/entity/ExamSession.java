package com.gr1.exam.module.session.entity;

import com.gr1.exam.module.exam.entity.Exam;
import com.gr1.exam.module.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity: Phiên thi của thí sinh.
 * Mapping: bảng `exam_sessions`
 */
@Entity
@Table(name = "exam_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('DOING','SUBMITTED') DEFAULT 'DOING'")
    private Status status;

    public enum Status {
        DOING, SUBMITTED
    }

    @PrePersist
    protected void onCreate() {
        this.startTime = LocalDateTime.now();
        this.status = Status.DOING;
    }
}
