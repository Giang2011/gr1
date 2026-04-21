# 📋 Java Code Changes — Chi tiết các thay đổi cần thực hiện

> File này liệt kê **tất cả** các thay đổi cần làm trong code Java để đồng bộ với schema mới trong `init.sql` và tài liệu trong `README.md`.

---

## Mục lục

1. [application.properties](#1-applicationproperties)
2. [Entity Changes](#2-entity-changes)
3. [New Entities](#3-new-entities)
4. [Repository Changes](#4-repository-changes)
5. [DTO Changes](#5-dto-changes)
6. [Service Changes](#6-service-changes)
7. [Controller Changes](#7-controller-changes)
8. [Security & Config Changes](#8-security--config-changes)
9. [New Classes](#9-new-classes)
10. [Files to Delete](#10-files-to-delete)

---

## 1. application.properties

**File**: `src/main/resources/application.properties`

Thêm 2 biến mới cho admin account mặc định:
```properties
# ── Default Admin Account ──
app.admin.username=admin
app.admin.password=12345678

# ── Upload Directory ──
app.upload.dir=uploads
```

---

## 2. Entity Changes

### 2.1. User.java
**File**: `module/user/entity/User.java`

```diff
 @Entity
 @Table(name = "users")
+@SQLDelete(sql = "UPDATE users SET deleted = true WHERE id = ?")
+@Where(clause = "deleted = false")
 public class User {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Integer id;

+    @Column(nullable = false, unique = true)
+    private String username;   // Tên đăng nhập (dùng để login)

     @Column(nullable = false)
-    private String name;
+    private String name;       // Tên hiển thị

+    @Column(name = "student_id")
+    private String studentId;  // MSSV — bắt buộc với STUDENT, null với ADMIN/TEACHER

     @Column(nullable = false)
     private String password;

     @Enumerated(EnumType.STRING)
-    @Column(columnDefinition = "ENUM('STUDENT','ADMIN') DEFAULT 'STUDENT'")
+    @Column(columnDefinition = "ENUM('STUDENT','TEACHER','ADMIN') DEFAULT 'STUDENT'")
     private Role role;

+    @Column(nullable = false)
+    @Builder.Default
+    private Boolean deleted = false;

     public enum Role {
-        STUDENT, ADMIN
+        STUDENT, TEACHER, ADMIN
     }
 }
```

**Import thêm**:
```java
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
```

---

### 2.2. Subject.java
**File**: `module/question/entity/Subject.java`

```diff
 @Entity
 @Table(name = "subjects")
+@SQLDelete(sql = "UPDATE subjects SET deleted = true WHERE id = ?")
+@Where(clause = "deleted = false")
 public class Subject {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Integer id;

     @Column(nullable = false)
     private String name;

+    @OneToMany(mappedBy = "subject", cascade = CascadeType.ALL, orphanRemoval = true)
+    private List<Chapter> chapters;  // Danh sách chương

+    @Column(nullable = false)
+    @Builder.Default
+    private Boolean deleted = false;
 }
```

---

### 2.3. Question.java
**File**: `module/question/entity/Question.java`

```diff
 @Entity
 @Table(name = "questions")
+@SQLDelete(sql = "UPDATE questions SET deleted = true WHERE id = ?")
+@Where(clause = "deleted = false")
 public class Question {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Integer id;

     @Column(nullable = false, columnDefinition = "TEXT")
     private String content;

+    @Column(name = "image_url")
+    private String imageUrl;  // Đường dẫn ảnh minh họa

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "subject_id", nullable = false)
     private Subject subject;

+    @ManyToOne(fetch = FetchType.LAZY)
+    @JoinColumn(name = "chapter_id", nullable = false)
+    private Chapter chapter;  // Chương trong môn học

     @Column(name = "created_at", updatable = false)
     private LocalDateTime createdAt;

     @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
     private List<Answer> answers;

+    @Column(nullable = false)
+    @Builder.Default
+    private Boolean deleted = false;
 }
```

---

### 2.4. Answer.java
**File**: `module/question/entity/Answer.java`

```diff
 @Entity
 @Table(name = "answers")
+@SQLDelete(sql = "UPDATE answers SET deleted = true WHERE id = ?")
+@Where(clause = "deleted = false")
 public class Answer {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Integer id;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "question_id", nullable = false)
     private Question question;

     @Column(nullable = false, columnDefinition = "TEXT")
     private String content;

+    @Column(name = "image_url")
+    private String imageUrl;  // Đường dẫn ảnh minh họa

     @Column(name = "is_correct")
     private Boolean isCorrect;

+    @Column(nullable = false)
+    @Builder.Default
+    private Boolean deleted = false;
 }
```

---

### 2.5. Exam.java
**File**: `module/exam/entity/Exam.java`

```diff
 @Entity
 @Table(name = "exams")
+@SQLDelete(sql = "UPDATE exams SET deleted = true WHERE id = ?")
+@Where(clause = "deleted = false")
 public class Exam {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Integer id;

     @Column(nullable = false)
     private String title;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "subject_id", nullable = false)
     private Subject subject;

     @Column(nullable = false)
     private Integer duration;

     @Column(name = "total_questions", nullable = false)
     private Integer totalQuestions;

+    @Column(name = "total_variants", nullable = false)
+    @Builder.Default
+    private Integer totalVariants = 1;  // 1 gốc + (N-1) tráo

     @Column(name = "start_time")
     private LocalDateTime startTime;

     @Column(name = "end_time")
     private LocalDateTime endTime;

+    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
+    private List<ExamChapterConfig> chapterConfigs;

+    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
+    private List<ExamVariant> variants;

+    @Column(nullable = false)
+    @Builder.Default
+    private Boolean deleted = false;
 }
```

---

### 2.6. ExamParticipant.java
**File**: `module/exam/entity/ExamParticipant.java`

```diff
 @Entity
 @Table(name = "exam_participants")
+@SQLDelete(sql = "UPDATE exam_participants SET deleted = true WHERE id = ?")
+@Where(clause = "deleted = false")
 public class ExamParticipant {
     // ... (giữ nguyên id, exam, user)

+    @Column(nullable = false)
+    @Builder.Default
+    private Boolean deleted = false;
 }
```

---

### 2.7. ExamSession.java
**File**: `module/session/entity/ExamSession.java`

```diff
 @Entity
 @Table(name = "exam_sessions")
+@SQLDelete(sql = "UPDATE exam_sessions SET deleted = true WHERE id = ?")
+@Where(clause = "deleted = false")
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

+    @ManyToOne(fetch = FetchType.LAZY)
+    @JoinColumn(name = "variant_id")
+    private ExamVariant variant;  // Đề tráo được gán

     @Column(name = "start_time")
     private LocalDateTime startTime;

     @Column(name = "end_time")
     private LocalDateTime endTime;

     @Enumerated(EnumType.STRING)
     private Status status;

+    @Column(nullable = false)
+    @Builder.Default
+    private Boolean deleted = false;

     public enum Status {
         DOING, SUBMITTED
     }
 }
```

---

### 2.8. UserAnswer.java
**File**: `module/session/entity/UserAnswer.java`

```diff
 @Entity
 @Table(name = "user_answers")
 public class UserAnswer {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Integer id;

-    @ManyToOne(fetch = FetchType.LAZY)
-    @JoinColumn(name = "exam_question_id", nullable = false)
-    private ExamQuestion examQuestion;
+    @ManyToOne(fetch = FetchType.LAZY)
+    @JoinColumn(name = "exam_session_id", nullable = false)
+    private ExamSession examSession;

+    @ManyToOne(fetch = FetchType.LAZY)
+    @JoinColumn(name = "variant_question_id", nullable = false)
+    private ExamVariantQuestion variantQuestion;

     @OneToMany(mappedBy = "userAnswer", cascade = CascadeType.ALL, orphanRemoval = true)
     @Builder.Default
     private List<UserAnswerSelection> selectedAnswers = new ArrayList<>();
 }
```

---

### 2.9. Result.java
**File**: `module/grading/entity/Result.java`

```diff
 @Entity
 @Table(name = "results")
+@SQLDelete(sql = "UPDATE results SET deleted = true WHERE id = ?")
+@Where(clause = "deleted = false")
 public class Result {
     // ... (giữ nguyên id, examSession, score, totalCorrect, submittedAt)

+    @Column(nullable = false)
+    @Builder.Default
+    private Boolean deleted = false;
 }
```

---

## 3. New Entities

### 3.1. Chapter.java (MỚI)
**File**: `module/question/entity/Chapter.java`

```java
package com.gr1.exam.module.question.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

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
```

---

### 3.2. ExamChapterConfig.java (MỚI)
**File**: `module/exam/entity/ExamChapterConfig.java`

```java
package com.gr1.exam.module.exam.entity;

import com.gr1.exam.module.question.entity.Chapter;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_chapter_configs", uniqueConstraints = {
    @UniqueConstraint(name = "uk_exam_chapter", columnNames = {"exam_id", "chapter_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamChapterConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    private Chapter chapter;

    @Column(name = "question_count", nullable = false)
    private Integer questionCount;  // Số câu lấy từ chương này
}
```

---

### 3.3. ExamVariant.java (MỚI)
**File**: `module/exam/entity/ExamVariant.java`

```java
package com.gr1.exam.module.exam.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "exam_variants", uniqueConstraints = {
    @UniqueConstraint(name = "uk_exam_variant", columnNames = {"exam_id", "variant_order"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(name = "variant_order", nullable = false)
    private Integer variantOrder;  // 0 = đề gốc, 1..N-1 = đề tráo

    @Column(name = "is_original", nullable = false)
    @Builder.Default
    private Boolean isOriginal = false;

    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamVariantQuestion> questions;
}
```

---

### 3.4. ExamVariantQuestion.java (MỚI)
**File**: `module/exam/entity/ExamVariantQuestion.java`

```java
package com.gr1.exam.module.exam.entity;

import com.gr1.exam.module.question.entity.Question;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "exam_variant_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamVariantQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ExamVariant variant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @OneToMany(mappedBy = "variantQuestion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamVariantAnswer> answers;
}
```

---

### 3.5. ExamVariantAnswer.java (MỚI)
**File**: `module/exam/entity/ExamVariantAnswer.java`

```java
package com.gr1.exam.module.exam.entity;

import com.gr1.exam.module.question.entity.Answer;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_variant_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamVariantAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_question_id", nullable = false)
    private ExamVariantQuestion variantQuestion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id", nullable = false)
    private Answer answer;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
}
```

---

## 4. Repository Changes

### 4.1. UserRepository.java
**File**: `module/user/repository/UserRepository.java`

```diff
 public interface UserRepository extends JpaRepository<User, Integer> {
-    Optional<User> findByName(String name);
-    boolean existsByName(String name);
+    Optional<User> findByUsername(String username);
+    boolean existsByUsername(String username);
+    boolean existsByStudentId(String studentId);
+    List<User> findByRole(User.Role role);
+    List<User> findByRoleIn(List<User.Role> roles);
 }
```

---

### 4.2. New Repositories

| Repository | File | Methods cần có |
|---|---|---|
| `ChapterRepository` | `module/question/repository/` | `findBySubjectId()`, `countBySubjectId()` |
| `QuestionRepository` (sửa) | thêm | `countByChapterId()`, `findByChapterId()`, `countBySubjectIdAndChapterId()` |
| `ExamChapterConfigRepository` | `module/exam/repository/` | `findByExamId()`, `deleteByExamId()` |
| `ExamVariantRepository` | `module/exam/repository/` | `findByExamId()`, `countByExamId()` |
| `ExamVariantQuestionRepository` | `module/exam/repository/` | `findByVariantId()` |
| `ExamVariantAnswerRepository` | `module/exam/repository/` | `findByVariantQuestionId()` |

---

## 5. DTO Changes

### 5.1. Xóa
- `UserRequestDTO.java` → thay bằng các DTO chuyên biệt bên dưới

### 5.2. DTOs mới/sửa

#### CreateStudentRequestDTO.java (MỚI)
```java
@Data
public class CreateStudentRequestDTO {
    @NotBlank(message = "MSSV không được để trống")
    private String studentId;

    @NotBlank(message = "Tên không được để trống")
    private String name;
}
// Server sẽ tự động random username + password
```

#### CreateStudentResponseDTO.java (MỚI)
```java
@Data @Builder
public class CreateStudentResponseDTO {
    private Integer id;
    private String studentId;
    private String name;
    private String username;   // Random, trả về 1 lần duy nhất
    private String password;   // Random, trả về 1 lần duy nhất (plain text)
    private String role;
}
```

#### CreateTeacherRequestDTO.java (MỚI)
```java
@Data
public class CreateTeacherRequestDTO {
    @NotBlank(message = "Username không được để trống")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;

    @NotBlank(message = "Tên không được để trống")
    private String name;
}
```

#### UpdateProfileRequestDTO.java (MỚI)
```java
@Data
public class UpdateProfileRequestDTO {
    private String username;   // Có thể đổi
    private String password;   // Có thể đổi
    private String name;       // Có thể đổi
}
// Dùng cho Teacher tự cập nhật thông tin (PUT /users/me)
```

#### LoginRequestDTO.java (SỬA)
```diff
 @Data
 public class LoginRequestDTO {
     @NotBlank
-    private String name;
+    private String username;
     @NotBlank
     private String password;
 }
```

#### UserResponseDTO.java (SỬA)
```diff
 @Data @Builder
 public class UserResponseDTO {
     private Integer id;
+    private String username;
     private String name;
+    private String studentId;  // null cho ADMIN/TEACHER
     private String role;
 }
```

#### ChapterRequestDTO.java (MỚI)
```java
@Data
public class ChapterRequestDTO {
    @NotBlank(message = "Tên chương không được để trống")
    private String name;

    @NotNull @Positive
    private Integer chapterOrder;
}
```

#### ChapterResponseDTO.java (MỚI)
```java
@Data @Builder
public class ChapterResponseDTO {
    private Integer id;
    private Integer subjectId;
    private String name;
    private Integer chapterOrder;
    private Long questionCount;  // Số câu hỏi trong chương
}
```

#### SubjectResponseDTO.java (SỬA)
```diff
 @Data @Builder
 public class SubjectResponseDTO {
     private Integer id;
     private String name;
+    private List<ChapterResponseDTO> chapters;
 }
```

#### QuestionRequestDTO.java (SỬA)
```diff
 @Data
 public class QuestionRequestDTO {
     @NotBlank
     private String content;

+    private String imageUrl;  // Optional

     @NotNull
     private Integer subjectId;

+    @NotNull
+    private Integer chapterId;  // Bắt buộc

     @NotNull @Size(min = 2)
     private List<AnswerDTO> answers;
 }
```

> **Lưu ý**: AnswerDTO bên trong cũng cần thêm `imageUrl`.

#### ExamRequestDTO.java (SỬA)
```diff
 @Data
 public class ExamRequestDTO {
     @NotBlank
     private String title;

     @NotNull
     private Integer subjectId;

     @NotNull @Positive
     private Integer duration;

     @NotNull @Positive
     private Integer totalQuestions;

+    @NotNull @Positive
+    private Integer totalVariants;  // Tổng số đề (1 gốc + N-1 tráo)

+    @NotNull @Size(min = 1)
+    private List<ChapterConfigDTO> chapterConfigs;

     private LocalDateTime startTime;
     private LocalDateTime endTime;
 }
```

#### ChapterConfigDTO.java (MỚI)
```java
@Data
public class ChapterConfigDTO {
    @NotNull
    private Integer chapterId;

    @NotNull @Positive
    private Integer questionCount;
}
```

---

## 6. Service Changes

### 6.1. UserService.java — Thay đổi lớn
**File**: `module/user/service/UserService.java`

**Xóa method**: `register()` — không còn route đăng ký

**Sửa method**: `login()`
```diff
 public LoginResponseDTO login(LoginRequestDTO request) {
     authenticationManager.authenticate(
-        new UsernamePasswordAuthenticationToken(request.getName(), request.getPassword())
+        new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
     );

-    User user = userRepository.findByName(request.getName())
+    User user = userRepository.findByUsername(request.getUsername())
         .orElseThrow(() -> new UnauthorizedException("User không tồn tại."));

-    String token = jwtTokenProvider.generateToken(user.getName());
+    String token = jwtTokenProvider.generateToken(user.getUsername());
     // ...
 }
```

**Thêm method**: `createStudent(CreateStudentRequestDTO)`
```java
/**
 * Tạo student — Admin/Teacher nhập MSSV + tên, server random username/password.
 */
public CreateStudentResponseDTO createStudent(CreateStudentRequestDTO request) {
    // Validate MSSV chưa tồn tại
    if (userRepository.existsByStudentId(request.getStudentId())) {
        throw new BadRequestException("MSSV đã tồn tại: " + request.getStudentId());
    }

    // Random credentials
    String randomUsername = CredentialGenerator.randomUsername();  // VD: "stu_a3x9k2m1"
    String randomPassword = CredentialGenerator.randomPassword(); // VD: "P@k7mN2xQ5"

    User user = User.builder()
        .username(randomUsername)
        .name(request.getName())
        .studentId(request.getStudentId())
        .password(passwordEncoder.encode(randomPassword))
        .role(User.Role.STUDENT)
        .build();

    User saved = userRepository.save(user);

    // Trả về credentials 1 lần duy nhất (plain text password)
    return CreateStudentResponseDTO.builder()
        .id(saved.getId())
        .studentId(saved.getStudentId())
        .name(saved.getName())
        .username(randomUsername)
        .password(randomPassword)  // Plain text — chỉ trả 1 lần
        .role("STUDENT")
        .build();
}
```

**Thêm method**: `createTeacher(CreateTeacherRequestDTO)`
```java
/**
 * Tạo teacher — Chỉ Admin, nhập username + password + tên.
 */
public UserResponseDTO createTeacher(CreateTeacherRequestDTO request) {
    if (userRepository.existsByUsername(request.getUsername())) {
        throw new BadRequestException("Username đã tồn tại: " + request.getUsername());
    }

    User user = User.builder()
        .username(request.getUsername())
        .name(request.getName())
        .password(passwordEncoder.encode(request.getPassword()))
        .role(User.Role.TEACHER)
        .build();

    User saved = userRepository.save(user);
    return toResponseDTO(saved);
}
```

**Thêm method**: `updateMyProfile(UpdateProfileRequestDTO, String currentUsername)`
```java
/**
 * Teacher tự cập nhật thông tin — PUT /users/me
 */
public UserResponseDTO updateMyProfile(UpdateProfileRequestDTO request, String currentUsername) {
    User user = userRepository.findByUsername(currentUsername)
        .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại."));

    // CHỈ TEACHER mới được dùng endpoint này
    if (user.getRole() != User.Role.TEACHER) {
        throw new BadRequestException("Chỉ TEACHER có thể sử dụng chức năng này.");
    }

    if (request.getUsername() != null && !request.getUsername().isBlank()) {
        if (!user.getUsername().equals(request.getUsername())
            && userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username đã tồn tại.");
        }
        user.setUsername(request.getUsername());
    }

    if (request.getPassword() != null && !request.getPassword().isBlank()) {
        user.setPassword(passwordEncoder.encode(request.getPassword()));
    }

    if (request.getName() != null && !request.getName().isBlank()) {
        user.setName(request.getName());
    }

    User updated = userRepository.save(user);
    return toResponseDTO(updated);
}
```

**Sửa method**: `getAllUsers()` — phân quyền theo role caller
```java
/**
 * Admin: xem tất cả. Teacher: chỉ xem STUDENT.
 */
public List<UserResponseDTO> getAllUsers(String callerUsername) {
    User caller = userRepository.findByUsername(callerUsername).orElseThrow();

    List<User> users;
    if (caller.getRole() == User.Role.ADMIN) {
        users = userRepository.findAll();
    } else {
        // TEACHER chỉ xem STUDENT
        users = userRepository.findByRole(User.Role.STUDENT);
    }

    return users.stream().map(this::toResponseDTO).collect(Collectors.toList());
}
```

**Sửa method**: `getUserById()` — Teacher chỉ xem STUDENT
```java
public UserResponseDTO getUserById(Integer id, String callerUsername) {
    User caller = userRepository.findByUsername(callerUsername).orElseThrow();
    User target = userRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("User không tìm thấy"));

    // Teacher chỉ xem STUDENT
    if (caller.getRole() == User.Role.TEACHER && target.getRole() != User.Role.STUDENT) {
        throw new UnauthorizedException("TEACHER chỉ có quyền xem thông tin STUDENT.");
    }

    return toResponseDTO(target);
}
```

**Sửa method**: `updateUser()` — Chỉ ADMIN
```java
// Thêm kiểm tra: chỉ ADMIN có quyền (Controller đã restrict, nhưng double-check)
```

**Sửa method**: `deleteUser()` — Soft delete (tự động bởi @SQLDelete)
```java
// JPA .delete() sẽ tự động chạy SQL: UPDATE users SET deleted = true WHERE id = ?
// Không cần thay đổi logic, chỉ cần @SQLDelete trên entity
```

**Sửa method**: `toResponseDTO()` — thêm username, studentId
```diff
 private UserResponseDTO toResponseDTO(User user) {
     return UserResponseDTO.builder()
         .id(user.getId())
+        .username(user.getUsername())
         .name(user.getName())
+        .studentId(user.getStudentId())
         .role(user.getRole().name())
         .build();
 }
```

---

### 6.2. ExamService.java — Thay đổi lớn
**File**: `module/exam/service/ExamService.java`

**Sửa method**: `createExam()` — Logic mới

```java
@Transactional
public ExamResponseDTO createExam(ExamRequestDTO request) {
    // 1. Validate subject
    Subject subject = subjectRepository.findById(request.getSubjectId()).orElseThrow();

    // 2. Validate chapterConfigs
    int totalFromChapters = 0;
    for (ChapterConfigDTO config : request.getChapterConfigs()) {
        Chapter chapter = chapterRepository.findById(config.getChapterId())
            .orElseThrow(() -> new ResourceNotFoundException("Chương không tìm thấy: " + config.getChapterId()));

        // Đảm bảo chapter thuộc subject
        if (!chapter.getSubject().getId().equals(request.getSubjectId())) {
            throw new BadRequestException("Chương '" + chapter.getName() + "' không thuộc môn học này.");
        }

        // ★ VALIDATE: questionCount ≤ số câu thực tế trong chương
        long availableInChapter = questionRepository.countByChapterIdAndDeletedFalse(config.getChapterId());
        if (config.getQuestionCount() > availableInChapter) {
            throw new BadRequestException(
                "Chương '" + chapter.getName() + "' chỉ có " + availableInChapter
                + " câu hỏi, nhưng yêu cầu " + config.getQuestionCount() + " câu.");
        }

        totalFromChapters += config.getQuestionCount();
    }

    // ★ VALIDATE: Σ questionCount == totalQuestions
    if (totalFromChapters != request.getTotalQuestions()) {
        throw new BadRequestException(
            "Tổng số câu từ các chương (" + totalFromChapters
            + ") phải bằng số câu hỏi của kỳ thi (" + request.getTotalQuestions() + ").");
    }

    // 3. Tạo Exam
    Exam exam = Exam.builder()
        .title(request.getTitle())
        .subject(subject)
        .duration(request.getDuration())
        .totalQuestions(request.getTotalQuestions())
        .totalVariants(request.getTotalVariants())
        .startTime(request.getStartTime())
        .endTime(request.getEndTime())
        .build();
    exam = examRepository.save(exam);

    // 4. Lưu exam_chapter_configs
    for (ChapterConfigDTO config : request.getChapterConfigs()) {
        Chapter chapter = chapterRepository.findById(config.getChapterId()).orElseThrow();
        ExamChapterConfig ecc = ExamChapterConfig.builder()
            .exam(exam)
            .chapter(chapter)
            .questionCount(config.getQuestionCount())
            .build();
        examChapterConfigRepository.save(ecc);
    }

    // 5. Sinh đề gốc (variant_order = 0)
    List<Question> originalQuestions = new ArrayList<>();
    for (ChapterConfigDTO config : request.getChapterConfigs()) {
        List<Question> chapterQuestions = questionRepository.findByChapterIdAndDeletedFalse(config.getChapterId());
        Collections.shuffle(chapterQuestions);
        originalQuestions.addAll(chapterQuestions.subList(0, config.getQuestionCount()));
    }

    ExamVariant originalVariant = createVariant(exam, 0, true, originalQuestions);

    // 6. Tráo thêm (totalVariants - 1) đề
    for (int i = 1; i < request.getTotalVariants(); i++) {
        List<Question> shuffled = new ArrayList<>(originalQuestions);
        Collections.shuffle(shuffled);  // Fisher-Yates
        createVariant(exam, i, false, shuffled);
    }

    return toResponseDTO(exam);
}

/**
 * Helper: Tạo 1 variant (đề) với câu hỏi cho trước + tráo đáp án.
 */
private ExamVariant createVariant(Exam exam, int variantOrder, boolean isOriginal, List<Question> questions) {
    ExamVariant variant = ExamVariant.builder()
        .exam(exam)
        .variantOrder(variantOrder)
        .isOriginal(isOriginal)
        .build();
    variant = examVariantRepository.save(variant);

    for (int q = 0; q < questions.size(); q++) {
        Question question = questions.get(q);

        ExamVariantQuestion vq = ExamVariantQuestion.builder()
            .variant(variant)
            .question(question)
            .orderIndex(q + 1)
            .build();
        vq = examVariantQuestionRepository.save(vq);

        // Tráo đáp án
        List<Answer> answers = new ArrayList<>(question.getAnswers());
        if (!isOriginal) {
            Collections.shuffle(answers);
        }

        for (int a = 0; a < answers.size(); a++) {
            ExamVariantAnswer va = ExamVariantAnswer.builder()
                .variantQuestion(vq)
                .answer(answers.get(a))
                .orderIndex(a + 1)
                .build();
            examVariantAnswerRepository.save(va);
        }
    }

    return variant;
}
```

**Thêm method**: `removeParticipant()` — Xóa thí sinh khỏi kỳ thi
```java
@Transactional
public void removeParticipant(Integer examId, Integer userId) {
    ExamParticipant participant = participantRepository.findByExamIdAndUserId(examId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Thí sinh không có trong kỳ thi này."));

    participantRepository.delete(participant); // Soft delete nhờ @SQLDelete
}
```

**Sửa method**: `getAllExams()` — Student chỉ xem kỳ thi mình tham gia
```java
public List<ExamResponseDTO> getAllExams(String callerUsername) {
    User caller = userRepository.findByUsername(callerUsername).orElseThrow();

    List<Exam> exams;
    if (caller.getRole() == User.Role.STUDENT) {
        // Student chỉ xem kỳ thi được phân công
        List<ExamParticipant> participations = participantRepository.findByUserId(caller.getId());
        exams = participations.stream()
            .map(ExamParticipant::getExam)
            .collect(Collectors.toList());
    } else {
        // Admin/Teacher xem tất cả
        exams = examRepository.findAll();
    }

    return exams.stream().map(this::toResponseDTO).collect(Collectors.toList());
}
```

---

### 6.3. ExamSessionService.java — Thay đổi lớn
**File**: `module/session/service/ExamSessionService.java`

**Sửa method**: `startSession()` — Gán random variant thay vì tạo đề mới

```java
@Transactional
public ExamSessionResponseDTO startSession(Integer examId, String username) {
    // ... validate exam, user, participant, existing session ...

    // ★ Random chọn 1 variant đã tráo sẵn
    List<ExamVariant> variants = examVariantRepository.findByExamId(examId);
    ExamVariant assignedVariant = variants.get(new Random().nextInt(variants.size()));

    ExamSession session = ExamSession.builder()
        .exam(exam)
        .user(user)
        .variant(assignedVariant)  // Gán variant
        .build();

    session = examSessionRepository.save(session);
    return toResponseDTO(session);
}
```

**Sửa method**: `getQuestions()` — Lấy từ variant thay vì exam_questions

```java
public List<ExamQuestionResponseDTO> getQuestions(Integer sessionId) {
    ExamSession session = examSessionRepository.findById(sessionId).orElseThrow();
    ExamVariant variant = session.getVariant();

    List<ExamVariantQuestion> vQuestions = examVariantQuestionRepository
        .findByVariantIdOrderByOrderIndex(variant.getId());

    return vQuestions.stream().map(vq -> {
        List<ExamVariantAnswer> vAnswers = examVariantAnswerRepository
            .findByVariantQuestionIdOrderByOrderIndex(vq.getId());

        return ExamQuestionResponseDTO.builder()
            .variantQuestionId(vq.getId())
            .content(vq.getQuestion().getContent())
            .imageUrl(vq.getQuestion().getImageUrl())
            .orderIndex(vq.getOrderIndex())
            .answers(vAnswers.stream().map(va -> AnswerResponseDTO.builder()
                .answerId(va.getAnswer().getId())
                .content(va.getAnswer().getContent())
                .imageUrl(va.getAnswer().getImageUrl())
                .orderIndex(va.getOrderIndex())
                .build()
            ).collect(Collectors.toList()))
            .build();
    }).collect(Collectors.toList());
}
```

---

### 6.4. GradingService.java — Thay đổi nhỏ
**File**: `module/grading/service/GradingService.java`

```
Sửa: thay ExamQuestion → ExamVariantQuestion
Sửa: thay exam_question_id → variant_question_id
Logic chấm exact-set-match giữ nguyên, chỉ thay nguồn dữ liệu.
```

---

## 7. Controller Changes

### 7.1. UserController.java
**File**: `module/user/controller/UserController.java`

```diff
 // ── XÓA ──
-@PostMapping("/auth/register")
-public ResponseEntity<UserResponseDTO> register(...) { ... }

 // ── THÊM ──
+@PostMapping("/users/students")
+public ResponseEntity<CreateStudentResponseDTO> createStudent(
+    @Valid @RequestBody CreateStudentRequestDTO request) {
+    return new ResponseEntity<>(userService.createStudent(request), HttpStatus.CREATED);
+}

+@PostMapping("/users/teachers")
+public ResponseEntity<UserResponseDTO> createTeacher(
+    @Valid @RequestBody CreateTeacherRequestDTO request) {
+    return new ResponseEntity<>(userService.createTeacher(request), HttpStatus.CREATED);
+}

+@PutMapping("/users/me")
+public ResponseEntity<UserResponseDTO> updateMyProfile(
+    @Valid @RequestBody UpdateProfileRequestDTO request,
+    @AuthenticationPrincipal UserDetails userDetails) {
+    return ResponseEntity.ok(userService.updateMyProfile(request, userDetails.getUsername()));
+}

 // ── SỬA: getAllUsers & getUserById nhận thêm caller info ──
 @GetMapping("/users")
 public ResponseEntity<List<UserResponseDTO>> getAllUsers(
+    @AuthenticationPrincipal UserDetails userDetails) {
+    return ResponseEntity.ok(userService.getAllUsers(userDetails.getUsername()));
 }
```

### 7.2. ExamController.java — Thêm delete participant

```diff
+@DeleteMapping("/exams/{examId}/participants/{userId}")
+public ResponseEntity<Void> removeParticipant(
+    @PathVariable Integer examId, @PathVariable Integer userId) {
+    examService.removeParticipant(examId, userId);
+    return ResponseEntity.noContent().build();
+}
```

### 7.3. ChapterController.java (MỚI)
**File**: `module/question/controller/ChapterController.java`

```java
@RestController
@RequestMapping("/subjects/{subjectId}/chapters")
@RequiredArgsConstructor
public class ChapterController {
    // GET    /subjects/{subjectId}/chapters       — Danh sách chương
    // POST   /subjects/{subjectId}/chapters       — Thêm chương
    // PUT    /subjects/{subjectId}/chapters/{id}   — Sửa chương
    // DELETE /subjects/{subjectId}/chapters/{id}   — Xóa chương (soft)
}
```

---

## 8. Security & Config Changes

### 8.1. SecurityConfig.java
**File**: `core/config/SecurityConfig.java`

```diff
 .authorizeHttpRequests(auth -> auth
     // Authentication — Public
-    .requestMatchers("/auth/**").permitAll()
+    .requestMatchers("/auth/login").permitAll()

     // Swagger — Public
     .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

+    // Uploads — Public (serve static files)
+    .requestMatchers("/uploads/**").permitAll()

-    // Subjects — GET public, others ADMIN
-    .requestMatchers(HttpMethod.GET, "/subjects/**").permitAll()
-    .requestMatchers("/subjects/**").hasRole("ADMIN")
+    // Subjects & Chapters — ADMIN/TEACHER
+    .requestMatchers("/subjects/**").hasAnyRole("ADMIN", "TEACHER")

-    // Questions — ADMIN only
-    .requestMatchers("/questions/**").hasRole("ADMIN")
+    // Questions — ADMIN/TEACHER
+    .requestMatchers("/questions/**").hasAnyRole("ADMIN", "TEACHER")

     // Exams — GET authenticated, write ADMIN/TEACHER
     .requestMatchers(HttpMethod.GET, "/exams/**").authenticated()
-    .requestMatchers("/exams/**").hasRole("ADMIN")
+    .requestMatchers("/exams/**").hasAnyRole("ADMIN", "TEACHER")

-    // User management — ADMIN only
-    .requestMatchers("/users/**").hasRole("ADMIN")
+    // Tạo student — ADMIN/TEACHER
+    .requestMatchers(HttpMethod.POST, "/users/students").hasAnyRole("ADMIN", "TEACHER")
+    // Tạo teacher — ADMIN only
+    .requestMatchers(HttpMethod.POST, "/users/teachers").hasRole("ADMIN")
+    // Teacher tự cập nhật — TEACHER
+    .requestMatchers(HttpMethod.PUT, "/users/me").hasAnyRole("ADMIN", "TEACHER")
+    // Sửa/xóa user — ADMIN only
+    .requestMatchers(HttpMethod.PUT, "/users/{id}").hasRole("ADMIN")
+    .requestMatchers(HttpMethod.DELETE, "/users/{id}").hasRole("ADMIN")
+    // Xem danh sách — ADMIN/TEACHER
+    .requestMatchers(HttpMethod.GET, "/users/**").hasAnyRole("ADMIN", "TEACHER")

     .anyRequest().authenticated()
 )
```

---

### 8.2. CustomUserDetailsService.java
**File**: `core/security/CustomUserDetailsService.java`

```diff
 @Override
 public UserDetails loadUserByUsername(String username) {
-    User user = userRepository.findByName(username)
+    User user = userRepository.findByUsername(username)
         .orElseThrow(() -> new UsernameNotFoundException("User không tồn tại: " + username));

     return new org.springframework.security.core.userdetails.User(
-        user.getName(),
+        user.getUsername(),
         user.getPassword(),
         Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
     );
 }
```

---

### 8.3. WebConfig.java — Serve /uploads/
**File**: `core/config/WebConfig.java`

```java
// Thêm vào WebMvcConfigurer:
@Override
public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:uploads/");
}
```

---

## 9. New Classes

### 9.1. AdminDataInitializer.java (MỚI)
**File**: `core/initializer/AdminDataInitializer.java`

```java
package com.gr1.exam.core.initializer;

import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername(adminUsername)) {
            User admin = User.builder()
                .username(adminUsername)
                .name("admin")
                .password(passwordEncoder.encode(adminPassword))
                .role(User.Role.ADMIN)
                .build();

            userRepository.save(admin);
            log.info("✅ Admin account created: username={}", adminUsername);
        } else {
            log.info("ℹ️ Admin account already exists: username={}", adminUsername);
        }
    }
}
```

---

### 9.2. CredentialGenerator.java (MỚI)
**File**: `core/utils/CredentialGenerator.java`

```java
package com.gr1.exam.core.utils;

import java.security.SecureRandom;

/**
 * Sinh random username & password cho Student.
 */
public class CredentialGenerator {

    private static final String ALPHA_NUM = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final String PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Random username dạng: "stu_xxxxxxxx" (8 ký tự alpha-numeric)
     */
    public static String randomUsername() {
        StringBuilder sb = new StringBuilder("stu_");
        for (int i = 0; i < 8; i++) {
            sb.append(ALPHA_NUM.charAt(RANDOM.nextInt(ALPHA_NUM.length())));
        }
        return sb.toString();
    }

    /**
     * Random password 10 ký tự (chữ hoa, chữ thường, số)
     */
    public static String randomPassword() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
}
```

---

### 9.3. ChapterService.java (MỚI)
**File**: `module/question/service/ChapterService.java`

```
- CRUD chương cho môn học
- Validate: chapter_order không trùng trong cùng subject
- Soft delete
```

---

## 10. Files to Delete

| File | Lý do |
|---|---|
| `module/session/entity/ExamQuestion.java` | Thay bằng `ExamVariantQuestion` |
| `module/session/entity/ExamAnswer.java` | Thay bằng `ExamVariantAnswer` |
| `module/session/repository/ExamQuestionRepository.java` | Thay bằng `ExamVariantQuestionRepository` |
| `module/session/repository/ExamAnswerRepository.java` | Thay bằng `ExamVariantAnswerRepository` |
| `module/user/dto/UserRequestDTO.java` | Thay bằng `CreateStudentRequestDTO` + `CreateTeacherRequestDTO` |

---

## Tóm tắt thứ tự thực hiện

1. ✅ Sửa `application.properties` — thêm admin credentials + upload dir
2. ✅ Sửa tất cả Entity (thêm fields, soft delete annotations)
3. ✅ Tạo Entity mới (Chapter, ExamChapterConfig, ExamVariant, ExamVariantQuestion, ExamVariantAnswer)
4. ✅ Xóa Entity cũ (ExamQuestion, ExamAnswer)
5. ✅ Sửa/tạo Repository
6. ✅ Sửa/tạo DTO
7. ✅ Tạo `AdminDataInitializer.java` + `CredentialGenerator.java`
8. ✅ Sửa `CustomUserDetailsService` — login bằng username
9. ✅ Sửa `SecurityConfig` — 3 role + public uploads
10. ✅ Sửa `WebConfig` — serve /uploads/
11. ✅ Sửa `UserService` + `UserController`
12. ✅ Tạo `ChapterService` + `ChapterController`
13. ✅ Sửa `ExamService` + `ExamController`
14. ✅ Sửa `ExamSessionService` — gán variant thay vì tạo đề realtime
15. ✅ Sửa `GradingService` — đọc từ variant tables
16. ✅ Tạo thư mục `uploads/` ở root project
17. ✅ DROP database cũ, chạy lại `init.sql`
18. ✅ Build & test
