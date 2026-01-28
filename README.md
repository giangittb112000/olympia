# GIỌT DẦU VÀNG - PVOIL Vũng Áng Game Show

Hệ thống điều khiển Game Show theo phong cách "Đường Lên Đỉnh Olympia", được phát triển dành riêng cho PVOIL Vũng Áng.

## 🚀 Tính năng chính

- **4 Vòng thi đầy đủ**: Khởi động, Vượt chướng ngại vật, Tăng tốc, Về đích.
- **Hệ thống phân quyền**: MC Dashboard, Màn hình Người chơi, Màn hình Monitor (Khán giả).
- **Tính năng thời gian thực**: Sử dụng Socket.io đồng bộ hóa mọi hành động.
- **Video hướng dẫn**: Tự động phát hướng dẫn từng vòng từ MC Dashboard.

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
