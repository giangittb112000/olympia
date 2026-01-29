# GIỌT DẦU VÀNG - PVOIL Vũng Áng Game Show

Hệ thống điều khiển Game Show theo phong cách "Đường Lên Đỉnh Olympia", được phát triển dành riêng cho PVOIL Vũng Áng.

## 🚀 Tính năng chính

- **4 Vòng thi đầy đủ**: Khởi động, Vượt chướng ngại vật, Tăng tốc, Về đích.
- **Hệ thống phân quyền**: MC Dashboard, Màn hình Người chơi, Màn hình Monitor (Khán giả).
- **Tính năng thời gian thực**: Sử dụng Socket.io đồng bộ hóa mọi hành động.
- **Video hướng dẫn**: Tự động phát hướng dẫn từng vòng từ MC Dashboard.

## 📖 Mô tả & Luật chơi

Chương trình gồm 4 vòng thi đầy kịch tính: KHỞI ĐỘNG, VƯỢT CHƯỚNG NGẠI VẬT, TĂNG TỐC, và VỀ ĐÍCH.

### 1. Vòng KHỞI ĐỘNG

- Mỗi thí sinh sẽ trải qua phần thi cá nhân trong vòng **60 giây**.
- Trả lời đúng được **10 điểm**, sai không bị trừ điểm.
- MC là người đọc câu hỏi và xác nhận kết quả Trả lời Đúng/Sai hoặc Bỏ qua.

### 2. Vòng VƯỢT CHƯỚNG NGẠI VẬT

- Mục tiêu: Tìm ra t khóa chướng ngại vật (CNV) ẩn dưới 4 mảnh ghép hình ảnh.
- Có **4 hàng ngang** chứa gợi ý liên quan đến CNV.
- **Quy trình**:
  1. MC chọn hàng ngang bất kỳ.
  2. Các thí sinh có **15 giây** suy nghĩ và trả lời trên trường quay.
  3. Hết giờ, MC công bố đáp án và chấm điểm.
  4. Trả lời đúng hàng ngang: **+10 điểm** và mở một góc hình ảnh + gợi ý hàng ngang.
- **Trả lời CNV**:
  - Thí sinh có thể bấm chuông trả lời CNV bất cứ lúc nào (trừ lúc đang đọc câu hỏi hàng ngang).
  - Trả lời đúng trước hàng ngang 2: **+80 điểm**.
  - Trả lời đúng trước hàng ngang 3: **+60 điểm**.
  - Trả lời đúng trước hàng ngang 4: **+40 điểm**.
  - Trả lời đúng sau gợi ý cuối cùng: **+20 điểm**.
  - Trả lời **SAI** CNV sẽ bị **LOẠI** khỏi vòng thi này.

### 3. Vòng TĂNG TỐC

- Gồm **4 câu hỏi** dạng hình ảnh/video với độ khó tăng dần (30 giây suy nghĩ).
- Thí sinh trả lời bằng cách nhập đáp án nhanh nhất có thể.
- **Điểm số dựa trên tốc độ**:
  - Nhanh nhất: **+40 điểm**.
  - Nhanh nhì: **+30 điểm**.
  - Nhanh ba: **+20 điểm**.
  - Nhanh tư: **+10 điểm**.
  - Trả lời sai: 0 điểm.

### 4. Vòng VỀ ĐÍCH

- Là vòng thi quyết định, thí sinh chọn gói câu hỏi (**40, 60, hoặc 80 điểm**).
- Mỗi gói gồm 3 câu hỏi với điểm số khác nhau (10, 20, 30 điểm).
- **Luật chơi**:
  - Thí sinh đang thi trả lời đúng: Ghi điểm tương ứng.
  - Thí sinh trả lời sai: Các thí sinh còn lại có quyền **BẤM CHUÔNG GIÀNH QUYỀN TRẢ LỜI**.
    - Giành quyền đúng: **+ Điểm câu hỏi** (lấy từ quỹ điểm người đang thi).
    - Giành quyền sai: **- 50% điểm câu hỏi** (trừ điểm người bấm chuông).
- **Ngôi sao hy vọng**: Thí sinh có thể đặt ngôi sao hy vọng 1 lần trước khi nghe câu hỏi.
  - Đúng: **X2 điểm câu hỏi**.
  - Sai: **- Số điểm câu hỏi**.

## 🌐 Chế độ mạng LAN (Local Area Network)

Dự án này được thiết kế để chạy trong mạng nội bộ. Để các thiết bị (điện thoại người chơi, máy tính monitor) có thể kết nối:

1.  **Chung một mạng**: Tất cả thiết bị phải kết nối vào cùng một WiFi hoặc mạng LAN.
2.  **Lấy địa chỉ IP máy chủ (Server IP)**:
    - **Trên Mac**: Mở Terminal gõ `ipconfig getifaddr en0`.
    - **Trên Windows**: Mở CMD gõ `ipconfig`, tìm dòng _IPv4 Address_ (thường là `192.168.1.x`).
3.  **Cấu hình biến môi trường**:
    - Mở file `.env`, gán IP vừa tìm được vào `NEXT_PUBLIC_SOCKET_URL`.
    ```env
    NEXT_PUBLIC_SOCKET_URL=http://192.168.x.x:3000
    ```

## 📋 Yêu cầu hệ thống

- Node.js 18+
- Docker (để chạy MongoDB)

## ⚙️ Hướng dẫn cài đặt

1. **Cài đặt thư viện**: `npm install`
2. **Cấu hình .env**: Tạo file `.env` với nội dung (thay IP của bạn):
   ```env
   MONGODB_URI=mongodb://localhost:27017/olympia
   NEXT_PUBLIC_SOCKET_URL=http://192.168.x.x:3000
   ```
3. **Chạy Cơ sở dữ liệu**: `docker compose up -d`
4. **Khởi động dự án**: `npm run dev`

Truy cập tại: `http://192.168.x.x:3000` (Thay IP tương ứng).

## 📽 Lưu ý về Video hướng dẫn

Do giới hạn 100MB của GitHub, video hướng dẫn không được lưu trên repo. Bạn cần:

1. Copy video vào thư mục `public/videos/`.
2. Đặt tên đúng: `vong-1.mp4`, `vong-2.mp4`, `vong-3.mp4`, `vong-4.mp4`.

## 📝 Giấy phép

Dự án nội bộ PVOIL Vũng Áng.
