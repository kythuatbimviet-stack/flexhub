# Kế hoạch Triển khai: Hệ thống Xác nhận Thanh toán (XNTT)

Tài liệu này tổng hợp lại toàn bộ logic và cấu trúc các file đã được triển khai cho tính năng gửi Email Xác nhận thanh toán (Biên nhận) cho khách hàng Eva's Fit.

## 1. Phương pháp: Gửi trực tiếp (Direct POST)

Thay vì dựa vào Webhook của Database (vốn có độ trễ và khó truyền dữ liệu tùy chỉnh), hệ thống sử dụng phương pháp **Gửi trực tiếp từ Server Action**.

### Ưu điểm:
- **Tức thì**: Email được gửi ngay khi người dùng nhấn nút.
- **Chính xác**: Sử dụng địa chỉ Email nhập từ Dialog, không bị dính dữ liệu cũ trong DB.
- **HTML Cao cấp**: Cho phép gửi nội dung HTML phức tạp (Email Premium) mà không bị giới hạn bởi độ dài cột trong database.

---

## 2. Cấu trúc Logic xử lý

### Bước 1: Thu thập dữ liệu (Trình duyệt)
Người dùng mở `PaymentConfirmationDialog`, dữ liệu được tự động điền từ hợp đồng nhưng có thể sửa đổi (đặc biệt là Email và Lời nhắn).

### Bước 2: Server Action (`send-email.ts`)
Hàm `sendPaymentConfirmationAction` thực hiện:
1. Lấy thông tin chi nhánh và URL Webhook của chi nhánh đó.
2. Tạo nội dung HTML dựa trên Template thiết kế riêng.
3. Thực hiện lệnh `fetch` (POST) trực tiếp đến Google Apps Script của chi nhánh.
4. Cập nhật trạng thái `sendemail_xntt = 'done'` vào Supabase để lưu vết.

### Bước 3: Google Apps Script Backend (`Webhook_contracts.gs`)
Hàm `doPost` nhận request:
1. Nhận diện payload có chứa `email` và `subject` (Nhánh 0 - Gửi trực tiếp).
2. Giải mã File PDF (nếu có) hoặc gửi nội dung HTML nhận được.
3. Sử dụng `GmailApp.sendEmail` để gửi tới khách hàng.
4. Log kết quả lên Telegram qua `tg_log`.

---

## 3. Danh sách File liên quan

1. **Giao diện**: `components/contracts/payment-confirmation-dialog.tsx`
2. **Logic Server**: `app/actions/send-email.ts`
3. **Logic Backend**: `scripts/Webhook_contracts.gs`
4. **Logic Log**: `scripts/Tele.gs`

---

## 4. Mẫu Email Template

Mẫu email được thiết kế theo phong cách **Premium Minimalist** của Eva's Fit:
- Font chữ: Playfair Display & DM Sans.
- Màu sắc: Salmon (#E8896A), Dark (#1C1A18), Cream (#FAF8F5).
- Cấu trúc: Header Logo -> Thông báo chào mừng -> Thẻ biên nhận chi tiết -> Tổng giá trị -> Lưu ý quan trọng.
