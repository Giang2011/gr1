package com.gr1.exam.module.user.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity: Tài khoản người dùng.
 * Mapping: bảng `users`
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('STUDENT','ADMIN') DEFAULT 'STUDENT'")
    private Role role;

    public enum Role {
        STUDENT, ADMIN
    }
}
