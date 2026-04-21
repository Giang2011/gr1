# 📋 CHANGELOG — Backend Changes Affecting Frontend

> Tài liệu này ghi lại các thay đổi lớn từ phía Backend ảnh hưởng trực tiếp đến quá trình phát triển Frontend.
> Cập nhật lần cuối: **2026-04-21**

---

## [v2.0] — 2026-04-16 ~ 2026-04-20 — Major Architectural Refactoring

### 🔴 BREAKING CHANGES

#### 1. Hệ thống phân quyền 3 cấp (ADMIN > TEACHER > STUDENT)

**Trước đây**: Chỉ 2 role: `ADMIN` và `STUDENT`.
**Bây giờ**: 3 role: `ADMIN`, `TEACHER`, `STUDENT`.

| Ảnh hưởng Frontend | Chi tiết |
|---|---|
| `ProtectedRoute.tsx` | Cần thêm `TEACHER` vào `allowedRoles` cho Admin routes |
| `AdminLayout.tsx` | TEACHER cũng dùng AdminLayout, nhưng **không thấy** nút "Tạo Teacher" và "Sửa/Xóa user" |
| `localStorage` | `role` giờ có thể là `'ADMIN'`, `'TEACHER'`, hoặc `'STUDENT'` |
| `RootRedirect` | TEACHER cần redirect giống ADMIN → `/admin/...` |

**Action cần làm**:
```diff
// ProtectedRoute.tsx
- <ProtectedRoute allowedRoles={['ADMIN']} />
+ <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']} />

// RootRedirect trong App.tsx
  if (role === 'ADMIN') return <Navigate to="/admin/users" />;
+ if (role === 'TEACHER') return <Navigate to="/admin/subjects" />;
  return <Navigate to="/student/exams" />;
```

---

#### 2. Login bằng `username` thay vì `name`

**Trước đây**: Login request gửi `{ name, password }`.
**Bây giờ**: Login request gửi `{ username, password }`.

**Action cần làm**:
```diff
// authApi.ts
- const login = (name: string, password: string) =>
-   axiosClient.post('/auth/login', { name, password });
+ const login = (username: string, password: string) =>
+   axiosClient.post('/auth/login', { username, password });

// Login.tsx — sửa form field
- <input name="name" placeholder="Tên đăng nhập" />
+ <input name="username" placeholder="Tên đăng nhập" />
```

---

#### 3. Xóa route đăng ký công khai

**Trước đây**: Có endpoint `POST /api/auth/register` cho user tự đăng ký.
**Bây giờ**: **KHÔNG CÒN** route register. Tất cả tài khoản được tạo bởi Admin/Teacher.

**Action cần làm**:
- Xóa hoặc ẩn trang `Register.tsx` và route `/auth/register`
- Xóa `SignupForm` component nếu có
- Cập nhật LoginForm: bỏ link "Chưa có tài khoản? Đăng ký"

---

#### 4. Tạo tài khoản Student — Auto-gen Credentials

**Trước đây**: Tạo user thông qua form có username + password.
**Bây giờ**: Tạo Student chỉ cần `studentId` (MSSV) + `name`. Server tự sinh `username` + `password` random.

**Request**:
```json
POST /api/users/students
{ "studentId": "2021001", "name": "Nguyễn Văn A" }
```

**Response** (trả về 1 lần duy nhất):
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

**Action cần làm**:
- `UserManagement.tsx`: Form tạo Student chỉ có 2 field: MSSV + Tên
- Hiển thị popup/modal sau khi tạo thành công chứa `username` + `password` để Admin/Teacher ghi lại
- **Cảnh báo**: Password chỉ hiển thị 1 lần, không thể xem lại

---

#### 5. Tạo tài khoản Teacher (chỉ Admin)

**Bây giờ**: Endpoint mới `POST /api/users/teachers` — chỉ ADMIN được gọi.

**Request**:
```json
POST /api/users/teachers
{ "username": "teacher1", "password": "abc123", "name": "Trần Thị B" }
```

**Action cần làm**:
- `UserManagement.tsx`: Thêm nút "Tạo Teacher" (chỉ hiện khi role = ADMIN)
- Form cần 3 field: username, password, name

---

#### 6. Chapter-based Question Management

**Trước đây**: Câu hỏi chỉ thuộc về Môn học (Subject).
**Bây giờ**: Câu hỏi thuộc về **Môn học + Chương** (Subject + Chapter).

**API mới**:
```
GET    /api/subjects/{subjectId}/chapters          — DS chương
POST   /api/subjects/{subjectId}/chapters          — Tạo chương
PUT    /api/subjects/{subjectId}/chapters/{id}     — Sửa chương
DELETE /api/subjects/{subjectId}/chapters/{id}     — Xóa chương
```

**Action cần làm**:
- `SubjectManagement.tsx`: Thêm section quản lý chương trong mỗi môn
- `QuestionManagement.tsx`: Thêm dropdown chọn Chương (bắt buộc), filter theo Chương
- `adminApi.ts`: Thêm API functions cho Chapters CRUD

---

#### 7. Upload ảnh câu hỏi (multipart/form-data)

**Trước đây**: Tạo/sửa câu hỏi gửi JSON thuần.
**Bây giờ**: Tạo/sửa câu hỏi gửi `multipart/form-data` gồm:

| Part | Type | Required | Mô tả |
|---|---|---|---|
| `data` | Text (JSON string) | ✅ | `{content, subjectId, chapterId, answers[{content, isCorrect}]}` |
| `questionImage` | File | ❌ | Ảnh minh họa cho câu hỏi |
| `answerImages` | File[] | ❌ | Ảnh minh họa cho từng đáp án (theo index) |

**Action cần làm**:
```typescript
// adminApi.ts — Tạo câu hỏi
const createQuestion = (data: QuestionData, questionImage?: File, answerImages?: File[]) => {
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

- `QuestionManagement.tsx`: Thêm input file cho câu hỏi + mỗi đáp án
- Hiển thị ảnh đã upload: `<img src="/uploads/{imageUrl}" />`
- File hỗ trợ: JPEG, PNG, GIF, WebP, SVG — max 10MB/file, max 15MB/request

---

#### 8. Pre-generated Exam Variants

**Trước đây**: Đề thi trộn realtime khi student bắt đầu thi.
**Bây giờ**: Khi tạo kỳ thi, Admin/Teacher cấu hình số câu/chương + số đề tráo. Server sinh đề sẵn.

**Request tạo kỳ thi**:
```json
POST /api/exams
{
  "title": "Kiểm tra giữa kỳ",
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

**Validation rules** (sẽ trả 400 nếu vi phạm):
- `Σ questionCount tất cả chương == totalQuestions`
- `questionCount mỗi chương ≤ số câu thực tế có trong chương`
- `totalVariants ≥ 1`

**Action cần làm**:
- `ExamManagement.tsx`: Form tạo kỳ thi cần:
  - Dropdown chọn Môn → load DS Chương
  - Bảng cấu hình: mỗi hàng = 1 chương + input số câu
  - Input `totalVariants` (số đề tráo)
  - Hiện tổng `Σ questionCount` realtime, validate trước khi submit

---

#### 9. Xóa thí sinh khỏi kỳ thi

**Bây giờ**: Endpoint mới `DELETE /api/exams/{id}/participants/{userId}`.

**Action cần làm**:
- `ParticipantManagement.tsx`: Thêm nút xóa thí sinh trên mỗi hàng

---

#### 10. Soft Delete toàn hệ thống

**Bây giờ**: Tất cả thao tác DELETE ở backend đều là soft delete (`deleted = true`). Dữ liệu không mất.

**Action cần làm**:
- UI xác nhận xóa có thể dùng confirm dialog nhẹ (SweetAlert2): "Xóa mục này?" thay vì cảnh báo "mất vĩnh viễn"
- Không cần hiển thị dữ liệu đã xóa — backend tự filter `deleted = false`

---

#### 11. Student chỉ xem kỳ thi được phân công

**Bây giờ**: `GET /api/exams` tự động filter theo role ở backend.
- **ADMIN/TEACHER**: Trả tất cả kỳ thi
- **STUDENT**: Chỉ trả kỳ thi mà student được thêm vào `exam_participants`

**Action cần làm**:
- Frontend không cần filter — cùng 1 API endpoint, backend tự xử lý

---

#### 12. Teacher tự cập nhật thông tin

**Bây giờ**: Endpoint mới `PUT /api/users/me` — chỉ TEACHER dùng.

**Request**:
```json
PUT /api/users/me
{ "username": "new_username", "password": "new_pass", "name": "Tên mới" }
```

**Action cần làm**:
- Thêm trang Profile cho TEACHER (có thể dùng lại route `/admin/profile`)
- Form cho phép đổi username, password, name

---

### 🟡 UserResponseDTO — Thay đổi cấu trúc

**Trước đây**:
```json
{ "id": 1, "name": "admin", "role": "ADMIN" }
```

**Bây giờ**:
```json
{
  "id": 1,
  "username": "admin",
  "name": "admin",
  "studentId": null,
  "role": "ADMIN"
}
```

- Thêm `username` (tên đăng nhập)
- Thêm `studentId` (MSSV — chỉ có ở STUDENT, null cho ADMIN/TEACHER)

---

### 🟢 NEW FEATURES (không phải breaking)

#### Upload ảnh — Public access
- Ảnh upload được serve tại `/uploads/**` (public, không cần auth)
- VD: `GET /uploads/abc123-uuid.jpg`

#### LoginResponseDTO — Cấu trúc giữ nguyên
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "role": "STUDENT"
}
```

---

## [v1.0] — Initial Release

- Hệ thống thi trắc nghiệm cơ bản
- 2 role: ADMIN, STUDENT
- Login bằng `name`
- Có route đăng ký công khai
- Câu hỏi chỉ thuộc Subject (không có Chapter)
- Trộn đề realtime khi student bắt đầu thi
- Không có soft delete
- Không hỗ trợ upload ảnh
