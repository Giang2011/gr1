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
6. [Tính năng chi tiết](#-tính-năng-chi-tiết)
7. [Cài đặt & Chạy dự án](#-cài-đặt--chạy-dự-án)
8. [Cấu hình](#%EF%B8%8F-cấu-hình)
9. [API Endpoints](#-api-endpoints)
10. [Thuật toán trộn đề](#-thuật-toán-trộn-đề)
11. [Chấm điểm tự động](#-chấm-điểm-tự-động-auto-grading)
12. [Roadmap](#-roadmap)

---

## 🌟 Tổng quan

Hệ thống cung cấp giải pháp thi trắc nghiệm trên máy tính với môi trường **khép kín** bao gồm:

- **Quản lý ngân hàng câu hỏi** — Lưu trữ, phân loại theo môn học với số lượng không giới hạn.
- **Tổ chức kỳ thi** — Tạo kỳ thi, phân công thí sinh, kiểm soát thời gian.
- **Trộn đề thông minh** — Thuật toán hoán vị xáo trộn câu hỏi & đáp án, sinh nhiều mã đề từ một đề gốc.
- **Chấm điểm tự động** — Tự động đối chiếu đáp án & trả kết quả ngay lập tức.
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
                               │ HTTP/REST (JSON)
┌──────────────────────────────▼──────────────────────────────────┐
│                     API GATEWAY / CONTROLLER                    │
│                  (Authentication + Authorization)               │
├─────────┬──────────┬──────────┬───────────┬─────────────────────┤
│  User   │ Question │   Exam   │  Session  │      Grading        │
│ Module  │  Module  │  Module  │  Module   │      Module         │
├─────────┴──────────┴──────────┴───────────┴─────────────────────┤
│                       CORE LAYER                                │
│           (Security, Config, Exception, Utils)                  │
├─────────────────────────────────────────────────────────────────┤
│                  SPRING DATA JPA / HIBERNATE                    │
├─────────────────────────────────────────────────────────────────┤
│                       MySQL Database                            │
└─────────────────────────────────────────────────────────────────┘
              │
              │ HTTP (Internal)
┌─────────────▼──────────────┐
│  EXTERNAL: Python Vision   │
│   Service (OCR/Detection)  │
└────────────────────────────┘
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
│   │   ├── SecurityConfig.java          #   Spring Security filter chain
│   │   ├── SwaggerConfig.java           #   OpenAPI / Swagger UI
│   │   ├── CacheConfig.java             #   Cache manager configuration
│   │   └── WebConfig.java               #   CORS, Interceptor, etc.
│   ├── exception/                       # Xử lý lỗi tập trung
│   │   ├── GlobalExceptionHandler.java  #   @ControllerAdvice toàn cục
│   │   ├── ResourceNotFoundException.java
│   │   ├── BadRequestException.java
│   │   ├── UnauthorizedException.java
│   │   └── ErrorResponse.java           #   DTO response lỗi chuẩn
│   ├── security/                        # Bảo mật & JWT
│   │   ├── JwtTokenProvider.java        #   Generate / Validate token
│   │   ├── JwtAuthenticationFilter.java #   Filter xác thực request
│   │   └── CustomUserDetailsService.java#   Load user từ DB
│   └── utils/                           # Tiện ích dùng chung
│       ├── ShuffleUtils.java            #   Thuật toán xáo trộn đề
│       └── DateTimeUtils.java           #   Format, parse datetime
│
├── module/                              # ── Các Domain chính ──
│   │
│   ├── user/                            # 👤 Quản lý Tài khoản
│   │   ├── entity/
│   │   │   └── User.java               #   id, name, password, role (STUDENT/ADMIN)
│   │   ├── dto/
│   │   │   ├── UserRequestDTO.java
│   │   │   ├── UserResponseDTO.java
│   │   │   ├── LoginRequestDTO.java
│   │   │   └── LoginResponseDTO.java   #   Chứa JWT token
│   │   ├── repository/
│   │   │   └── UserRepository.java
│   │   ├── service/
│   │   │   └── UserService.java         #   Đăng ký, đăng nhập, phân quyền
│   │   └── controller/
│   │       └── UserController.java      #   /api/users, /api/auth
│   │
│   ├── question/                        # ❓ Ngân hàng Câu hỏi
│   │   ├── entity/
│   │   │   ├── Subject.java             #   id, name (Toán, Lý, Hóa...)
│   │   │   ├── Question.java            #   id, content, subject_id, created_at
│   │   │   └── Answer.java              #   id, question_id, content, is_correct
│   │   ├── dto/
│   │   │   ├── SubjectRequestDTO.java
│   │   │   ├── SubjectResponseDTO.java
│   │   │   ├── QuestionRequestDTO.java
│   │   │   └── QuestionResponseDTO.java #   Bao gồm danh sách Answer
│   │   ├── repository/
│   │   │   ├── SubjectRepository.java
│   │   │   ├── QuestionRepository.java
│   │   │   └── AnswerRepository.java
│   │   ├── service/
│   │   │   ├── SubjectService.java
│   │   │   └── QuestionService.java     #   CRUD câu hỏi + đáp án
│   │   └── controller/
│   │       ├── SubjectController.java   #   /api/subjects
│   │       └── QuestionController.java  #   /api/questions
│   │
│   ├── exam/                            # 📋 Quản lý Kỳ thi
│   │   ├── entity/
│   │   │   ├── Exam.java                #   id, title, subject_id, duration, total_questions, start/end_time
│   │   │   └── ExamParticipant.java     #   id, exam_id, user_id
│   │   ├── dto/
│   │   │   ├── ExamRequestDTO.java
│   │   │   ├── ExamResponseDTO.java
│   │   │   └── ExamParticipantDTO.java
│   │   ├── repository/
│   │   │   ├── ExamRepository.java
│   │   │   └── ExamParticipantRepository.java
│   │   ├── service/
│   │   │   └── ExamService.java         #   Tạo/sửa/xóa kỳ thi, thêm thí sinh
│   │   └── controller/
│   │       └── ExamController.java      #   /api/exams
│   │
│   ├── session/                         # 🎯 Phiên thi & Sinh đề
│   │   ├── entity/
│   │   │   ├── ExamSession.java         #   id, exam_id, user_id, start/end_time, status (DOING/SUBMITTED)
│   │   │   ├── ExamQuestion.java        #   id, exam_session_id, question_id, order_index
│   │   │   ├── ExamAnswer.java          #   id, exam_question_id, answer_id, order_index
│   │   │   ├── UserAnswer.java          #   id, exam_question_id
│   │   │   └── UserAnswerSelection.java #   id, user_answer_id, selected_answer_id (multi-select)
│   │   ├── dto/
│   │   │   ├── ExamSessionResponseDTO.java
│   │   │   ├── ExamQuestionResponseDTO.java  #  Câu hỏi đã xáo trộn
│   │   │   ├── SubmitSessionRequestDTO.java  #  Nộp bài one-shot (toàn bộ đáp án)
│   │   │   └── UserAnswerRequestDTO.java     #  Lưu realtime (deprecated)
│   │   ├── repository/
│   │   │   ├── ExamSessionRepository.java
│   │   │   ├── ExamQuestionRepository.java
│   │   │   ├── ExamAnswerRepository.java
│   │   │   ├── UserAnswerRepository.java
│   │   │   └── UserAnswerSelectionRepository.java
│   │   ├── service/
│   │   │   └── ExamSessionService.java  #   ★ Logic cốt lõi: tạo phiên thi, sinh mã đề, xáo trộn, nộp bài ★
│   │   └── controller/
│   │       └── ExamSessionController.java  # /api/sessions
│   │
│   └── grading/                         # ✅ Chấm điểm & Kết quả
│       ├── entity/
│       │   └── Result.java              #   id, exam_session_id, score, total_correct, submitted_at
│       ├── dto/
│       │   └── ResultResponseDTO.java
│       ├── repository/
│       │   └── ResultRepository.java
│       ├── service/
│       │   └── GradingService.java      #   Chấm điểm tự động, thống kê kết quả
│       └── controller/
│           └── GradingController.java   #   /api/results
│
└── external/                            # ── Tích hợp Service bên ngoài ──
    └── vision/
        ├── dto/
        │   ├── VisionRequestDTO.java    #   Ảnh phiếu trả lời (Base64/URL)
        │   └── VisionResponseDTO.java   #   Kết quả nhận dạng từ Python service
        └── service/
            └── VisionService.java       #   RestTemplate/WebClient gọi API Python OCR
```

---

## 🗄 Mô hình Cơ sở dữ liệu

### Entity Relationship Diagram (ERD)

```
┌──────────┐     ┌───────────┐     ┌────────────┐
│  users   │     │ subjects  │     │ questions  │
│──────────│     │───────────│     │────────────│
│ id (PK)  │     │ id (PK)   │◄────│ id (PK)    │
│ name     │     │ name      │     │ content    │
│ password │     │           │     │ subject_id │──► subjects
│ role     │     └───────────┘     │ created_at │
└────┬─────┘                       └─────┬──────┘
     │                                   │
     │  ┌──────────────────┐    ┌────────▼────────┐
     │  │ exam_participants│    │    answers       │
     │  │──────────────────│    │─────────────────-│
     │  │ id (PK)          │    │ id (PK)          │
     ├──│ user_id (FK)     │    │ question_id (FK) │──► questions
     │  │ exam_id (FK)     │──┐ │ content          │
     │  └──────────────────┘  │ │ is_correct       │
     │                        │ └──────────────────┘
     │  ┌──────────────┐      │
     │  │    exams      │◄────┘
     │  │──────────────│
     │  │ id (PK)      │
     │  │ title        │
     │  │ subject_id   │──────────► subjects
     │  │ duration     │
     │  │ total_ques.  │
     │  │ start/end    │
     │  └──────┬───────┘
     │         │
┌────▼─────────▼───────┐     ┌────────────────────┐
│   exam_sessions      │     │  exam_questions     │
│──────────────────────│     │────────────────────-│
│ id (PK)              │◄────│ id (PK)             │
│ exam_id (FK)         │     │ exam_session_id(FK) │
│ user_id (FK)         │     │ question_id (FK)    │──► questions
│ start_time           │     │ order_index         │
│ end_time             │     └─────────┬───────────┘
│ status               │               │
└──────────┬───────────┘     ┌────────▼────────────┐
           │                 │   exam_answers       │
  ┌────────▼────────┐       │──────────────────────│
  │    results      │       │ id (PK)              │
  │─────────────────│       │ exam_question_id(FK) │
  │ id (PK)         │       │ answer_id (FK)       │──► answers
  │ exam_session_id │       │ order_index          │
  │ score           │       └──────────────────────┘
  │ total_correct   │
  │ submitted_at    │       ┌──────────────────────┐
  └─────────────────┘       │   user_answers       │
                            │──────────────────────│
                            │ id (PK)              │
                            │ exam_question_id(FK) │──► exam_questions
                            └──────────┬───────────┘
                                       │
                            ┌──────────▼───────────┐
                            │user_answer_selections│
                            │──────────────────────│
                            │ id (PK)              │
                            │ user_answer_id (FK)  │──► user_answers
                            │ selected_answer_id   │──► answers
                            └──────────────────────┘
```

### Danh sách bảng

| # | Bảng | Mô tả |
|---|---|---|
| 1 | `users` | Tài khoản hệ thống (STUDENT / ADMIN) |
| 2 | `subjects` | Danh mục môn học |
| 3 | `questions` | Ngân hàng câu hỏi, liên kết với môn học |
| 4 | `answers` | Đáp án của mỗi câu hỏi, đánh dấu `is_correct` |
| 5 | `exams` | Kỳ thi (tiêu đề, thời lượng, số câu, khung giờ) |
| 6 | `exam_participants` | Danh sách thí sinh được phân công vào kỳ thi |
| 7 | `exam_sessions` | Phiên thi cụ thể của từng thí sinh |
| 8 | `exam_questions` | Câu hỏi đã được xáo trộn trong phiên thi |
| 9 | `exam_answers` | Đáp án đã được xáo trộn cho từng câu hỏi |
| 10 | `user_answers` | Bản ghi câu hỏi trong phiên mà thí sinh đã trả lời |
| 11 | `user_answer_selections` | Danh sách đáp án thí sinh chọn cho từng câu (hỗ trợ multi-select) |
| 12 | `results` | Kết quả chấm điểm (score, total_correct) |

---

## ⚡ Tính năng chi tiết

### 1. Quản lý Tài khoản (`module/user`)
- Đăng ký, đăng nhập với JWT authentication.
- Phân quyền: **ADMIN** (quản lý toàn bộ) vs **STUDENT** (chỉ thi & xem kết quả).
- API quản lý danh sách tài khoản (ADMIN only).

### 2. Ngân hàng Câu hỏi (`module/question`)
- CRUD môn học (`subjects`).
- CRUD câu hỏi + đáp án (hỗ trợ nhiều đáp án/câu, đánh dấu đáp án đúng).
- Phân loại câu hỏi theo môn học.
- Tìm kiếm, filter, phân trang.

### 3. Quản lý Kỳ thi (`module/exam`)
- Tạo kỳ thi: chọn môn học, thiết lập thời lượng, số câu hỏi, khung giờ thi.
- Phân công thí sinh vào kỳ thi.
- Danh sách kỳ thi (upcoming, ongoing, completed).

### 4. Phiên thi & Sinh đề (`module/session`) — ★ Core Logic ★
- **Bắt đầu thi**: Tạo `exam_session`, random chọn câu hỏi từ ngân hàng, xáo trộn thứ tự.
- **Trộn đáp án**: Mỗi câu hỏi có đáp án được xáo trộn vị trí (A↔C, B↔D, ...).
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

# 3. Cấu hình database (xem mục Cấu hình bên dưới)
# Sửa file src/main/resources/application.properties

# 4. Build project
./mvnw clean install

# 5. Chạy ứng dụng
./mvnw spring-boot:run
```

Ứng dụng sẽ khởi chạy tại: `http://localhost:8080`

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
app.jwt.secret=your-256-bit-secret-key
app.jwt.expiration-ms=86400000

# ── Server ──
server.port=8080
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `POST` | `/api/auth/register` | Đăng ký tài khoản | Public |
| `POST` | `/api/auth/login` | Đăng nhập, nhận JWT | Public |

### Users
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/users` | Danh sách users | ADMIN |
| `GET` | `/api/users/{id}` | Chi tiết user | ADMIN |
| `PUT` | `/api/users/{id}` | Cập nhật user | ADMIN |
| `DELETE` | `/api/users/{id}` | Xoá user | ADMIN |

### Subjects
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/subjects` | Danh sách môn học | ALL |
| `POST` | `/api/subjects` | Tạo môn học | ADMIN |
| `PUT` | `/api/subjects/{id}` | Cập nhật | ADMIN |
| `DELETE` | `/api/subjects/{id}` | Xoá | ADMIN |

### Questions
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/questions` | Danh sách câu hỏi (filter by subject) | ADMIN |
| `GET` | `/api/questions/{id}` | Chi tiết (kèm answers) | ADMIN |
| `POST` | `/api/questions` | Tạo câu hỏi + đáp án | ADMIN |
| `PUT` | `/api/questions/{id}` | Cập nhật | ADMIN |
| `DELETE` | `/api/questions/{id}` | Xoá | ADMIN |

### Exams
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/exams` | Danh sách kỳ thi | ALL |
| `GET` | `/api/exams/{id}` | Chi tiết kỳ thi | ALL |
| `POST` | `/api/exams` | Tạo kỳ thi | ADMIN |
| `PUT` | `/api/exams/{id}` | Cập nhật | ADMIN |
| `DELETE` | `/api/exams/{id}` | Xoá | ADMIN |
| `POST` | `/api/exams/{id}/participants` | Thêm thí sinh | ADMIN |
| `GET` | `/api/exams/{id}/participants` | D.S thí sinh | ADMIN |

### Exam Sessions
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `POST` | `/api/sessions/start/{examId}` | Bắt đầu phiên thi (sinh đề) | STUDENT |
| `GET` | `/api/sessions/{id}/questions` | Lấy đề thi đã xáo trộn | STUDENT |
| `POST` | `/api/sessions/{id}/answers` | Lưu 1 đáp án realtime (deprecated, chỉ để tương thích) | STUDENT |
| `POST` | `/api/sessions/{id}/submit` | Nộp bài one-shot (body chứa toàn bộ đáp án) | STUDENT |

### Results
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/results/session/{sessionId}` | Kết quả phiên thi | ALL |
| `GET` | `/api/results/exam/{examId}` | Bảng điểm kỳ thi | ADMIN |
| `GET` | `/api/results/me` | Lịch sử thi của tôi | STUDENT |

---

## 🔀 Thuật toán Trộn đề

### Nguyên lý hoạt động

Khi thí sinh bắt đầu phiên thi, hệ thống thực hiện:

```
1. Lấy N câu hỏi ngẫu nhiên từ ngân hàng (theo subject_id của exam)
2. Xáo trộn thứ tự câu hỏi (Fisher-Yates Shuffle)
3. Với mỗi câu hỏi, xáo trộn thứ tự đáp án
4. Lưu mapping thứ tự mới vào exam_questions + exam_answers
```

### Ví dụ minh hoạ

```
Đề gốc:                          Đề đã trộn (Mã đề #42):
─────────                         ──────────────────────
Câu 1: "2 + 2 = ?"               Câu 1: "H₂O là gì?"    (gốc: Câu 3)
  A. 3                              A. Muối               (gốc: C)
  B. 4 ✓                            B. Nước ✓             (gốc: A)
  C. 5                               C. Đường              (gốc: B)
  D. 6                               D. Axít               (gốc: D)

Câu 2: "Thủ đô VN?"              Câu 2: "Thủ đô VN?"    (gốc: Câu 2)
  A. HCM                            A. Đà Nẵng            (gốc: C)
  B. Hà Nội ✓                       B. HCM                (gốc: A)
  C. Đà Nẵng                        C. Hà Nội ✓           (gốc: B)
  D. Huế                            D. Huế                (gốc: D)

Câu 3: "H₂O là gì?"             Câu 3: "2 + 2 = ?"     (gốc: Câu 1)
  A. Nước ✓                         A. 5                  (gốc: C)
  B. Đường                          B. 6                  (gốc: D)
  C. Muối                           C. 4 ✓               (gốc: B)
  D. Axít                           D. 3                  (gốc: A)
```

> **Kết quả**: Mỗi thí sinh nhận một mã đề **duy nhất** với thứ tự câu hỏi và đáp án khác nhau, nhưng cùng nội dung và độ khó.

---

## ✅ Chấm điểm Tự động (Auto-Grading)

### Luồng chấm điểm Online

```
Thí sinh nộp bài
       │
       ▼
Lấy toàn bộ câu hỏi của session + tập đáp án đúng theo question
       │
       ▼
Với mỗi câu hỏi:
  ├─ Lấy tập đáp án user đã chọn từ user_answer_selections
  ├─ So sánh với tập đáp án đúng
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
Map ô khoanh → exam_answers (theo order_index)
       │
       ▼
Chạy luồng chấm điểm online (như trên)
```

---

## 🗺 Roadmap

- [ ] **v1.0** — CRUD Users, Questions, Exams + JWT Auth
- [ ] **v1.1** — Thuật toán trộn đề + Phiên thi online
- [ ] **v1.2** — Auto-grading + Thống kê kết quả
- [ ] **v1.3** — Kết xuất đề thi & đáp án ra PDF
- [ ] **v2.0** — Tích hợp Vision Service (quét phiếu trả lời)
- [ ] **v3.0** — OCR/Object Detection: trích xuất câu hỏi từ PDF/ảnh scan
- [ ] **Future** — Realtime exam monitoring (WebSocket), Analytics dashboard

---

## 📜 License

Private — Internal use only.
