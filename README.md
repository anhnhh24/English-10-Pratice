# 🎓 EduEnglish 10 & EduMath 10 — Nền Tảng Luyện Thi Vào Lớp 10 Thông Minh

> **Hệ thống luyện thi tuyển sinh vào Lớp 10 toàn diện (Môn Toán & Tiếng Anh)** tích hợp Trí tuệ nhân tạo (Gemini AI), đồng bộ đám mây thời gian thực (Firebase Realtime Database) và hệ thống giám sát học tập sư phạm chuyên sâu.

---

## 🌟 Tính Năng Nổi Bật

### 1. 🇬🇧 📐 Song Ngữ Hai Môn Thi Trọng Tâm (Tiếng Anh & Toán)
- **Tiếng Anh 9 Vào 10**: Ngữ pháp chuyên sâu, từ vựng theo Unit SGK mới, phát âm/trọng âm, đọc hiểu, viết lại câu, tìm lỗi sai.
- **Toán 9 Vào 10**: Căn thức, phương trình bậc hai, hệ thức Vi-ét, hệ thức lượng tam giác vuông, hình học đường tròn & tứ giác nội tiếp, tự luận toán thực tế.
- **Chuyển đổi môn thi mượt mà**: Toàn bộ dữ liệu tiến độ, sổ câu sai và bảng điểm được cách ly và quản lý độc lập theo từng môn.

### 2. 🤖 Trợ Lý AI Soạn Đề & Trích Xuất File Thông Minh
- **Semantic Chunking trích xuất đề thi**: Tự động nhận diện ranh giới câu hỏi và bảng đáp án từ file Word (`.docx`), PDF và hình ảnh OCR mà không bao giờ bị tràn giới hạn token AI.
- **AI Soạn đề tự động**: Sinh đề thi chuẩn cấu trúc tuyển sinh Sở GD&ĐT theo ma trận độ khó (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) kèm lời giải chi tiết và mẹo tránh bẫy.
- **Tự động liên kết**: Mọi đề thi do AI tạo hoặc Upload sẽ tự động xuất hiện ngay trên danh sách bài tập của học sinh mà không cần chờ thao tác giao bài thủ công.

### 3. 🎯 Quản Lý Bài Tập Đang Giao & Giám Sát Học Sinh (Admin Hub)
- **Nhiệm vụ theo thời gian thực (`🎯 Bài tập đang giao`)**: Giao bài tập theo từng học sinh hoặc toàn lớp kèm lời dặn dò sư phạm, theo dõi trạng thái hoàn thành và kết quả điểm số.
- **⚡ Nhắc làm bài (Realtime Ping)**: Gửi thông báo nhắc nhở tức thời tới màn hình của học sinh.
- **Sổ tay bài làm chi tiết**: Xem lại toàn bộ bài thi đã nộp, ma trận câu đúng/sai, thời gian làm bài và phân tích năng lực.

### 4. ⚡ Cookie Persistence & Zero-Reload Reactive State Bus
- **Lưu trữ phiên bền vững**: Lưu danh tính người dùng (`edu10_uid`) và môn học (`edu10_subject`) qua Cookie (30 ngày) kết hợp `localStorage`.
- **Phản ứng tức thời (Zero-Reload)**: Sử dụng mạng lưới `CustomEvent` và `BroadcastChannel` giúp mọi thao tác chuyển đổi môn học, tạo đề thi mới hay nộp bài đều được cập nhật ngay lập tức trên mọi tab mà không cần tải lại trang.
- **Firebase Realtime DB**: Đồng bộ đa thiết bị tức thời giữa máy phụ huynh/thầy cô và máy học sinh.

### 5. 📚 Phòng Luyện Thi & Tiện Ích Học Tập
- **Thi thử chuẩn Sở**: Bấm giờ thi thật, chế độ chống gian lận phát hiện chuyển tab, tự động lưu nháp.
- **Luyện siêu tốc 10 câu (Quick Blitz)**: 10 câu hỏi ngẫu nhiên rèn phản xạ công thức trong 5 phút.
- **Sổ tay câu sai (Mistake Notebook)**: Lưu trữ các câu làm sai kèm chế độ luyện lại đến khi thành thạo.
- **Flashcard tương tác**: Flashcard từ vựng Tiếng Anh và Flashcard công thức/định lý Toán học.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS, Vanilla CSS, Lucide Icons, Canvas Confetti
- **Trí tuệ nhân tạo**: Google Gemini AI API (`@google/genai`)
- **Backend & Cloud DB**: Firebase Realtime Database
- **Xử lý tài liệu**: Mammoth (Word `.docx`), PDF.js, Tesseract.js (OCR)
- **State & Sync Bus**: React Context, BroadcastChannel API, Browser Cookies, CustomEvent Bus

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### Yêu cầu tiên quyết:
- [Node.js](https://nodejs.org/) (phiên bản 18 trở lên)
- Trình quản lý gói `npm` hoặc `bun`

### Các bước cài đặt:

1. **Cài đặt thư viện dependencies:**
   ```bash
   npm install
   ```

2. **Cấu hình biến môi trường:**
   Tạo file `.env.local` hoặc `.env` tại thư mục gốc với nội dung:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Chạy ứng dụng ở môi trường phát triển (Dev):**
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại địa chỉ `http://localhost:5173`.

4. **Biên dịch sản phẩm (Production Build):**
   ```bash
   npm run build
   ```

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
├── src/
│   ├── components/
│   │   ├── admin/           # Admin Panel, Quản lý đề, Nhiệm vụ, Giám sát
│   │   ├── common/          # Các Component dùng chung (Navbar, Modals, Badges)
│   │   └── student/         # Dashboard, ExamSimulator, TopicPractice, MistakeNotebook...
│   ├── context/
│   │   └── AppContext.tsx   # React Context quản lý toàn bộ State & Logic cốt lõi
│   ├── data/                # Ngân hàng đề thi, câu hỏi Toán & Tiếng Anh mẫu
│   ├── services/
│   │   ├── aiExamService.ts       # Dịch vụ AI Soạn đề, Semantic Chunking & OCR
│   │   ├── cloudSyncService.ts    # Đồng bộ Firebase Realtime Database
│   │   ├── cookieService.ts       # Quản lý Cookie & Reactive State Bus
│   │   ├── fileReaderService.ts   # Đọc file Word (.docx), PDF & OCR ảnh
│   │   ├── firebaseConfig.ts      # Cấu hình kết nối Firebase
│   │   └── realtimeSyncService.ts # Nhật ký hoạt động & Realtime Pings
│   ├── types.ts             # Định nghĩa Type TypeScript toàn hệ thống
│   ├── App.tsx              # Component gốc điều hướng
│   └── main.tsx             # Entry point
├── .env.example             # Mẫu cấu hình môi trường
├── package.json             # Danh sách dependencies & scripts
├── vite.config.ts           # Cấu hình Vite Build
└── README.md                # Tài liệu hướng dẫn dự án
```

---

## 🔒 Tài Khoản Đăng Nhập Mặc Định

- **Tài khoản Học sinh**: `hoangha.lop9@gmail.com` (Mật khẩu: `123`)
- **Tài khoản Giáo viên / Admin**: `admin` hoặc `admin@gmail.com` (Mật khẩu: `123`)

---

*Phát triển và tối ưu cho kỳ thi tuyển sinh vào Lớp 10 THPT.*
