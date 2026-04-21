package com.gr1.exam.module.question.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

/**
 * Entity: Chương trong môn học.
 * Mapping: bảng `chapters`
 */
@Entity
@Table(name = "chapters", uniqueConstraints = {
    @UniqueConstraint(name = "uk_subject_chapter_order", columnNames = {"subject_id", "chapter_order"})
})
@SQLDelete(sql = "UPDATE chapters SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chapter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false)
    private String name;  // VD: "Chương 1 - Đại cương"

    @Column(name = "chapter_order", nullable = false)
    private Integer chapterOrder;  // Thứ tự chương (1, 2, 3...)

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;
}
