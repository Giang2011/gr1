# 📡 API Specification — Exam Management System

> Đặc tả API chi tiết cho phía Frontend. Tất cả endpoint đều có prefix `server.servlet.context-path` nếu cấu hình (mặc định không có).
>
> **Base URL**: `http://localhost:8080`
> **Authentication**: JWT Bearer Token (trừ endpoint Public)
> **Content-Type**: `application/json` (trừ Questions POST/PUT dùng `multipart/form-data`)

---

## 📑 Mục lục

1. [Quy ước chung](#-quy-ước-chung)
2. [Authentication](#1-authentication)
3. [Users — Quản lý Tài khoản](#2-users--quản-lý-tài-khoản)
4. [Subjects — Môn học](#3-subjects--môn-học)
5. [Chapters — Chương](#4-chapters--chương)
6. [Questions — Câu hỏi](#5-questions--câu-hỏi)
7. [Uploads — File ảnh](#6-uploads--file-ảnh)
8. [Exams — Kỳ thi](#7-exams--kỳ-thi)
9. [Exam Participants — Thí sinh](#8-exam-participants--thí-sinh)
10. [Exam Sessions — Phiên thi](#9-exam-sessions--phiên-thi)
11. [Results — Kết quả](#10-results--kết-quả)
12. [Error Handling](#-error-handling)
13. [TypeScript Interfaces](#-typescript-interfaces)

---

## 📌 Quy ước chung

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Response format — Thành công

```json
// Single object
{ "id": 1, "name": "..." }

// List
[{ "id": 1 }, { "id": 2 }]

// Paginated (nếu có)
{
  "content": [...],
  "totalElements": 100,
  "totalPages": 10,
  "number": 0,
  "size": 10
}
```

### Response format — Lỗi

```json
{
  "status": 400,
  "message": "Tổng số câu từ các chương (8) phải bằng số câu hỏi của kỳ thi (10).",
  "timestamp": "2026-04-21T14:30:00"
}
```

### HTTP Status Codes

| Code | Ý nghĩa |
|---|---|
| `200` | Thành công |
| `201` | Tạo mới thành công |
| `204` | Xóa thành công (no content) |
| `400` | Bad Request — Dữ liệu không hợp lệ |
| `401` | Unauthorized — Chưa đăng nhập / Token hết hạn |
| `403` | Forbidden — Không có quyền |
| `404` | Not Found — Không tìm thấy tài nguyên |
| `413` | Payload Too Large — File upload vượt quá giới hạn |
| `500` | Internal Server Error |

---

## 1. Authentication

### `POST /api/auth/login` — Đăng nhập

| | |
|---|---|
| **Auth** | ❌ Public |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "username": "admin",
  "password": "12345678"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `username` | `string` | ✅ | Tên đăng nhập |
| `password` | `string` | ✅ | Mật khẩu |

**Response** `200 OK`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJBRE1JTiIsImlhdCI6...",
  "role": "ADMIN"
}
```

| Field | Type | Mô tả |
|---|---|---|
| `token` | `string` | JWT token, hết hạn sau 24h (86400000ms) |
| `role` | `string` | `"ADMIN"` \| `"TEACHER"` \| `"STUDENT"` |

**Lưu trữ phía Frontend**:
```typescript
localStorage.setItem('token', response.data.token);
localStorage.setItem('role', response.data.role);
```

**Errors**:
| Status | Khi nào |
|---|---|
| `401` | Sai username hoặc password |

> [!WARNING]
> **Không có endpoint đăng ký (`/api/auth/register`)**. Tài khoản được tạo bởi Admin/Teacher qua API `/api/users/*`.

---

## 2. Users — Quản lý Tài khoản

### `GET /api/users` — Danh sách Users

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "username": "admin",
    "name": "admin",
    "studentId": null,
    "role": "ADMIN"
  },
  {
    "id": 2,
    "username": "teacher1",
    "name": "Trần Thị B",
    "studentId": null,
    "role": "TEACHER"
  },
  {
    "id": 3,
    "username": "stu_a3x9k2m1",
    "name": "Nguyễn Văn A",
    "studentId": "2021001",
    "role": "STUDENT"
  }
]
```

> **Phân quyền**: ADMIN xem tất cả users. TEACHER chỉ xem STUDENT.

---

### `GET /api/users/{id}` — Chi tiết User

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
{
  "id": 3,
  "username": "stu_a3x9k2m1",
  "name": "Nguyễn Văn A",
  "studentId": "2021001",
  "role": "STUDENT"
}
```

> **Phân quyền**: TEACHER chỉ xem được STUDENT. Xem ADMIN/TEACHER khác → `401`.

---

### `POST /api/users/students` — Tạo Student

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "studentId": "2021001",
  "name": "Nguyễn Văn A"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `studentId` | `string` | ✅ | Mã số sinh viên (MSSV), unique |
| `name` | `string` | ✅ | Tên hiển thị |

**Response** `201 Created`:
```json
{
  "id": 5,
  "studentId": "2021001",
  "name": "Nguyễn Văn A",
  "username": "stu_a3x9k2m1",
  "password": "P@k7mN2xQ5",
  "role": "STUDENT"
}
```

> [!CAUTION]
> **`username` và `password` chỉ trả về 1 lần duy nhất trong response này!** Frontend PHẢI hiển thị popup cho Admin/Teacher ghi lại credentials trước khi đóng.

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | MSSV đã tồn tại |

---

### `POST /api/users/teachers` — Tạo Teacher

| | |
|---|---|
| **Auth** | ✅ `ADMIN` only |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "username": "teacher1",
  "password": "securePass123",
  "name": "Trần Thị B"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `username` | `string` | ✅ | Tên đăng nhập, unique |
| `password` | `string` | ✅ | Mật khẩu |
| `name` | `string` | ✅ | Tên hiển thị |

**Response** `201 Created`:
```json
{
  "id": 4,
  "username": "teacher1",
  "name": "Trần Thị B",
  "studentId": null,
  "role": "TEACHER"
}
```

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Username đã tồn tại |
| `403` | Caller không phải ADMIN |

---

### `PUT /api/users/{id}` — Cập nhật User (Admin)

| | |
|---|---|
| **Auth** | ✅ `ADMIN` only |
| **Content-Type** | `application/json` |

**Request Body**: Tùy theo field cần sửa.

---

### `PUT /api/users/me` — Teacher tự cập nhật

| | |
|---|---|
| **Auth** | ✅ `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body** (tất cả optional):
```json
{
  "username": "new_teacher_name",
  "password": "newPass456",
  "name": "Tên mới"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `username` | `string` | ❌ | Username mới (check unique) |
| `password` | `string` | ❌ | Password mới |
| `name` | `string` | ❌ | Tên hiển thị mới |

**Response** `200 OK`:
```json
{
  "id": 4,
  "username": "new_teacher_name",
  "name": "Tên mới",
  "studentId": null,
  "role": "TEACHER"
}
```

---

### `DELETE /api/users/{id}` — Xóa User (Soft Delete)

| | |
|---|---|
| **Auth** | ✅ `ADMIN` only |

**Response** `204 No Content`

> Soft delete — dữ liệu vẫn còn trong DB nhưng không xuất hiện trong các query.

---

## 3. Subjects — Môn học

### `GET /api/subjects` — Danh sách Môn học

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "name": "Toán cao cấp",
    "chapters": [
      { "id": 1, "subjectId": 1, "name": "Chương 1 - Đại cương", "chapterOrder": 1, "questionCount": 20 },
      { "id": 2, "subjectId": 1, "name": "Chương 2 - Giải tích", "chapterOrder": 2, "questionCount": 15 }
    ]
  }
]
```

---

### `GET /api/subjects/{id}` — Chi tiết Môn học

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
{
  "id": 1,
  "name": "Toán cao cấp",
  "chapters": [
    { "id": 1, "subjectId": 1, "name": "Chương 1 - Đại cương", "chapterOrder": 1, "questionCount": 20 },
    { "id": 2, "subjectId": 1, "name": "Chương 2 - Giải tích", "chapterOrder": 2, "questionCount": 15 }
  ]
}
```

---

### `POST /api/subjects` — Tạo Môn học

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "name": "Toán cao cấp"
}
```

**Response** `201 Created`: SubjectResponseDTO

---

### `PUT /api/subjects/{id}` — Cập nhật Môn học

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "name": "Toán cao cấp (sửa)"
}
```

**Response** `200 OK`: SubjectResponseDTO

---

### `DELETE /api/subjects/{id}` — Xóa Môn học

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `204 No Content`

---

## 4. Chapters — Chương

> Chapters là nested resource của Subjects: `/api/subjects/{subjectId}/chapters`

### `GET /api/subjects/{subjectId}/chapters` — DS Chương

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
[
  { "id": 1, "subjectId": 1, "name": "Chương 1 - Đại cương", "chapterOrder": 1, "questionCount": 20 },
  { "id": 2, "subjectId": 1, "name": "Chương 2 - Giải tích", "chapterOrder": 2, "questionCount": 15 }
]
```

| Field | Type | Mô tả |
|---|---|---|
| `id` | `number` | ID chương |
| `subjectId` | `number` | ID môn học cha |
| `name` | `string` | Tên chương |
| `chapterOrder` | `number` | Thứ tự chương (1, 2, 3...) |
| `questionCount` | `number` | Số câu hỏi hiện có trong chương |

---

### `POST /api/subjects/{subjectId}/chapters` — Tạo Chương

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "name": "Chương 3 - Xác suất",
  "chapterOrder": 3
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `name` | `string` | ✅ | Tên chương |
| `chapterOrder` | `number` | ✅ | Thứ tự (positive integer, unique trong môn) |

**Response** `201 Created`: ChapterResponseDTO

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | `chapterOrder` trùng trong cùng môn |
| `404` | Subject không tồn tại |

---

### `PUT /api/subjects/{subjectId}/chapters/{id}` — Sửa Chương

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "name": "Chương 3 - Xác suất (sửa)",
  "chapterOrder": 3
}
```

**Response** `200 OK`: ChapterResponseDTO

---

### `DELETE /api/subjects/{subjectId}/chapters/{id}` — Xóa Chương

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `204 No Content`

---

## 5. Questions — Câu hỏi

> [!IMPORTANT]
> POST và PUT dùng `multipart/form-data`, **KHÔNG** dùng `application/json`.

### `GET /api/questions` — Danh sách Câu hỏi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Query Parameters**:

| Param | Type | Mô tả |
|---|---|---|
| `subjectId` | `number` | Filter theo môn học |
| `chapterId` | `number` | Filter theo chương |
| `page` | `number` | Trang (0-indexed) |
| `size` | `number` | Số item/trang |

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "content": "2 + 2 = ?",
    "imageUrl": "abc123-uuid.jpg",
    "subjectId": 1,
    "chapterId": 1,
    "answers": [
      { "id": 1, "content": "3", "imageUrl": null, "isCorrect": false },
      { "id": 2, "content": "4", "imageUrl": null, "isCorrect": true },
      { "id": 3, "content": "5", "imageUrl": null, "isCorrect": false },
      { "id": 4, "content": "6", "imageUrl": null, "isCorrect": false }
    ]
  }
]
```

| Field | Type | Mô tả |
|---|---|---|
| `id` | `number` | ID câu hỏi |
| `content` | `string` | Nội dung câu hỏi |
| `imageUrl` | `string \| null` | Tên file ảnh (truy cập qua `/uploads/{imageUrl}`) |
| `subjectId` | `number` | ID môn học |
| `chapterId` | `number` | ID chương |
| `answers` | `Answer[]` | Danh sách đáp án |

---

### `GET /api/questions/{id}` — Chi tiết Câu hỏi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`: QuestionResponseDTO (như trên)

---

### `POST /api/questions` — Tạo Câu hỏi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `multipart/form-data` |

**Multipart Parts**:

| Part Name | Type | Required | Mô tả |
|---|---|---|---|
| `data` | Text (JSON string) | ✅ | Dữ liệu câu hỏi (xem format bên dưới) |
| `questionImage` | File | ❌ | Ảnh minh họa câu hỏi |
| `answerImages` | File[] | ❌ | Ảnh minh họa đáp án (theo thứ tự index) |

**JSON trong part `data`**:
```json
{
  "content": "Hình nào dưới đây là hình vuông?",
  "subjectId": 1,
  "chapterId": 2,
  "answers": [
    { "content": "Hình A", "isCorrect": false },
    { "content": "Hình B", "isCorrect": true },
    { "content": "Hình C", "isCorrect": false },
    { "content": "Hình D", "isCorrect": false }
  ]
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `content` | `string` | ✅ | Nội dung câu hỏi |
| `subjectId` | `number` | ✅ | ID môn học |
| `chapterId` | `number` | ✅ | ID chương |
| `answers` | `AnswerDTO[]` | ✅ | Tối thiểu 2 đáp án |
| `answers[].content` | `string` | ✅ | Nội dung đáp án |
| `answers[].isCorrect` | `boolean` | ✅ | Đáp án đúng? |

**Code ví dụ (TypeScript)**:
```typescript
const createQuestion = async (
  data: QuestionRequest,
  questionImage?: File,
  answerImages?: File[]
) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(data));

  if (questionImage) {
    formData.append('questionImage', questionImage);
  }

  if (answerImages) {
    answerImages.forEach((file) => {
      formData.append('answerImages', file);
    });
  }

  return axiosClient.post('/questions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
```

**Response** `201 Created`: QuestionResponseDTO

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Thiếu required fields, ít hơn 2 answers |
| `404` | Subject hoặc Chapter không tồn tại |
| `413` | File vượt quá 10MB (file) / 15MB (request) |

**File upload hỗ trợ**: JPEG, PNG, GIF, WebP, SVG

---

### `PUT /api/questions/{id}` — Cập nhật Câu hỏi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `multipart/form-data` |

Giống POST. Ảnh mới sẽ thay thế ảnh cũ (ảnh cũ bị xóa khỏi thư mục `uploads/`).

---

### `DELETE /api/questions/{id}` — Xóa Câu hỏi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `204 No Content`

---

## 6. Uploads — File ảnh

### `GET /uploads/{filename}` — Truy cập ảnh

| | |
|---|---|
| **Auth** | ❌ Public |

**Ví dụ**:
```
GET /uploads/a1b2c3d4-uuid.jpg
```

**Frontend sử dụng**:
```tsx
// Nếu dùng Vite proxy (dev)
<img src={`/uploads/${question.imageUrl}`} alt="Ảnh câu hỏi" />

// Nếu không dùng proxy
<img src={`http://localhost:8080/uploads/${question.imageUrl}`} alt="Ảnh câu hỏi" />
```

> [!NOTE]
> `imageUrl` có thể là `null` — luôn kiểm tra trước khi render `<img>`.

---

## 7. Exams — Kỳ thi

### `GET /api/exams` — Danh sách Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ALL` (auto-filter theo role) |

- **ADMIN/TEACHER**: Trả tất cả kỳ thi
- **STUDENT**: Chỉ trả kỳ thi mà student được phân công

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "title": "Kiểm tra giữa kỳ - Toán",
    "subjectId": 1,
    "subjectName": "Toán cao cấp",
    "duration": 60,
    "totalQuestions": 10,
    "totalVariants": 4,
    "startTime": "2026-05-01T08:00:00",
    "endTime": "2026-05-01T10:00:00"
  }
]
```

---

### `GET /api/exams/{id}` — Chi tiết Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ALL` |

**Response** `200 OK`: ExamResponseDTO (như trên, có thể kèm thêm chapterConfigs)

---

### `POST /api/exams` — Tạo Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "title": "Kiểm tra giữa kỳ - Toán",
  "subjectId": 1,
  "duration": 60,
  "totalQuestions": 10,
  "totalVariants": 4,
  "chapterConfigs": [
    { "chapterId": 1, "questionCount": 5 },
    { "chapterId": 2, "questionCount": 3 },
    { "chapterId": 3, "questionCount": 2 }
  ],
  "startTime": "2026-05-01T08:00:00",
  "endTime": "2026-05-01T10:00:00"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `title` | `string` | ✅ | Tên kỳ thi |
| `subjectId` | `number` | ✅ | ID môn học |
| `duration` | `number` | ✅ | Thời lượng (phút) |
| `totalQuestions` | `number` | ✅ | Tổng số câu hỏi |
| `totalVariants` | `number` | ✅ | Tổng số đề (1 gốc + N-1 tráo), ≥ 1 |
| `chapterConfigs` | `ChapterConfig[]` | ✅ | Cấu hình số câu/chương |
| `chapterConfigs[].chapterId` | `number` | ✅ | ID chương |
| `chapterConfigs[].questionCount` | `number` | ✅ | Số câu lấy từ chương này |
| `startTime` | `string (ISO)` | ❌ | Thời gian bắt đầu |
| `endTime` | `string (ISO)` | ❌ | Thời gian kết thúc |

**Validation Rules**:
1. `Σ chapterConfigs[].questionCount == totalQuestions` — Tổng câu phải khớp
2. Mỗi `questionCount ≤ availableQuestions` trong chương đó
3. `totalVariants ≥ 1`
4. Tất cả `chapterId` phải thuộc `subjectId`

**Response** `201 Created`: ExamResponseDTO

> [!TIP]
> **Frontend nên validate trước khi submit**: Tính tổng `questionCount` realtime và so sánh với `totalQuestions`. Gọi `GET /api/subjects/{id}` để biết số câu có sẵn trong mỗi chương.

**Errors**:
| Status | Message ví dụ |
|---|---|
| `400` | "Tổng số câu từ các chương (8) phải bằng số câu hỏi của kỳ thi (10)." |
| `400` | "Chương 'Đại cương' chỉ có 10 câu hỏi, nhưng yêu cầu 15 câu." |
| `400` | "Chương 'Đại cương' không thuộc môn học này." |
| `404` | "Chương không tìm thấy: 99" |

---

### `PUT /api/exams/{id}` — Cập nhật Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Điều kiện** | Chỉ kỳ thi `UPCOMING` (chưa bắt đầu) |

---

### `DELETE /api/exams/{id}` — Xóa Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Điều kiện** | Chỉ kỳ thi `UPCOMING` |

**Response** `204 No Content`

---

## 8. Exam Participants — Thí sinh

### `POST /api/exams/{examId}/participants` — Thêm Thí sinh

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "userId": 5
}
```

**Response** `201 Created`

---

### `GET /api/exams/{examId}/participants` — DS Thí sinh

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "userId": 5,
    "username": "stu_a3x9k2m1",
    "name": "Nguyễn Văn A",
    "studentId": "2021001"
  }
]
```

---

### `DELETE /api/exams/{examId}/participants/{userId}` — Xóa Thí sinh

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `204 No Content`

---

## 9. Exam Sessions — Phiên thi

### `POST /api/sessions/start/{examId}` — Bắt đầu Phiên thi

| | |
|---|---|
| **Auth** | ✅ `STUDENT` |

Server sẽ:
1. Validate student là participant của exam
2. Kiểm tra chưa có phiên thi trước đó
3. Random gán 1 variant (đề đã tráo sẵn)
4. Tạo exam_session

**Response** `201 Created`:
```json
{
  "id": 1,
  "examId": 1,
  "examTitle": "Kiểm tra giữa kỳ - Toán",
  "variantId": 3,
  "startTime": "2026-05-01T08:05:00",
  "status": "DOING"
}
```

| Field | Type | Mô tả |
|---|---|---|
| `id` | `number` | Session ID — dùng cho các API tiếp theo |
| `examId` | `number` | ID kỳ thi |
| `variantId` | `number` | ID đề thi được gán |
| `startTime` | `string` | Thời gian bắt đầu |
| `status` | `string` | `"DOING"` |

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Student không nằm trong danh sách thí sinh |
| `400` | Đã có phiên thi trước đó |

---

### `GET /api/sessions/{sessionId}/questions` — Lấy Đề thi

| | |
|---|---|
| **Auth** | ✅ `STUDENT` |

**Response** `200 OK`:
```json
[
  {
    "variantQuestionId": 10,
    "content": "H₂O là gì?",
    "imageUrl": null,
    "orderIndex": 1,
    "answers": [
      { "answerId": 41, "content": "Muối", "imageUrl": null, "orderIndex": 1 },
      { "answerId": 42, "content": "Nước", "imageUrl": null, "orderIndex": 2 },
      { "answerId": 43, "content": "Đường", "imageUrl": null, "orderIndex": 3 },
      { "answerId": 44, "content": "Axít", "imageUrl": null, "orderIndex": 4 }
    ]
  },
  {
    "variantQuestionId": 11,
    "content": "2 + 2 = ?",
    "imageUrl": "math-image.jpg",
    "orderIndex": 2,
    "answers": [
      { "answerId": 45, "content": "6", "imageUrl": null, "orderIndex": 1 },
      { "answerId": 46, "content": "4", "imageUrl": null, "orderIndex": 2 },
      { "answerId": 47, "content": "3", "imageUrl": null, "orderIndex": 3 },
      { "answerId": 48, "content": "5", "imageUrl": null, "orderIndex": 4 }
    ]
  }
]
```

| Field | Type | Mô tả |
|---|---|---|
| `variantQuestionId` | `number` | ID câu hỏi trong variant (dùng để submit) |
| `content` | `string` | Nội dung câu hỏi |
| `imageUrl` | `string \| null` | Ảnh minh họa (truy cập qua `/uploads/`) |
| `orderIndex` | `number` | Thứ tự câu hỏi |
| `answers[].answerId` | `number` | ID đáp án (dùng để submit) |
| `answers[].content` | `string` | Nội dung đáp án |
| `answers[].imageUrl` | `string \| null` | Ảnh đáp án |
| `answers[].orderIndex` | `number` | Thứ tự đáp án |

> [!WARNING]
> **Không trả về `isCorrect`** — Student không được biết đáp án đúng khi đang thi!

---

### `POST /api/sessions/{sessionId}/submit` — Nộp bài

| | |
|---|---|
| **Auth** | ✅ `STUDENT` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "answers": [
    {
      "variantQuestionId": 10,
      "selectedAnswerIds": [42]
    },
    {
      "variantQuestionId": 11,
      "selectedAnswerIds": [46]
    }
  ]
}
```

| Field | Type | Mô tả |
|---|---|---|
| `answers` | `SubmitAnswer[]` | Danh sách câu trả lời |
| `answers[].variantQuestionId` | `number` | ID câu hỏi trong variant |
| `answers[].selectedAnswerIds` | `number[]` | ID đáp án đã chọn (mảng — hỗ trợ multi-select) |

> [!TIP]
> `selectedAnswerIds` là **mảng** để hỗ trợ câu hỏi có nhiều đáp án đúng. Với câu hỏi single-choice, mảng chỉ có 1 phần tử.

**Response** `200 OK`: Kết quả chấm điểm ngay lập tức
```json
{
  "id": 1,
  "examSessionId": 1,
  "score": 8.0,
  "totalCorrect": 8,
  "totalQuestions": 10,
  "submittedAt": "2026-05-01T08:55:00"
}
```

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Session đã SUBMITTED (chống submit trùng) |

> **Concurrency-safe**: Backend dùng pessimistic write lock. Nếu student click submit 2 lần, lần 2 sẽ nhận `400`.

---

## 10. Results — Kết quả

### `GET /api/results/session/{sessionId}` — Kết quả Phiên thi

| | |
|---|---|
| **Auth** | ✅ `ALL` |

**Response** `200 OK`:
```json
{
  "id": 1,
  "examSessionId": 1,
  "score": 8.0,
  "totalCorrect": 8,
  "totalQuestions": 10,
  "submittedAt": "2026-05-01T08:55:00"
}
```

---

### `GET /api/results/exam/{examId}` — Bảng điểm Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "examSessionId": 1,
    "studentName": "Nguyễn Văn A",
    "studentId": "2021001",
    "score": 8.0,
    "totalCorrect": 8,
    "submittedAt": "2026-05-01T08:55:00"
  },
  {
    "id": 2,
    "examSessionId": 2,
    "studentName": "Trần Văn B",
    "studentId": "2021002",
    "score": 6.5,
    "totalCorrect": 6,
    "submittedAt": "2026-05-01T09:10:00"
  }
]
```

---

### `GET /api/results/me` — Lịch sử thi của tôi

| | |
|---|---|
| **Auth** | ✅ `STUDENT` |

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "examTitle": "Kiểm tra giữa kỳ - Toán",
    "score": 8.0,
    "totalCorrect": 8,
    "totalQuestions": 10,
    "submittedAt": "2026-05-01T08:55:00"
  }
]
```

---

## 🚨 Error Handling

### Error Response Format

Tất cả error đều trả về cùng format:

```json
{
  "status": 400,
  "message": "Mô tả lỗi chi tiết bằng tiếng Việt",
  "timestamp": "2026-04-21T14:30:00"
}
```

### Frontend Global Error Handler

```typescript
// axiosClient.ts
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Đã có lỗi xảy ra';

    switch (status) {
      case 401:
        // Token hết hạn → xóa auth + redirect login
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/auth/login';
        break;
      case 403:
        toast.error('Bạn không có quyền thực hiện thao tác này.');
        break;
      case 413:
        toast.error('File upload quá lớn. Tối đa 10MB/file.');
        break;
      default:
        toast.error(message);
    }

    return Promise.reject(error);
  }
);
```

### File Upload Limits

| Config | Giá trị |
|---|---|
| Max file size (mỗi file) | **10 MB** |
| Max request size (tổng) | **15 MB** |
| Định dạng hỗ trợ | JPEG, PNG, GIF, WebP, SVG |

---

## 📦 TypeScript Interfaces

Dưới đây là các TypeScript interface gợi ý cho Frontend:

```typescript
// ========== Auth ==========
interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

// ========== User ==========
interface UserResponse {
  id: number;
  username: string;
  name: string;
  studentId: string | null;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

interface CreateStudentRequest {
  studentId: string;
  name: string;
}

interface CreateStudentResponse {
  id: number;
  studentId: string;
  name: string;
  username: string;   // Auto-generated
  password: string;   // Auto-generated (plain text, 1 lần duy nhất)
  role: 'STUDENT';
}

interface CreateTeacherRequest {
  username: string;
  password: string;
  name: string;
}

interface UpdateProfileRequest {
  username?: string;
  password?: string;
  name?: string;
}

// ========== Subject & Chapter ==========
interface SubjectResponse {
  id: number;
  name: string;
  chapters: ChapterResponse[];
}

interface SubjectRequest {
  name: string;
}

interface ChapterResponse {
  id: number;
  subjectId: number;
  name: string;
  chapterOrder: number;
  questionCount: number;
}

interface ChapterRequest {
  name: string;
  chapterOrder: number;
}

// ========== Question ==========
interface QuestionResponse {
  id: number;
  content: string;
  imageUrl: string | null;
  subjectId: number;
  chapterId: number;
  answers: AnswerResponse[];
}

interface AnswerResponse {
  id: number;
  content: string;
  imageUrl: string | null;
  isCorrect: boolean;
}

interface QuestionRequest {
  content: string;
  subjectId: number;
  chapterId: number;
  answers: AnswerRequest[];
}

interface AnswerRequest {
  content: string;
  isCorrect: boolean;
}

// ========== Exam ==========
interface ExamResponse {
  id: number;
  title: string;
  subjectId: number;
  subjectName?: string;
  duration: number;
  totalQuestions: number;
  totalVariants: number;
  startTime: string | null;
  endTime: string | null;
}

interface ExamRequest {
  title: string;
  subjectId: number;
  duration: number;
  totalQuestions: number;
  totalVariants: number;
  chapterConfigs: ChapterConfigRequest[];
  startTime?: string;
  endTime?: string;
}

interface ChapterConfigRequest {
  chapterId: number;
  questionCount: number;
}

// ========== Exam Session ==========
interface ExamSessionResponse {
  id: number;
  examId: number;
  examTitle?: string;
  variantId: number;
  startTime: string;
  status: 'DOING' | 'SUBMITTED';
}

interface ExamQuestionResponse {
  variantQuestionId: number;
  content: string;
  imageUrl: string | null;
  orderIndex: number;
  answers: ExamAnswerResponse[];
}

interface ExamAnswerResponse {
  answerId: number;
  content: string;
  imageUrl: string | null;
  orderIndex: number;
  // ⚠️ KHÔNG có isCorrect — student không được biết đáp án đúng
}

interface SubmitSessionRequest {
  answers: SubmitAnswer[];
}

interface SubmitAnswer {
  variantQuestionId: number;
  selectedAnswerIds: number[];  // Mảng — hỗ trợ multi-select
}

// ========== Result ==========
interface ResultResponse {
  id: number;
  examSessionId: number;
  score: number;
  totalCorrect: number;
  totalQuestions?: number;
  submittedAt: string;
}

interface ExamResultResponse extends ResultResponse {
  studentName: string;
  studentId: string;
}

interface MyResultResponse extends ResultResponse {
  examTitle: string;
}

// ========== Error ==========
interface ApiError {
  status: number;
  message: string;
  timestamp: string;
}
```

---

## 📎 Quick Reference

### Endpoint Summary

| Module | Method | Endpoint | Auth |
|---|---|---|---|
| **Auth** | `POST` | `/api/auth/login` | Public |
| **Users** | `GET` | `/api/users` | ADMIN, TEACHER |
| | `GET` | `/api/users/{id}` | ADMIN, TEACHER |
| | `POST` | `/api/users/students` | ADMIN, TEACHER |
| | `POST` | `/api/users/teachers` | ADMIN |
| | `PUT` | `/api/users/{id}` | ADMIN |
| | `PUT` | `/api/users/me` | TEACHER |
| | `DELETE` | `/api/users/{id}` | ADMIN |
| **Subjects** | `GET` | `/api/subjects` | ADMIN, TEACHER |
| | `GET` | `/api/subjects/{id}` | ADMIN, TEACHER |
| | `POST` | `/api/subjects` | ADMIN, TEACHER |
| | `PUT` | `/api/subjects/{id}` | ADMIN, TEACHER |
| | `DELETE` | `/api/subjects/{id}` | ADMIN, TEACHER |
| **Chapters** | `GET` | `/api/subjects/{subjectId}/chapters` | ADMIN, TEACHER |
| | `POST` | `/api/subjects/{subjectId}/chapters` | ADMIN, TEACHER |
| | `PUT` | `/api/subjects/{subjectId}/chapters/{id}` | ADMIN, TEACHER |
| | `DELETE` | `/api/subjects/{subjectId}/chapters/{id}` | ADMIN, TEACHER |
| **Questions** | `GET` | `/api/questions` | ADMIN, TEACHER |
| | `GET` | `/api/questions/{id}` | ADMIN, TEACHER |
| | `POST` | `/api/questions` | ADMIN, TEACHER |
| | `PUT` | `/api/questions/{id}` | ADMIN, TEACHER |
| | `DELETE` | `/api/questions/{id}` | ADMIN, TEACHER |
| **Uploads** | `GET` | `/uploads/**` | Public |
| **Exams** | `GET` | `/api/exams` | ALL |
| | `GET` | `/api/exams/{id}` | ALL |
| | `POST` | `/api/exams` | ADMIN, TEACHER |
| | `PUT` | `/api/exams/{id}` | ADMIN, TEACHER |
| | `DELETE` | `/api/exams/{id}` | ADMIN, TEACHER |
| **Participants** | `POST` | `/api/exams/{id}/participants` | ADMIN, TEACHER |
| | `GET` | `/api/exams/{id}/participants` | ADMIN, TEACHER |
| | `DELETE` | `/api/exams/{id}/participants/{userId}` | ADMIN, TEACHER |
| **Sessions** | `POST` | `/api/sessions/start/{examId}` | STUDENT |
| | `GET` | `/api/sessions/{id}/questions` | STUDENT |
| | `POST` | `/api/sessions/{id}/submit` | STUDENT |
| **Results** | `GET` | `/api/results/session/{sessionId}` | ALL |
| | `GET` | `/api/results/exam/{examId}` | ADMIN, TEACHER |
| | `GET` | `/api/results/me` | STUDENT |
