# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)

## Tên dự án: Hệ thống Quản lý & Tổ chức Thi Trắc nghiệm Toàn diện
**Phiên bản:** 2.0

---

## 1. GIỚI THIỆU CHUNG

### 1.1 Khái quát dự án
Sản phẩm là một giải pháp phần mềm thi trắc nghiệm trên máy tính được thiết kế nhằm tối ưu hóa toàn bộ quy trình khảo thí. Hệ thống cung cấp một môi trường khép kín từ khâu lưu trữ ngân hàng câu hỏi (phân loại theo **môn học & chương**, hỗ trợ **ảnh minh họa**), tổ chức thi với **đề thi được trộn sẵn** (Pre-generated Variants), cho đến tự động hóa quá trình chấm thi.

### 1.2 Mục tiêu
- **Tối ưu sức lao động:** Giải phóng thời gian và công sức cho giáo viên/nhà quản lý giáo dục trong việc ra đề và chấm thi.
- **Tính công bằng & Bảo mật:** Ngăn chặn gian lận hiệu quả thông qua thuật toán trộn đề thông minh với N đề tráo được sinh sẵn.
- **Độ chính xác cao:** Tự động hóa quá trình chấm điểm, giảm thiểu sai sót do con người.
- **Tính linh hoạt:** Hỗ trợ cả hai hình thức thi trực tuyến (Online) và ngoại tuyến (Offline qua xử lý ảnh Phiếu trả lời).
- **Phân cấp quản lý:** Hệ thống 3 cấp phân quyền (ADMIN > TEACHER > STUDENT) phù hợp với quy trình thực tế trong giáo dục.
- **Bảo toàn dữ liệu:** Xóa mềm (Soft Delete) toàn hệ thống, đảm bảo dữ liệu lịch sử không bị mất.

---

## 2. KIẾN TRÚC HỆ THỐNG & CÔNG NGHỆ

### 2.1 Công nghệ sử dụng

| Layer | Công nghệ | Phiên bản |
|---|---|---|
| **Backend (REST API)** | Java, Spring Boot | 21 (LTS), 3.5.12 |
| **Cơ sở dữ liệu** | MySQL | 8.x+ |
| **Bảo mật** | Spring Security + JWT | — |
| **ORM & Truy xuất dữ liệu** | Spring Data JPA + Hibernate | — |
| **Validation** | Spring Validation (Jakarta) | — |
| **Caching** | Spring Cache | — |
| **API Docs** | Swagger / SpringDoc OpenAPI | — |
| **Frontend** | React + TypeScript + Vite + Tailwind CSS | React 19, Vite 8 |
| **AI / Computer Vision (Dự kiến)** | Python Service (OCR, Object Detection) | Planned |

### 2.2 Kiến trúc tổng quan
Hệ thống tuân theo mô hình Client-Server, backend cung cấp các API độc lập phân chia theo Module (Package by Feature):
- **Core Layer:** Xử lý bảo mật (JWT 3-role), ngoại lệ tập trung (GlobalExceptionHandler), cấu hình (CORS, serve ảnh upload), tiện ích chung (trộn đề, random credentials, upload file).
- **User Module:** Quản lý tài khoản 3 cấp, xác thực bằng `username`, tạo Student với credentials auto-gen.
- **Question Module:** Quản trị ngân hàng câu hỏi theo **môn học + chương**, hỗ trợ upload ảnh minh họa qua `multipart/form-data`.
- **Exam Module:** Cấu hình kỳ thi theo chương (số câu/chương), sinh đề gốc + N đề tráo sẵn (Pre-generated Variants), quản lý thí sinh.
- **Session Module:** Gán random 1 đề đã tráo sẵn cho thí sinh, phục vụ đề thi, nhận bài nộp one-shot.
- **Grading Module:** Chấm bài tự động theo exact-set-match, tính điểm, thống kê.
- **External/Vision Module (Planned):** Giao tiếp với service Python để nhận diện ảnh bài làm (Answer Sheet).

### 2.3 Khởi tạo dữ liệu
- Tài khoản **Admin mặc định** được seed tự động từ `application.properties` khi ứng dụng khởi động lần đầu (qua `AdminDataInitializer`).
- **Không có route đăng ký công khai** — tất cả tài khoản được tạo bởi Admin/Teacher.

---

## 3. ĐẶC TẢ TÍNH NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)

### 3.1 Phân quyền 3 cấp & Quản lý Người dùng
- **Xác thực & Phân quyền:** 
  - Hệ thống xác thực bằng JWT Token, đăng nhập bằng **`username`** + `password`.
  - Hỗ trợ 3 vai trò phân cấp:
    - **ADMIN:** Quản lý toàn bộ hệ thống, tạo tài khoản Teacher, sửa/xóa user bất kỳ.
    - **TEACHER:** Quản lý ngân hàng câu hỏi, tổ chức kỳ thi, tạo tài khoản Student, tự cập nhật thông tin cá nhân.
    - **STUDENT:** Chỉ được phép tham gia thi (xem kỳ thi được phân công, làm bài, nộp bài) và xem kết quả cá nhân.
- **Quản lý Tài khoản:**
  - **Tạo Student:** Admin/Teacher nhập MSSV + tên → server tự động sinh `username` + `password` ngẫu nhiên. Credentials chỉ trả về **1 lần duy nhất** trong response.
  - **Tạo Teacher:** Chỉ Admin, nhập thủ công `username`, `password`, `name`.
  - **Tự cập nhật:** Teacher có thể tự đổi username, password, name (qua endpoint riêng `/users/me`). Student **không được** tự đổi thông tin.
  - **Quản lý:** Admin xem tất cả users, sửa/xóa user bất kỳ. Teacher chỉ xem danh sách Student.
  - **Xóa mềm:** Xóa tài khoản chỉ đánh dấu `deleted = true`, dữ liệu vẫn tồn tại trong DB.

### 3.2 Quản lý Ngân hàng Câu hỏi
- **Danh mục môn học:** CRUD môn học (subjects).
- **Quản lý Chương (Mới):** Mỗi môn học gồm nhiều chương (chapters), mỗi chương có tên + thứ tự. Câu hỏi bắt buộc phải thuộc về 1 chương cụ thể.
- **Quản lý Câu hỏi:**
  - Bổ sung, chỉnh sửa và phân loại câu hỏi theo **môn học + chương**.
  - Hỗ trợ thiết lập đáp án cho từng câu hỏi (chọn 1 hoặc chọn nhiều mệnh đề đúng).
  - **Upload ảnh minh họa** (tùy chọn) cho cả câu hỏi và từng đáp án qua `multipart/form-data`. Ảnh được lưu trên server với tên UUID, truy cập công khai qua `/uploads/**`.
  - Tìm kiếm, filter theo môn/chương, phân trang.
  - Xóa mềm (Soft Delete).

### 3.3 Tổ chức Kỳ thi
- **Tạo kỳ thi:** Khai báo thông tin kỳ thi bao gồm:
  - Tiêu đề, Môn học, Thời gian làm bài (phút), Khung giờ mở/đóng.
  - **Cấu hình số câu/chương** (Mới): Chỉ định số câu muốn lấy từ mỗi chương. Hệ thống validate:
    - Σ `questionCount` tất cả chương phải = `totalQuestions`.
    - `questionCount` mỗi chương phải ≤ số câu thực tế có trong chương đó.
  - **Số đề tráo (totalVariants)**: Chỉ định tổng số đề (1 gốc + N-1 tráo).
- **Sinh đề tự động (Pre-generated):** Khi tạo kỳ thi, server tự động:
  1. Random chọn câu hỏi theo config chương → tạo đề gốc.
  2. Tráo sẵn N-1 đề từ đề gốc (xáo trộn cả câu hỏi lẫn đáp án).
  3. Lưu tất cả đề vào DB — không cần tạo đề realtime khi student bắt đầu thi.
- **Phân bổ thí sinh:** Thêm/xóa thí sinh vào kỳ thi.
- **Hiển thị theo role:** Admin/Teacher xem tất cả kỳ thi. Student chỉ xem kỳ thi mình được phân công.
- **Xóa mềm:** Chỉ xóa được kỳ thi chưa bắt đầu (UPCOMING).

### 3.4 Thuật toán Trộn đề Thông minh (Pre-generated Variants)
- **Sinh đề gốc:** Random chọn câu hỏi từ ngân hàng theo cấu hình chương → tạo 1 đề gốc (`variant_order = 0, is_original = true`).
- **Tráo đề:** Từ đề gốc, sử dụng thuật toán **Fisher-Yates Shuffle** để:
  - Xáo trộn **thứ tự câu hỏi** (vị trí các câu hỏi thay đổi).
  - Xáo trộn **thứ tự đáp án** trong mỗi câu hỏi (A, B, C, D thay đổi vị trí).
- **Lưu trữ:** Tất cả N đề (gốc + tráo) được lưu sẵn vào DB thông qua các bảng `exam_variants`, `exam_variant_questions`, `exam_variant_answers`.
- **Gán đề khi thi:** Khi Student bắt đầu thi, server chỉ cần random gán 1 trong N variant đã tạo sẵn → không có delay tạo đề realtime.

### 3.5 Phiên thi (Session) — Luồng chính
1. Student nhấn "Bắt đầu thi" → server validate (đúng thí sinh, đúng thời gian, chưa có phiên thi).
2. Server random gán 1 variant (đề đã tráo sẵn) → tạo `exam_session` với `variant_id`.
3. Client gọi API lấy đề thi → server trả về câu hỏi + đáp án từ variant đã gán (**không trả `isCorrect`**).
4. Student làm bài → nhấn Nộp bài → client gửi toàn bộ đáp án trong 1 request (one-shot submit).
5. Server chấm điểm ngay → trả kết quả.
- **Concurrency-safe:** Server dùng pessimistic write lock chặn submit trùng (click 2 lần / network retry).

### 3.6 Chấm điểm Tự động (Auto-Grading)
- **Thi Trực tuyến (Online):** 
  - Tiếp nhận toàn bộ đáp án của thí sinh khi nhấn Nộp bài.
  - Đánh giá theo nguyên tắc *Exact-set-match* (tập đáp án chọn phải khớp hoàn toàn với tập đáp án đúng đã lưu trong câu hỏi gốc).
  - Tự động tính toán điểm số: `score = (total_correct / total_questions) × 10`.
  - Lưu kết quả vào bảng `results`.
- **Thi Ngoại tuyến (Offline — Planned):**
  - **Tích hợp Computer Vision:** Thông qua module external, hệ thống nhận ảnh chụp định dạng Phiếu trả lời trắc nghiệm (Answer Sheet).
  - Tự động quét mã đề, nhận diện vị trí các ô trống được tô/khoanh của thí sinh.
  - Map kết quả nhận dạng vào bảng variant → chạy luồng chấm điểm online như trên.

### 3.7 Kết xuất & Số hóa Tài liệu (Planned)
- **Xuất file PDF:** 
  - Hỗ trợ biên dịch và trích xuất các mã đề (sau khi tráo) kèm theo file ma trận đáp án tương ứng ra định dạng PDF chuẩn chỉnh.
  - Sẵn sàng dùng cho in ấn phục vụ công tác tổ chức thi trực tiếp (offline).

### 3.8 Soft Delete — Toàn hệ thống
- **Tất cả** thao tác xóa trên mọi bảng (users, subjects, chapters, questions, answers, exams, exam_participants, exam_sessions, results) đều là **soft delete** — chỉ set `deleted = true`.
- JPA Entity sử dụng `@SQLDelete` + `@Where(clause = "deleted = false")` để tự động filter.
- Bảo toàn dữ liệu lịch sử, giảm rủi ro mất dữ liệu.

---

## 4. MÔ HÌNH CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Hệ thống bao gồm **15 bảng dữ liệu** cốt lõi:

| # | Bảng | Mô tả |
|---|---|---|
| 1 | `users` | Tài khoản hệ thống — `id, username, name, student_id, password, role (ADMIN/TEACHER/STUDENT), deleted`. Login bằng `username`. |
| 2 | `subjects` | Danh mục môn học — `id, name, deleted`. |
| 3 | `chapters` | Chương trong môn học — `id, subject_id, name, chapter_order, deleted`. Mỗi chương có tên & thứ tự. |
| 4 | `questions` | Ngân hàng câu hỏi — `id, content, image_url, subject_id, chapter_id, created_at, deleted`. Liên kết với môn & chương, hỗ trợ ảnh. |
| 5 | `answers` | Đáp án — `id, question_id, content, image_url, is_correct, deleted`. Hỗ trợ ảnh. |
| 6 | `exams` | Kỳ thi — `id, title, subject_id, duration, total_questions, total_variants, start_time, end_time, deleted`. |
| 7 | `exam_chapter_configs` | Cấu hình số câu/chương — `id, exam_id, chapter_id, question_count`. |
| 8 | `exam_variants` | Đề thi (gốc + tráo) — `id, exam_id, variant_order, is_original`. |
| 9 | `exam_variant_questions` | Câu hỏi đã xáo trộn trong đề — `id, variant_id, question_id, order_index`. |
| 10 | `exam_variant_answers` | Đáp án đã xáo trộn trong đề — `id, variant_question_id, answer_id, order_index`. |
| 11 | `exam_participants` | Thí sinh được phân công — `id, exam_id, user_id, deleted`. |
| 12 | `exam_sessions` | Phiên thi — `id, exam_id, user_id, variant_id, start_time, end_time, status (DOING/SUBMITTED), deleted`. |
| 13 | `user_answers` | Câu trả lời — `id, exam_session_id, variant_question_id`. |
| 14 | `user_answer_selections` | Đáp án đã chọn — `id, user_answer_id, selected_answer_id`. Hỗ trợ multi-select. |
| 15 | `results` | Kết quả chấm điểm — `id, exam_session_id, score, total_correct, submitted_at, deleted`. |

---

## 5. YÊU CẦU CHI TIẾT DÀNH CHO FRONTEND (UI/UX & TƯƠNG TÁC)

Để đảm bảo chất lượng sản phẩm đầu cuối và mang lại trải nghiệm người dùng (UX) tối ưu, đội ngũ Frontend (sử dụng React 19, TypeScript, Tailwind CSS, Vite 8) cần tuân thủ các đặc tả cụ thể dưới đây:

### 5.1 Giao diện Làm bài thi (Exam Interface - Phân hệ Học sinh)
Đây là màn hình cốt lõi mang tính quyết định của hệ thống, yêu cầu mức độ hoàn thiện cao nhất:
- **Cơ chế chống gian lận (Anti-cheat):**
  - Khuyến khích/Yêu cầu trình duyệt chuyển sang chế độ Toàn màn hình (Full-screen API) khi làm bài.
  - Bắt sự kiện chuyển Tab/thu nhỏ cửa sổ (`visibilitychange`, `blur window`). Cảnh báo thí sinh ngay trên màn hình, lưu vết vi phạm hoặc tự động nộp bài nếu tái phạm nhiều lần.
  - Vô hiệu hóa tính năng bôi đen, Copy/Paste, click chuột phải (Context menu) và các phím tắt phổ biến cấu hình dev (F12, Ctrl+U...).
- **Quản lý Thời gian (Countdown Timer):**
  - Đồng hồ đếm ngược phải đồng bộ dựa trên thời gian bắt đầu từ server thi (`start_time`), đảm bảo thời gian vẫn chạy đúng kể cả khi thí sinh vô tình F5/tải lại trang (không dùng countdown timer thuần túy của client).
- **Đồng bộ hóa & Lưu tạm (Auto-save / Network Resilience):**
  - Trạng thái các câu hỏi (Đã làm, Chưa làm, Đang phân vân) cần được thể hiện bằng màu sắc rõ ràng ở cột điều hướng (Sidebar navigation).
  - Tích hợp cơ chế Cache trạng thái chọn đáp án nội bộ (LocalStorage/IndexedDB) và cơ chế Debounce khi gọi API lưu vết để tránh nghẽn server.
  - Xử lý tình trạng mất mạng (Offline handling): Hiển thị thông báo (Toast/Banner cảnh báo kết nối) khi rớt mạng, không cho phép nhấn nút "Nộp bài" cho đến khi mạng được khôi phục, đảm bảo dữ liệu không bị thất thoát.
- **Hiển thị ảnh minh họa:**
  - Câu hỏi và đáp án có thể có ảnh minh họa (`imageUrl`). Frontend cần render ảnh từ `/uploads/{imageUrl}` khi trường này không null.

### 5.2 Giao diện Quản trị (Admin/Teacher Dashboards)
- **Hỗ trợ role TEACHER:**
  - TEACHER dùng chung layout Admin nhưng **không thấy** nút "Tạo Teacher" và "Sửa/Xóa user".
  - UI cần ẩn/hiện tính năng dựa theo role hiện tại (lấy từ `localStorage` hoặc JWT).
- **Quản lý Tài khoản (UserManagement):**
  - Form tạo Student: chỉ 2 field (MSSV + Tên). Sau khi tạo thành công, hiển thị popup chứa `username` + `password` auto-gen (cảnh báo chỉ hiện 1 lần).
  - Form tạo Teacher (chỉ ADMIN): 3 field (username + password + tên).
- **Quản lý Môn học & Chương (SubjectManagement):**
  - CRUD môn học + quản lý chương trong mỗi môn (tên + thứ tự).
- **Thao tác danh sách dữ liệu (Data Grid & Tables):**
  - Các trang Quản lý phải có Bảng dữ liệu tích hợp sẵn tính năng Lọc (Filter) theo môn học/chương, Tìm kiếm (Debounce Search) và Phân trang (Pagination).
- **Form nhập liệu mở rộng — Câu hỏi (QuestionManagement):** 
  - Form nhập đề cần linh hoạt (Dynamic Field Array) để thêm/xóa Số lượng Đáp án.
  - Bắt buộc chọn **Môn học + Chương** (chương load theo môn).
  - **Hỗ trợ upload ảnh** cho câu hỏi + từng đáp án (input file, gửi `multipart/form-data`).
  - Validation: cảnh báo nếu chưa tick chọn đáp án đúng.
  - Hiển thị ảnh đã upload từ `/uploads/{imageUrl}`.
- **Form tạo Kỳ thi (ExamManagement):**
  - Chọn Môn → Load danh sách Chương của môn.
  - Bảng cấu hình: mỗi hàng = 1 chương + input số câu. Hiện tổng `Σ questionCount` realtime.
  - Input `totalVariants` (số đề tráo, ≥ 1).
  - Validate trước khi submit: tổng câu phải khớp, số câu/chương không vượt quá số câu có sẵn.
- **Quản lý Thí sinh (ParticipantManagement):**
  - Thêm/xóa thí sinh. Nút xóa trên mỗi hàng.
- **Trực quan hóa Dữ liệu (ExamReports):**
  - Sử dụng các thư viện biểu đồ web (như Recharts, Chart.js) để trực quan hóa điểm số, tỷ lệ đỗ/trượt, v.v.

### 5.3 Bảo mật, Điều hướng & Trạng thái Toàn cục (State/RBAC)
- **Bảo vệ luồng truy cập (Protected Routes):** 
  - Component `ProtectedRoute` phải kiểm tra chính xác `Role` (hỗ trợ 3 role: ADMIN, TEACHER, STUDENT).
  - STUDENT cố truy cập `/admin/*` → redirect về trang chủ.
  - TEACHER cố truy cập tính năng chỉ ADMIN (tạo Teacher, sửa/xóa user) → ẩn UI hoặc báo lỗi 403.
- **Quản lý Token & Xử lý lỗi (API Interceptors):**
  - Khởi tạo Axios Interceptors tự động đính kèm `Bearer Token` vào mọi request.
  - Đón đầu mọi lỗi 401 (Mất Authentication): Tự động Clear cache, redirect về trang Login kèm theo thông báo "Phiên đăng nhập đã hết hạn".
  - Xử lý lỗi 413 (File upload quá lớn): Hiện thông báo "File vượt quá 10MB".
- **Visual Feedback UI (Trải nghiệm người dùng tương tác):**
  - Bắt buộc phải có Loading Spinner hoặc Skeleton Loading Screen khi chuyển trang hoặc chờ fetch dữ liệu API.
  - Hiển thị Toast Message / Snackbar tại tất cả các thao tác hành động như Tạo thêm, Xóa, Cập nhật thành công hay Lỗi gọi API.
  - Xác nhận xóa bằng dialog (SweetAlert2) — lưu ý xóa là soft delete, dữ liệu không mất.

---

## 6. TẦM NHÌN & KHẢ NĂNG MỞ RỘNG (ROADMAP)

Hệ thống được thiết kế với kiến trúc linh hoạt, tập trung vào việc số hóa hoàn toàn nền tảng giáo dục với ứng dụng AI:

- [x] **v2.0** — Restructure: 3-role, chapters, pre-generated variants, image upload (multipart/form-data), soft delete
- [ ] **v2.1** — Kết xuất đề thi & đáp án ra PDF
- [ ] **v3.0** — Tích hợp Vision Service (quét phiếu trả lời)
- [ ] **v4.0** — OCR/Object Detection: trích xuất câu hỏi từ PDF/ảnh scan
- [ ] **Future** — Realtime exam monitoring (WebSocket), Analytics dashboard, Proctoring

---
*Tài liệu đặc tả này là cơ sở để đội ngũ phát triển, kiểm thử và thiết kế tham chiếu trong quá trình hoàn thiện sản phẩm Hệ thống Thi Trắc nghiệm Toàn diện.*