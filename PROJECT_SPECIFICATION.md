# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)

## Tên dự án: Hệ thống Quản lý & Tổ chức Thi Trắc nghiệm Toàn diện
**Phiên bản:** 1.0

---

## 1. GIỚI THIỆU CHUNG

### 1.1 Khái quát dự án
Sản phẩm là một giải pháp phần mềm thi trắc nghiệm trên máy tính được thiết kế nhằm tối ưu hóa toàn bộ quy trình khảo thí. Hệ thống cung cấp một môi trường khép kín từ khâu lưu trữ ngân hàng câu hỏi, tổ chức thi, trộn đề minh bạch, cho đến tự động hóa quá trình chấm thi. 

### 1.2 Mục tiêu
- **Tối ưu sức lao động:** Giải phóng thời gian và công sức cho giáo viên/nhà quản lý giáo dục trong việc ra đề và chấm thi.
- **Tính công bằng & Bảo mật:** Ngăn chặn gian lận hiệu quả thông qua thuật toán trộn đề thông minh.
- **Độ chính xác cao:** Tự động hóa quá trình chấm điểm, giảm thiểu sai sót do con người.
- **Tính linh hoạt:** Hỗ trợ cả hai hình thức thi trực tuyến (Online) và ngoại tuyến (Offline qua xử lý ảnh Phiếu trả lời).

---

## 2. KIẾN TRÚC HỆ THỐNG & CÔNG NGHỆ

### 2.1 Công nghệ sử dụng
- **Backend (REST API):** Java 21 (LTS), Spring Boot 3.5.12
- **Cơ sở dữ liệu:** MySQL 8.x+
- **Bảo mật:** Spring Security + JWT
- **ORM & Truy xuất dữ liệu:** Spring Data JPA + Hibernate
- **AI / Computer Vision (Dự kiến):** Python Service (xử lý OCR, Object Detection)
- **Frontend / Client:** (Web/Mobile) giao tiếp qua HTTP/REST (JSON)

### 2.2 Kiến trúc tổng quan
Hệ thống tuân theo mô hình Client-Server, backend cung cấp các API độc lập phân chia theo Module:
- **Core Layer:** Xử lý bảo mật, ngoại lệ, cấu hình và tiện ích chung.
- **User Module:** Quản lý tài khoản, phân quyền tập trung.
- **Question Module:** Quản trị ngân hàng câu hỏi theo môn học.
- **Exam Module:** Cấu hình kỳ thi và danh sách thí sinh.
- **Session Module:** Xử lý luồng sinh mã đề, trộn đề và lưu đáp án.
- **Grading Module:** Chấm bài tự động và tính điểm.
- **External/Vision Module:** Giao tiếp với service Python để nhận diện ảnh bài làm.

---

## 3. ĐẶC TẢ TÍNH NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)

### 3.1 Quản lý Hệ thống & Người dùng
- **Xác thực & Phân quyền:** 
  - Hệ thống xác thực bằng JWT Token.
  - Hỗ trợ các vai trò: **ADMIN** (Quản lý toàn bộ hệ thống) và **STUDENT** (Chỉ được phép tham gia thi và xem kết quả cá nhân).
- **Quản lý Tài khoản:**
  - ADMIN có thể xem, thêm, sửa, xóa thông tin tài khoản thí sinh và theo dõi lịch sử thi của họ.

### 3.2 Quản lý Ngân hàng đề thi
- **Danh mục môn học:** Quản lý danh sách các môn học (Toán, Lý, Hóa, Anh...).
- **Quản lý Câu hỏi:**
  - Bổ sung, chỉnh sửa và phân loại số lượng lớn câu hỏi theo môn học.
  - Hỗ trợ thiết lập đáp án cho từng câu hỏi (chọn 1 hoặc chọn nhiều mệnh đề đúng).

### 3.3 Tổ chức Kỳ thi
- **Tạo kỳ thi:** Khai báo thông tin kỳ thi bao gồm Tiêu đề, Môn học, Thời gian làm bài, Số lượng câu hỏi và Khung giờ mở/đóng kỳ thi.
- **Phân bổ thí sinh:** Lập danh sách thí sinh được phép tham gia vào một kỳ thi cụ thể.

### 3.4 Thuật toán Trộn đề Thông minh
- **Sinh mã đề động:** Từ một tập câu hỏi gốc (Base Test) được lấy ngẫu nhiên theo môn học, hệ thống tạo ra các phiên bản đề thi khác nhau cho từng thí sinh.
- **Xáo trộn Câu hỏi:** Vị trí các câu hỏi được xáo trộn bằng thuật toán Fisher-Yates Shuffle.
- **Xáo trộn Đáp án:** Trong mỗi câu hỏi, vị trí các đáp án (A, B, C, D) cũng được xáo trộn độc lập.
- **Tính nhất quán:** Mỗi thí sinh nhận một **mã đề duy nhất**, đảm bảo không trùng lặp nhưng độ khó và nội dung kiến thức là tương đương. Lịch sử trộn đề được lưu trữ chi tiết xuống CSDL để phục vụ việc đối chiếu khi chấm thi.

### 3.5 Chấm điểm Tự động (Auto-Grading)
- **Thi Trực tuyến (Online):** 
  - Tiếp nhận toàn bộ đáp án của thí sinh khi nhấn Nộp bài.
  - Đánh giá theo nguyên tắc *Exact-set-match* (tập đáp án chọn phải khớp hoàn toàn với tập đáp án đúng đã lưu).
  - Tự động tính toán điểm số theo thang điểm 10 và lưu vào cơ sở dữ liệu.
- **Thi Ngoại tuyến (Offline):**
  - **Tích hợp Computer Vision:** Thông qua module external, hệ thống nhận ảnh chụp định dạng Phiếu trả lời trắc nghiệm (Answer Sheet).
  - Tự động quét mã đề, nhận diện vị trí các ô trống được tô/khoanh của thí sinh.
  - Map tọa độ ánh xạ vào cơ sở dữ liệu, đối chiếu với ma trận mã đề đã sinh sẵn và trả về kết quả số điểm chính xác.

### 3.6 Kết xuất & Số hóa Tài liệu
- **Xuất file PDF:** 
  - Hỗ trợ biên dịch và trích xuất các mã đề (sau khi tráo) kèm theo file ma trận đáp án tương ứng ra định dạng PDF chuẩn chỉnh.
  - Sẵn sàng dùng cho in ấn phục vụ công tác tổ chức thi trực tiếp (offline).

---

## 4. MÔ HÌNH CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)
Hệ thống bao gồm các bảng dữ liệu cốt lõi:
1. `users`: Thông tin người dùng (id, name, account, role).
2. `subjects`: Danh mục môn học.
3. `questions` & `answers`: Lưu thông tin ngân hàng câu hỏi gốc và đáp án đi kèm.
4. `exams` & `exam_participants`: Cấu hình kỳ thi và danh sách tham dự.
5. `exam_sessions`: Quản lý các phiên thi của từng thí sinh, trạng thái phòng thi.
6. `exam_questions` & `exam_answers`: **Bảng quan trọng** lưu trữ trạng thái sắp xếp thứ tự câu hỏi và đáp án của từng mã đề cụ thể.
7. `user_answers` & `user_answer_selections`: Lưu vết bài làm/vị trí lựa chọn của thí sinh.
8. `results`: Ghi nhận số điểm và thời gian nộp bài thành công.

---

## 5. YÊU CẦU CHI TIẾT DÀNH CHO FRONTEND (UI/UX & TƯƠNG TÁC)

Để đảm bảo chất lượng sản phẩm đầu cuối và mang lại trải nghiệm người dùng (UX) tối ưu, đội ngũ Frontend (sử dụng React, Tailwind CSS, Vite) cần tuân thủ các đặc tả cụ thể dưới đây:

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

### 5.2 Giao diện Quản trị (Admin Dashboards - Phân hệ Quản lý)
- **Thao tác danh sách dữ liệu (Data Grid & Tables):**
  - Các trang như Quản lý Thí sinh, Kho Câu hỏi, Kỳ thi phải có Bảng dữ liệu (Table) tích hợp sẵn tính năng theo dõi trạng thái, Lọc (Filter) theo môn học/trạng thái, Tìm kiếm (Debounce Search) và Phân trang (Pagination) chuẩn xác kết nối từ API.
- **Form nhập liệu mở rộng (Dynamic Forms):** 
  - Tại trang Quản lý Câu hỏi (`QuestionManagement`), Form nhập đề cần linh hoạt (Dynamic Field Array) để thêm/xóa Số lượng Đáp án (A, B, C, D, E...).
  - Buộc ứng dụng Validation chặt chẽ: cảnh báo nếu giáo viên chưa tick chọn đáp án đúng cho một câu hỏi.
  - Nên tích hợp các bộ gõ/Trình soạn thảo văn bản nhỏ (Rich Text Editor) để hỗ trợ in đậm, nghiêng, hoặc rèn công thức Toán học cơ bản.
- **Trực quan hóa Dữ liệu (Thống kê - `ExamReports`):**
  - Sử dụng các thư viện biểu đồ web (như Recharts, Chart.js) để trực quan hóa điểm số, tỷ lệ đỗ/trượt, v.v., cung cấp cái nhìn tổng quan nhất cho nhà quản lý.

### 5.3 Bảo mật, Điều hướng & Trạng thái Toàn cục (State/RBAC)
- **Bảo vệ luồng truy cập (Protected Routes):** 
  - Component `ProtectedRoute` phải kiểm tra chính xác `Role` lưu trong JWT. Nếu người dùng là `STUDENT` cố gắng truy cập route `/admin/*`, điều hướng ngay về `Unauthorized` (Lỗi 403) hoặc trang chủ đăng nhập.
- **Quản lý Token & Xử lý lỗi (API Interceptors):**
  - Khởi tạo Axios Interceptors (ở `api/axiosClient.ts`) tự động đính kèm `Bearer Token` vào mọi request.
  - Đón đầu mọi lỗi 401 (Mất Authentication): Tự động Clear cache, đá văng người dùng về trang đăng nhập `Login.tsx` kèm theo thông báo "Phiên đăng nhập đã hết hạn".
- **Visual Feedback UI (Trải nghiệm người dùng tương tác):**
  - Bắt buộc phải có Loading Spinner hoặc Skeleton Loading Screen khi chuyển trang hoặc chờ fetch dữ liệu API.
  - Hiển thị Toast Message / Snackbar tại tất cả các thao tác hành động như Tạo thêm, Xóa, Cập nhật thành công hay Lỗi gọi API.  

---

## 6. TẦM NHÌN & KHẢ NĂNG MỞ RỘNG (ROADMAP)

Hệ thống được thiết kế với kiến trúc linh hoạt, tập trung vào việc số hóa hoàn toàn nền tảng giáo dục với ứng dụng AI:

1. **Trích xuất dữ liệu tự động với OCR / Object Detection:**
   - Xây dựng tính năng cho phép giáo viên tải lên hình ảnh hoặc cụm tệp PDF chứa các đề thi cũ.
   - Module AI/Vision sẽ tự động nhận diện vùng văn bản, bóc tách riêng rẽ câu hỏi và đáp án, phân loại và import tự động vào CSDL (Quy trình "không chạm").
2. **Dashboard Thống kê (Analytics):** Cung cấp các biểu đồ đánh giá chất lượng độ khó câu hỏi, học lực của thí sinh biểu diễn qua phổ điểm.
3. **Giám sát kỳ thi Online (Proctoring/Monitoring):** 
   - Tích hợp giám sát thời gian thực bằng WebSocket.
   - Các cơ chế chống gian lận trình duyệt, theo dõi tab hiện hành.

---
*Tài liệu đặc tả này là cơ sở để đội ngũ phát triển, kiểm thử và thiết kế tham chiếu trong quá trình hoàn thiện sản phẩm Hệ thống Thi Trắc nghiệm Toàn diện.*