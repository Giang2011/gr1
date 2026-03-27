package com.gr1.exam.module.question.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity: Môn học.
 * Mapping: bảng `subjects`
 */
@Entity
@Table(name = "subjects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;
}
