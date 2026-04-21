# 📝 Exam Management System — Backend

> **Hệ thống Quản lý & Tổ chức Thi Trắc nghiệm Toàn diện**
> Spring Boot REST API phục vụ quy trình khảo thí từ A-Z: ngân hàng câu hỏi → tổ chức thi → trộn đề → chấm điểm tự động.

---

## 📑 Mục lục

1. [Tổng quan](#-tổng-quan)
2. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
3. [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
4. [Cấu trúc dự án](#-cấu-trúc-dự-án)
5. [Mô hình CSDL](#-mô-hình-cơ-sở-dữ-liệu)
6. [Phân quyền](#-phân-quyền-3-cấp)
7. [Tính năng chi tiết](#-tính-năng-chi-tiết)
8. [Cài đặt & Chạy dự án](#-cài-đặt--chạy-dự-án)
9. [Cấu hình](#%EF%B8%8F-cấu-hình)
10. [API Endpoints](#-api-endpoints)
11. [Thuật toán trộn đề](#-thuật-toán-trộn-đề)
12. [Chấm điểm tự động](#-chấm-điểm-tự-động-auto-grading)
13. [Roadmap](#-roadmap)

---

## 🌟 Tổng quan

Hệ thống cung cấp giải pháp thi trắc nghiệm trên máy tính với môi trường **khép kín** bao gồm:

- **Quản lý ngân hàng câu hỏi** — Lưu trữ, phân loại theo môn học & chương, hỗ trợ upload ảnh minh họa qua `multipart/form-data`.
- **Tổ chức kỳ thi** — Tạo kỳ thi, cấu hình số câu/chương, phân công thí sinh, kiểm soát thời gian.
- **Trộn đề thông minh (Pre-generated)** — Khi tạo kỳ thi, hệ thống tự động random đề gốc theo cấu hình chương, sau đó tráo sẵn N đề từ đề gốc. Khi thí sinh bắt đầu thi, chỉ việc gán 1 đề đã tráo sẵn.
- **Chấm điểm tự động** — Tự động đối chiếu đáp án & trả kết quả ngay lập tức.
- **3 cấp phân quyền** — ADMIN > TEACHER > STUDENT với quyền hạn rõ ràng.
- **Tài khoản bảo mật** — Student được tạo bởi Admin/Teacher với credentials random; không có route đăng ký công khai.
- **Xóa mềm (Soft Delete)** — Tất cả thao tác xóa đều là soft delete (`deleted = true`).
- **Kết xuất PDF** — Xuất đề thi + đáp án ra PDF chuẩn chỉnh, sẵn sàng in ấn.
- **Quét phiếu trả lời (Vision)** — Tích hợp module xử lý ảnh để chấm Answer Sheet offline.

---

## 🛠 Công nghệ sử dụng

| Layer | Công nghệ | Phiên bản |
|---|---|---|
| **Runtime** | Java | 21 (LTS) |
| **Framework** | Spring Boot | 3.5.12 |
| **Security** | Spring Security + JWT | — |
| **Persistence** | Spring Data JPA + Hibernate | — |
| **Database** | MySQL | 8.x+ |
| **Validation** | Spring Validation (Jakarta) | — |
| **Caching** | Spring Cache | — |
| **Build tool** | Maven | — |
| **Utility** | Lombok | — |
| **API Docs** | Swagger / SpringDoc OpenAPI | — |
| **Vision (external)** | Python Service (OCR/Object Detection) | Planned |

---

## 🏗 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Web / Mobile)                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/REST (JSON + multipart/form-data)
┌──────────────────────────────▼──────────────────────────────────┐
│                     API GATEWAY / CONTROLLER                    │
│           (Authentication + Authorization 3-Role)               │
├─────────┬──────────┬──────────┬───────────┬─────────────────────┤
│  User   │ Question │   Exam   │  Session  │      Grading        │
│ Module  │  Module  │  Module  │  Module   │      Module         │
├─────────┴──────────┴──────────┴───────────┴─────────────────────┤
│                       CORE LAYER                                │
│   (Security, Config, Exception, Utils, DataInitializer)         │
├─────────────────────────────────────────────────────────────────┤
│              SPRING DATA JPA / HIBERNATE (Soft Delete)          │
├─────────────────────────────────────────────────────────────────┤
│                       MySQL Database                            │
└─────────────────────────────────────────────────────────────────┘
              │                              │
              │ HTTP (Internal)              │ Static Files
┌─────────────▼──────────────┐   ┌───────────▼────────────┐
│  EXTERNAL: Python Vision   │   │   /uploads/ (images)   │
│   Service (OCR/Detection)  │   │   Public file serving  │
└────────────────────────────┘   └────────────────────────┘
```

---

## 📂 Cấu trúc dự án

Dự án được tổ chức theo mô hình **Package by Feature**, giúp mỗi module có tính độc lập cao, dễ mở rộng và bảo trì.

```
src/main/java/com/gr1/exam/
├── ExamApplication.java                 # Entry point
│
├── core/                                # ── Thành phần dùng chung ──
│   ├── config/                          # Cấu hình toàn cục
│   │   ├── SecurityConfig.java          #   Spring Security filter chain (3-role)
│   │   ├── SwaggerConfig.java           #   OpenAPI / Swagger UI
│   │   ├── CacheConfig.java             #   Cache manager configuration
│   │   └── WebConfig.java               #   CORS, Interceptor, serve /uploads/
│   ├── exception/                       # Xử lý lỗi tập trung
│   │   ├── GlobalExceptionHandler.java  #   @ControllerAdvice toàn cục
│   │   ├── ResourceNotFoundException.java
│   │   ├── BadRequestException.java
│   │   ├── UnauthorizedException.java
│   │   └── ErrorResponse.java           #   DTO response lỗi chuẩn
│   ├── security/                        # Bảo mật & JWT
│   │   ├── JwtTokenProvider.java        #   Generate / Validate token
│   │   ├── JwtAuthenticationFilter.java #   Filter xác thực request
│   │   └── CustomUserDetailsService.java#   Load user từ DB (by username)
│   ├── initializer/                     # Khởi tạo dữ liệu
│   │   └── AdminDataInitializer.java    #   Seed admin account từ application.properties
│   └── utils/                           # Tiện ích dùng chung
│       ├── ShuffleUtils.java            #   Thuật toán xáo trộn đề
│       ├── CredentialGenerator.java     #   Random username/password cho Student
│       ├── DateTimeUtils.java           #   Format, parse datetime
│       └── FileUploadUtils.java         #   Upload & xóa file ảnh (questions/answers)
│
├── module/                              # ── Các Domain chính ──
│   │
│   ├── user/                            # 👤 Quản lý Tài khoản
│   │   ├── entity/
│   │   │   └── User.java               #   id, username, name, studentId, password, role, deleted
│   │   ├── dto/
│   │   │   ├── CreateStudentRequestDTO.java  # MSSV + tên (credentials auto-gen)
│   │   │   ├── CreateTeacherRequestDTO.java  # username, password, name (admin nhập)
│   │   │   ├── UpdateProfileRequestDTO.java  # Cho teacher tự cập nhật
│   │   │   ├── UserResponseDTO.java
│   │   │   ├── LoginRequestDTO.java          # username + password
│   │   │   └── LoginResponseDTO.java         # JWT token
│   │   ├── repository/
│   │   │   └── UserRepository.java
│   │   ├── service/
│   │   │   └── UserService.java         #   Login, tạo student/teacher, CRUD
│   │   └── controller/
│   │       └── UserController.java      #   /api/auth, /api/users
│   │
│   ├── question/                        # ❓ Ngân hàng Câu hỏi
│   │   ├── entity/
│   │   │   ├── Subject.java             #   id, name, deleted
│   │   │   ├── Chapter.java             #   id, subjectId, name, chapterOrder, deleted
│   │   │   ├── Question.java            #   id, content, imageUrl, subjectId, chapterId, deleted
│   │   │   └── Answer.java              #   id, questionId, content, imageUrl, isCorrect, deleted
│   │   ├── dto/
│   │   │   ├── SubjectRequestDTO.java
│   │   │   ├── SubjectResponseDTO.java
│   │   │   ├── ChapterRequestDTO.java
│   │   │   ├── ChapterResponseDTO.java
│   │   │   ├── QuestionRequestDTO.java  #   JSON part trong multipart request
│   │   │   └── QuestionResponseDTO.java #   Bao gồm danh sách Answer + imageUrl
│   │   ├── repository/
│   │   │   ├── SubjectRepository.java
│   │   │   ├── ChapterRepository.java
│   │   │   ├── QuestionRepository.java
│   │   │   └── AnswerRepository.java
│   │   ├── service/
│   │   │   ├── SubjectService.java
│   │   │   ├── ChapterService.java      #   CRUD chương
│   │   │   └── QuestionService.java     #   CRUD câu hỏi + đáp án + upload ảnh
│   │   └── controller/
│   │       ├── SubjectController.java   #   /api/subjects (JSON)
│   │       ├── ChapterController.java   #   /api/subjects/{id}/chapters (JSON)
│   │       └── QuestionController.java  #   /api/questions (multipart/form-data)
│   │
│   ├── exam/                            # 📋 Quản lý Kỳ thi
│   │   ├── entity/
│   │   │   ├── Exam.java                #   id, title, subjectId, duration, totalQuestions, totalVariants, deleted
│   │   │   ├── ExamChapterConfig.java   #   id, examId, chapterId, questionCount
│   │   │   ├── ExamParticipant.java     #   id, examId, userId, deleted
│   │   │   ├── ExamVariant.java         #   id, examId, variantOrder, isOriginal
│   │   │   ├── ExamVariantQuestion.java #   id, variantId, questionId, orderIndex
│   │   │   └── ExamVariantAnswer.java   #   id, variantQuestionId, answerId, orderIndex
│   │   ├── dto/
│   │   │   ├── ExamRequestDTO.java      #   + totalVariants + List<ChapterConfig>
│   │   │   ├── ExamResponseDTO.java
│   │   │   └── ExamParticipantDTO.java
│   │   ├── repository/
│   │   │   ├── ExamRepository.java
│   │   │   ├── ExamChapterConfigRepository.java
│   │   │   ├── ExamParticipantRepository.java
│   │   │   ├── ExamVariantRepository.java
│   │   │   ├── ExamVariantQuestionRepository.java
│   │   │   └── ExamVariantAnswerRepository.java
│   │   ├── service/
│   │   │   └── ExamService.java         #   Tạo kỳ thi + sinh đề gốc + tráo sẵn N đề
│   │   └── controller/
│   │       └── ExamController.java      #   /api/exams
│   │
│   ├── session/                         # 🎯 Phiên thi
│   │   ├── entity/
│   │   │   ├── ExamSession.java         #   id, examId, userId, variantId, status, deleted
│   │   │   ├── UserAnswer.java          #   id, examSessionId, variantQuestionId
│   │   │   └── UserAnswerSelection.java #   id, userAnswerId, selectedAnswerId
│   │   ├── dto/
│   │   │   ├── ExamSessionResponseDTO.java
│   │   │   ├── ExamQuestionResponseDTO.java  #  Câu hỏi từ đề tráo đã gán
│   │   │   └── SubmitSessionRequestDTO.java  #  Nộp bài one-shot
│   │   ├── repository/
│   │   │   ├── ExamSessionRepository.java
│   │   │   ├── UserAnswerRepository.java
│   │   │   └── UserAnswerSelectionRepository.java
│   │   ├── service/
│   │   │   └── ExamSessionService.java  #   ★ Gán variant, lấy đề, nộp bài ★
│   │   └── controller/
│   │       └── ExamSessionController.java  # /api/sessions
│   │
│   └── grading/                         # ✅ Chấm điểm & Kết quả
│       ├── entity/
│       │   └── Result.java              #   id, examSessionId, score, totalCorrect, deleted
│       ├── dto/
│       │   └── ResultResponseDTO.java
│       ├── repository/
│       │   └── ResultRepository.java
│       ├── service/
│       │   └── GradingService.java      #   Chấm điểm tự động, thống kê kết quả
│       └── controller/
│           └── GradingController.java   #   /api/results
│
├── uploads/                             # ── Thư mục chứa ảnh upload ──
│                                        # Câu hỏi & đáp án có ảnh minh họa
│                                        # Truy cập public qua /uploads/**
│
└── external/                            # ── Tích hợp Service bên ngoài ──
    └── vision/
        ├── dto/
        │   ├── VisionRequestDTO.java    #   Ảnh phiếu trả lời (Base64/URL)
        │   └── VisionResponseDTO.java   #   Kết quả nhận dạng từ Python service
        └── service/
            └── VisionService.java       #   RestTemplate/WebClient gọi API Python OCR
```

> **Lưu ý**: Thư mục `uploads/` nằm ở root dự án (cùng cấp với `src/`), không nằm trong source code. WebConfig sẽ cấu hình serve static files từ đây.

---

## 🗄 Mô hình Cơ sở dữ liệu

### Entity Relationship Diagram (ERD)

```
┌──────────────┐      ┌───────────┐      ┌────────────┐
│    users     │      │ subjects  │      │  chapters  │
│──────────────│      │───────────│      │────────────│
│ id (PK)      │      │ id (PK)   │◄─────│ id (PK)    │
│ username (U) │      │ name      │      │ subject_id │──► subjects
│ name         │      │ deleted   │      │ name       │
│ student_id   │      └─────┬─────┘      │ chapter_order│
│ password     │            │            │ deleted    │
│ role         │            │            └──────┬─────┘
│ deleted      │            │                   │
└──────┬───────┘      ┌─────▼──────────────┐    │
       │              │     questions      │    │
       │              │────────────────────│    │
       │              │ id (PK)            │    │
       │              │ content            │    │
       │              │ image_url          │    │
       │              │ subject_id (FK)    │──► subjects
       │              │ chapter_id (FK)    │──► chapters
       │              │ created_at         │
       │              │ deleted            │
       │              └─────────┬──────────┘
       │                        │
       │              ┌────────▼──────────┐
       │              │     answers       │
       │              │───────────────────│
       │              │ id (PK)           │
       │              │ question_id (FK)  │──► questions
       │              │ content           │
       │              │ image_url         │
       │              │ is_correct        │
       │              │ deleted           │
       │              └───────────────────┘
       │
       │  ┌──────────────────┐     ┌───────────────┐
       │  │ exam_participants│     │    exams       │
       │  │──────────────────│     │───────────────│
       │  │ id (PK)          │     │ id (PK)       │
       ├──│ user_id (FK)     │     │ title         │
       │  │ exam_id (FK)     │──┐  │ subject_id    │──► subjects
       │  │ deleted          │  │  │ duration      │
       │  └──────────────────┘  │  │ total_questions│
       │                        │  │ total_variants │
       │                        │  │ start/end_time │
       │                        │  │ deleted        │
       │                        │  └──┬─────┬──────┘
       │                        │     │     │
       │                        └─────┘     │
       │                                    │
       │   ┌────────────────────────┐       │
       │   │  exam_chapter_configs  │       │
       │   │────────────────────────│       │
       │   │ id (PK)               │       │
       │   │ exam_id (FK)          │───────┘
       │   │ chapter_id (FK)       │──► chapters
       │   │ question_count        │
       │   └────────────────────────┘
       │
       │   ┌──────────────────┐
       │   │  exam_variants   │
       │   │──────────────────│
       │   │ id (PK)          │
       │   │ exam_id (FK)     │──► exams
       │   │ variant_order    │
       │   │ is_original      │
       │   └───────┬──────────┘
       │           │
       │   ┌───────▼──────────────────┐
       │   │ exam_variant_questions   │
       │   │──────────────────────────│
       │   │ id (PK)                  │
       │   │ variant_id (FK)          │──► exam_variants
       │   │ question_id (FK)         │──► questions
       │   │ order_index              │
       │   └───────┬──────────────────┘
       │           │
       │   ┌───────▼──────────────────┐
       │   │ exam_variant_answers     │
       │   │──────────────────────────│
       │   │ id (PK)                  │
       │   │ variant_question_id (FK) │──► exam_variant_questions
       │   │ answer_id (FK)           │──► answers
       │   │ order_index              │
       │   └──────────────────────────┘
       │
┌──────▼──────────────────┐
│    exam_sessions        │
│─────────────────────────│
│ id (PK)                 │
│ exam_id (FK)            │──► exams
│ user_id (FK)            │──► users
│ variant_id (FK)         │──► exam_variants
│ start_time              │
│ end_time                │
│ status (DOING/SUBMITTED)│
│ deleted                 │
└───────┬─────────────────┘
        │
   ┌────▼──────────┐      ┌──────────────────────┐
   │  user_answers  │      │user_answer_selections│
   │────────────────│      │──────────────────────│
   │ id (PK)        │◄─────│ id (PK)              │
   │ exam_session_id│      │ user_answer_id (FK)  │──► user_answers
   │ variant_ques.id│      │ selected_answer_id   │──► answers
   └────────────────┘      └──────────────────────┘
        │
   ┌────▼──────────┐
   │   results     │
   │───────────────│
   │ id (PK)       │
   │ exam_session_id│
   │ score          │
   │ total_correct  │
   │ submitted_at   │
   │ deleted        │
   └────────────────┘
```

### Danh sách bảng

| # | Bảng | Mô tả |
|---|---|---|
| 1 | `users` | Tài khoản hệ thống (ADMIN / TEACHER / STUDENT). Login bằng `username`. |
| 2 | `subjects` | Danh mục môn học |
| 3 | `chapters` | Chương trong môn học, có tên & thứ tự |
| 4 | `questions` | Ngân hàng câu hỏi, liên kết với môn & chương, hỗ trợ ảnh |
| 5 | `answers` | Đáp án của mỗi câu hỏi, đánh dấu `is_correct`, hỗ trợ ảnh |
| 6 | `exams` | Kỳ thi (tiêu đề, thời lượng, số câu, số đề tráo, khung giờ) |
| 7 | `exam_chapter_configs` | Cấu hình số câu lấy từ mỗi chương cho kỳ thi |
| 8 | `exam_variants` | Danh sách đề thi (gốc + tráo) đã được tạo sẵn |
| 9 | `exam_variant_questions` | Câu hỏi đã xáo trộn trong từng đề variant |
| 10 | `exam_variant_answers` | Đáp án đã xáo trộn cho từng câu trong variant |
| 11 | `exam_participants` | Danh sách thí sinh được phân công vào kỳ thi |
| 12 | `exam_sessions` | Phiên thi cụ thể, gán 1 variant cho thí sinh |
| 13 | `user_answers` | Bản ghi câu trả lời của thí sinh trong phiên thi |
| 14 | `user_answer_selections` | Đáp án cụ thể thí sinh chọn (hỗ trợ multi-select) |
| 15 | `results` | Kết quả chấm điểm (score, total_correct) |

---

## 🔐 Phân quyền 3 cấp

Hệ thống sử dụng 3 role: **ADMIN** > **TEACHER** > **STUDENT**

| Hành động | ADMIN | TEACHER | STUDENT |
|---|:---:|:---:|:---:|
| Đăng nhập | ✅ | ✅ | ✅ |
| Tạo tài khoản TEACHER | ✅ | ❌ | ❌ |
| Tạo tài khoản STUDENT | ✅ | ✅ | ❌ |
| Sửa/Xóa tài khoản bất kỳ | ✅ | ❌ | ❌ |
| Xem chi tiết tài khoản | ✅ (tất cả) | ✅ (chỉ STUDENT) | ❌ |
| Tự sửa thông tin bản thân | ✅ | ✅ | ❌ |
| CRUD Môn học & Chương | ✅ | ✅ | ❌ |
| CRUD Câu hỏi (kèm upload ảnh) | ✅ | ✅ | ❌ |
| CRUD Kỳ thi | ✅ | ✅ | ❌ |
| Thêm/Xóa thí sinh kỳ thi | ✅ | ✅ | ❌ |
| Xem danh sách kỳ thi | ❌ | ❌ | ✅ (chỉ kỳ thi được tham gia) |
| Bắt đầu thi | ❌ | ❌ | ✅ |
| Nộp bài | ❌ | ❌ | ✅ |
| Xem kết quả kỳ thi (bảng điểm) | ✅ | ✅ | ❌ |
| Xem kết quả cá nhân | ❌ | ❌ | ✅ |

### Quy tắc tạo tài khoản

- **Admin mặc định**: Được fix cứng trong code Java (đọc `username` & `password` từ `application.properties`), tự động seed khi ứng dụng khởi động. Name mặc định: "admin".
- **Teacher**: Do ADMIN tạo, nhập thủ công `username`, `password`, `name`. Teacher có thể tự đổi thông tin sau.
- **Student**: Do ADMIN hoặc TEACHER tạo, chỉ cần nhập `student_id` (MSSV) và `name`. Hệ thống tự sinh `username` & `password` random (chuỗi chữ + số) để đảm bảo bảo mật. Student **không thể** tự đổi thông tin.

---

## ⚡ Tính năng chi tiết

### 1. Quản lý Tài khoản (`module/user`)
- **Đăng nhập** với JWT authentication (login bằng `username`).
- **Không có đăng ký công khai** — tất cả tài khoản được tạo bởi Admin/Teacher.
- **Tạo Student**: Admin/Teacher nhập MSSV + tên → server random `username` + `password`, trả về credentials.
- **Tạo Teacher**: Chỉ Admin, nhập `username` + `password` + `name`.
- **Phân quyền 3 cấp**: ADMIN > TEACHER > STUDENT.
- **Tự cập nhật**: Teacher có thể đổi `username`, `password`, `name` của mình. Student không được.
- **Quản lý tài khoản**: Chỉ Admin có quyền sửa/xóa tài khoản bất kỳ.
- **Xem danh sách**: Admin xem tất cả; Teacher chỉ xem chi tiết STUDENT.
- **Soft delete**: Xóa tài khoản chỉ đánh dấu `deleted = true`.

### 2. Ngân hàng Câu hỏi (`module/question`)
- CRUD môn học (`subjects`).
- CRUD chương (`chapters`) thuộc môn học — mỗi chương có tên + thứ tự.
- CRUD câu hỏi + đáp án — phân loại theo **môn học + chương**.
- **Hỗ trợ upload ảnh qua multipart/form-data**:
  - Câu hỏi và đáp án đều **có thể** kèm ảnh minh họa (tùy chọn, không bắt buộc).
  - Ảnh được upload qua `multipart/form-data` — client gửi JSON data + file ảnh trong cùng 1 request.
  - Server xử lý upload, lưu vào thư mục `uploads/` với tên UUID, trả về `imageUrl` trong response.
  - Truy cập ảnh đã upload qua public route `/uploads/**`.
- Tìm kiếm, filter theo môn/chương, phân trang.
- **Soft delete**: Xóa câu hỏi/đáp án chỉ đánh dấu `deleted = true`.

### 3. Quản lý Kỳ thi (`module/exam`)
- Tạo kỳ thi: chọn môn học, thiết lập thời lượng, số câu hỏi, khung giờ thi.
- **Cấu hình số câu/chương**: Khi tạo kỳ thi, chỉ định số câu muốn lấy từ mỗi chương.
  - ∑ `question_count` tất cả chương phải = `total_questions`.
  - `question_count` mỗi chương phải ≤ số câu thực tế có trong chương đó (validate trước khi tạo).
- **Số đề tráo (`total_variants`)**: Khi tạo kỳ thi, chỉ định tổng số đề (1 gốc + N-1 tráo).
- **Sinh đề tự động**: Khi tạo kỳ thi, server random chọn câu hỏi theo config chương → tạo đề gốc → tráo sẵn N-1 đề.
- Phân công thí sinh vào kỳ thi.
- **Xóa thí sinh khỏi kỳ thi** (phòng trường hợp thêm nhầm).
- Danh sách kỳ thi: ADMIN/TEACHER xem tất cả; STUDENT chỉ xem kỳ thi mình được phân công.
- **Soft delete**: Tất cả thao tác xóa đều là soft delete.

### 4. Phiên thi (`module/session`) — ★ Core Logic ★
- **Bắt đầu thi**: Student ấn "Bắt đầu" → server gán random 1 variant (đề đã tráo sẵn) → tạo `exam_session` với `variant_id`.
- **Lấy đề thi**: Trả về câu hỏi + đáp án từ variant đã gán (từ `exam_variant_questions` + `exam_variant_answers`).
- **Nộp bài one-shot**: Client gửi toàn bộ đáp án đã chọn trong một request submit.
- **Concurrency-safe submit**: Chặn submit trùng khi user click 2 lần hoặc network retry.

### 5. Chấm điểm Tự động (`module/grading`)
- Chấm theo **exact-set-match** trên từng câu hỏi: tập đáp án chọn phải khớp chính xác tập đáp án đúng.
- Tính điểm theo thang điểm cấu hình.
- Lưu kết quả vào `results`.
- Thống kê: điểm trung bình, phân bố điểm, xếp hạng.

### 6. Tích hợp Vision (`external/vision`)
- Gọi HTTP tới Python microservice để xử lý ảnh phiếu trả lời.
- Nhận diện vùng khoanh → map sang `user_answers`.
- *(Roadmap)* OCR trích xuất câu hỏi từ PDF/ảnh scan.

### 7. Soft Delete — Toàn hệ thống
- **Tất cả** thao tác xóa trên mọi bảng (users, subjects, chapters, questions, answers, exams, exam_participants, exam_sessions, results) đều là **soft delete** — chỉ set `deleted = true`.
- JPA Entity sử dụng `@SQLDelete` + `@Where(clause = "deleted = false")` để tự động filter.
- Giảm tải cho phần cứng, bảo toàn dữ liệu lịch sử.

---

## 🚀 Cài đặt & Chạy dự án

### Yêu cầu

- **Java** 21+
- **Maven** 3.9+
- **MySQL** 8.x+

### Các bước

```bash
# 1. Clone repository
git clone <repo-url>
cd backend

# 2. Tạo database và import schema
mysql -u root -p < sql_init/init.sql

# 3. Tạo thư mục uploads (nếu chưa có)
mkdir -p uploads

# 4. Cấu hình database + admin account (xem mục Cấu hình bên dưới)
# Sửa file src/main/resources/application.properties

# 5. Build project
./mvnw clean install

# 6. Chạy ứng dụng
./mvnw spring-boot:run
```

Ứng dụng sẽ khởi chạy tại: `http://localhost:8080`

> **Lưu ý**: Khi khởi động lần đầu, hệ thống sẽ tự động tạo tài khoản Admin mặc định từ cấu hình trong `application.properties`. Không cần INSERT thủ công vào database.

---

## ⚙️ Cấu hình

Chỉnh sửa file `src/main/resources/application.properties`:

```properties
# ── Database ──
spring.datasource.url=jdbc:mysql://localhost:3306/online_exam_db
spring.datasource.username=root
spring.datasource.password=your_password

# ── JPA / Hibernate ──
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# ── JWT ──
jwt.secret=your-256-bit-secret-key
jwt.expiration=86400000

# ── Server ──
server.port=8080
server.servlet.context-path=/api/v1

# ── Default Admin Account (seed khi khởi động) ──
app.admin.username=admin
app.admin.password=12345678

# ── File Upload ──
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=15MB

# ── Upload Directory ──
app.upload.dir=uploads
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `POST` | `/api/auth/login` | Đăng nhập bằng `username` + `password`, nhận JWT | Public |

> ⚠️ **Không có route đăng ký.** Tất cả tài khoản được tạo bởi Admin/Teacher.

### Users — Quản lý Tài khoản
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/users` | Danh sách users (Admin: tất cả; Teacher: chỉ students) | ADMIN, TEACHER |
| `GET` | `/api/users/{id}` | Chi tiết user (Teacher chỉ xem STUDENT) | ADMIN, TEACHER |
| `POST` | `/api/users/students` | Tạo tài khoản Student (nhập MSSV + tên, trả về credentials random) | ADMIN, TEACHER |
| `POST` | `/api/users/teachers` | Tạo tài khoản Teacher (nhập username + password + tên) | ADMIN |
| `PUT` | `/api/users/{id}` | Cập nhật user bất kỳ | ADMIN |
| `PUT` | `/api/users/me` | Teacher tự cập nhật thông tin (username, password, name) | TEACHER |
| `DELETE` | `/api/users/{id}` | Xoá user (soft delete) | ADMIN |

### Subjects — Môn học
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/subjects` | Danh sách môn học | ADMIN, TEACHER |
| `GET` | `/api/subjects/{id}` | Chi tiết môn (kèm danh sách chương) | ADMIN, TEACHER |
| `POST` | `/api/subjects` | Tạo môn học | ADMIN, TEACHER |
| `PUT` | `/api/subjects/{id}` | Cập nhật | ADMIN, TEACHER |
| `DELETE` | `/api/subjects/{id}` | Xoá (soft delete) | ADMIN, TEACHER |

### Chapters — Chương trong Môn học
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/subjects/{subjectId}/chapters` | Danh sách chương của môn | ADMIN, TEACHER |
| `POST` | `/api/subjects/{subjectId}/chapters` | Thêm chương | ADMIN, TEACHER |
| `PUT` | `/api/subjects/{subjectId}/chapters/{id}` | Sửa chương | ADMIN, TEACHER |
| `DELETE` | `/api/subjects/{subjectId}/chapters/{id}` | Xoá chương (soft delete) | ADMIN, TEACHER |

### Questions — Câu hỏi (`multipart/form-data`)
| Method | Endpoint | Content-Type | Mô tả | Quyền |
|---|---|---|---|---|
| `GET` | `/api/questions` | — | Danh sách câu hỏi (filter by subject, chapter) | ADMIN, TEACHER |
| `GET` | `/api/questions/{id}` | — | Chi tiết (kèm answers + imageUrl) | ADMIN, TEACHER |
| `POST` | `/api/questions` | `multipart/form-data` | Tạo câu hỏi + đáp án (tùy chọn upload ảnh) | ADMIN, TEACHER |
| `PUT` | `/api/questions/{id}` | `multipart/form-data` | Cập nhật (tùy chọn upload ảnh mới) | ADMIN, TEACHER |
| `DELETE` | `/api/questions/{id}` | — | Xoá (soft delete) | ADMIN, TEACHER |

#### Multipart Parts cho POST/PUT Questions

| Part | Type | Required | Mô tả |
|---|---|---|---|
| `data` | Text (JSON) | ✅ | JSON chứa `{content, subjectId, chapterId, answers[{content, isCorrect}]}` |
| `questionImage` | File | ❌ | Ảnh minh họa cho câu hỏi (JPEG, PNG, GIF, WebP, SVG) |
| `answerImages` | File[] | ❌ | Ảnh minh họa cho đáp án (theo thứ tự index tương ứng answers) |

> 📌 **Ảnh là tùy chọn**: Không phải câu hỏi nào cũng cần ảnh. Client chỉ gửi file khi cần thiết.

### Uploads — File ảnh (Public)
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/uploads/**` | Truy cập ảnh đã upload | Public |

### Exams — Kỳ thi
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/exams` | DS kỳ thi (Admin/Teacher: tất cả; Student: chỉ kỳ thi được tham gia) | ALL |
| `GET` | `/api/exams/{id}` | Chi tiết kỳ thi | ALL |
| `POST` | `/api/exams` | Tạo kỳ thi (kèm config chương + totalVariants → sinh đề tự động) | ADMIN, TEACHER |
| `PUT` | `/api/exams/{id}` | Cập nhật (chỉ UPCOMING) | ADMIN, TEACHER |
| `DELETE` | `/api/exams/{id}` | Xoá (soft delete, chỉ UPCOMING) | ADMIN, TEACHER |
| `POST` | `/api/exams/{id}/participants` | Thêm thí sinh | ADMIN, TEACHER |
| `GET` | `/api/exams/{id}/participants` | D.S thí sinh | ADMIN, TEACHER |
| `DELETE` | `/api/exams/{id}/participants/{userId}` | Xóa thí sinh khỏi kỳ thi (soft delete) | ADMIN, TEACHER |

### Exam Sessions — Phiên thi
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `POST` | `/api/sessions/start/{examId}` | Bắt đầu phiên thi (gán random 1 variant đã tráo sẵn) | STUDENT |
| `GET` | `/api/sessions/{id}/questions` | Lấy đề thi (từ variant đã gán) | STUDENT |
| `POST` | `/api/sessions/{id}/submit` | Nộp bài one-shot (body chứa toàn bộ đáp án) | STUDENT |

### Results — Kết quả
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/results/session/{sessionId}` | Kết quả phiên thi | ALL |
| `GET` | `/api/results/exam/{examId}` | Bảng điểm kỳ thi | ADMIN, TEACHER |
| `GET` | `/api/results/me` | Lịch sử thi của tôi | STUDENT |

---

## 🔀 Thuật toán Trộn đề

### Nguyên lý hoạt động (Pre-generated Variants)

Khác với phiên bản cũ (tạo đề realtime khi student bắt đầu thi), phiên bản mới **tạo sẵn tất cả đề tráo khi Admin/Teacher tạo kỳ thi**.

```
Admin/Teacher tạo kỳ thi
    │
    ├─ Input: title, subjectId, duration, totalQuestions, totalVariants
    │         + List<{chapterId, questionCount}>
    │
    ├─ Validate:
    │   ├─ Σ questionCount (tất cả chương) == totalQuestions
    │   ├─ questionCount mỗi chương ≤ số câu thực tế trong chương đó
    │   └─ totalVariants ≥ 1
    │
    ▼
 ① Random chọn câu hỏi theo config chương → "Đề gốc"
    ├─ Chương 1: random 5 câu từ 20 câu có sẵn
    ├─ Chương 2: random 3 câu từ 15 câu có sẵn
    └─ Chương 3: random 2 câu từ 10 câu có sẵn
    │
    ▼
 ② Lưu đề gốc vào exam_variants (variant_order=0, is_original=true)
    + exam_variant_questions + exam_variant_answers
    │
    ▼
 ③ Tráo đề gốc → (totalVariants - 1) đề tráo:
    Với mỗi đề tráo:
      ├─ Fisher-Yates Shuffle thứ tự câu hỏi
      ├─ Fisher-Yates Shuffle thứ tự đáp án mỗi câu
      └─ Lưu vào exam_variants (variant_order=1..N-1)
    │
    ▼
 ④ Khi Student bắt đầu thi:
    ├─ Random chọn 1 trong N variant (bao gồm cả đề gốc)
    ├─ Gán variant_id vào exam_sessions
    └─ Trả đề thi cho student
```

### Ví dụ minh hoạ

```
Đề gốc (variant_order=0):            Đề tráo #1 (variant_order=1):
─────────────────────────            ───────────────────────────────
Câu 1: "2 + 2 = ?"                  Câu 1: "H₂O là gì?"    (gốc: Câu 3)
  A. 3                                 A. Muối               (gốc: C)
  B. 4 ✓                              B. Nước ✓             (gốc: A)
  C. 5                                 C. Đường              (gốc: B)
  D. 6                                 D. Axít               (gốc: D)

Câu 2: "Thủ đô VN?"                 Câu 2: "2 + 2 = ?"     (gốc: Câu 1)
  A. HCM                              A. 6                  (gốc: D)
  B. Hà Nội ✓                         B. 4 ✓               (gốc: B)
  C. Đà Nẵng                          C. 3                  (gốc: A)
  D. Huế                              D. 5                  (gốc: C)

Câu 3: "H₂O là gì?"                Câu 3: "Thủ đô VN?"    (gốc: Câu 2)
  A. Nước ✓                           A. Đà Nẵng            (gốc: C)
  B. Đường                            B. Hà Nội ✓           (gốc: B)
  C. Muối                             C. HCM                (gốc: A)
  D. Axít                             D. Huế                (gốc: D)
```

> **Kết quả**: Tất cả N đề đã được tráo sẵn khi tạo kỳ thi. Khi student bắt đầu thi, server chỉ cần random gán 1 variant → không có delay tạo đề realtime.

---

## ✅ Chấm điểm Tự động (Auto-Grading)

### Luồng chấm điểm Online

```
Thí sinh nộp bài
       │
       ▼
Lấy variant đã gán cho session
       │
       ▼
Lấy toàn bộ variant_questions + đáp án đúng (từ question gốc)
       │
       ▼
Với mỗi câu hỏi:
  ├─ Lấy tập đáp án user đã chọn từ user_answer_selections
  ├─ Map selected_answer_id → answer gốc
  ├─ So sánh với tập đáp án đúng (is_correct = true)
  └─ Khớp chính xác (exact-set-match) thì tính đúng
       │
       ▼
score = (total_correct / total_questions) * 10
       │
       ▼
Lưu vào bảng results
```

### Concurrency khi submit

```
Client click submit 2 lần / retry request
       │
       ▼
Service lock bản ghi exam_session (pessimistic write)
       │
       ▼
if (status == SUBMITTED) -> reject
       │
       ▼
Ngược lại: lưu đáp án + đổi status SUBMITTED + chấm điểm
```

### Luồng chấm điểm Offline (Answer Sheet)

```
Upload ảnh phiếu trả lời
       │
       ▼
Gửi ảnh → Python Vision Service
       │
       ▼
Nhận kết quả nhận dạng (mã đề + các ô đã khoanh)
       │
       ▼
Map ô khoanh → exam_variant_answers (theo order_index)
       │
       ▼
Chạy luồng chấm điểm online (như trên)
```

---

## 🗺 Roadmap

- [x] **v2.0** — Restructure: 3-role, chapters, pre-generated variants, image support (multipart/form-data), soft delete
- [ ] **v2.1** — Kết xuất đề thi & đáp án ra PDF
- [ ] **v3.0** — Tích hợp Vision Service (quét phiếu trả lời)
- [ ] **v4.0** — OCR/Object Detection: trích xuất câu hỏi từ PDF/ảnh scan
- [ ] **Future** — Realtime exam monitoring (WebSocket), Analytics dashboard

---

## 📜 License

Private — Internal use only.
