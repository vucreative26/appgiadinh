# Cập nhật Sổ ngày yêu thương

Ngày giỗ cũ vẫn nằm trong collection memorials, không đổi ID, không xóa hay di chuyển dữ liệu. Mục cũ được đọc là ngày giỗ âm lịch hằng năm; chưa phân bên vợ/chồng. Chỉnh từng mục để chọn nhánh chính xác. Các trường lunarDay/lunarMonth được giữ tên để tương thích dữ liệu cũ; trường calendar quyết định cách hiểu ngày/tháng.

## Cập nhật Firestore qua web (một lần)

1. Mở Firebase Console → App Gia Đình → Firestore → Rules.
2. Giữ nguyên function allowed() và toàn bộ danh sách UID thiết bị đang được duyệt.
3. Chỉ chọn khối bắt đầu từ match /memorials/{id} { đến dấu } đóng khối đó, ngay trước match /{document=**}.
4. Thay riêng khối này bằng toàn bộ nội dung file docs/so-ngay-yeu-thuong.rules.txt trong repo GitHub, rồi Publish. Khối này vẫn gọi allowed() hiện có.
5. Sau khi GitHub Actions triển khai xong, tải lại app, thử thêm một ngày yêu thương. Nếu báo permission-denied, kiểm tra khối đã Publish và UID máy.

Không thay toàn bộ Rules bằng bản mẫu có UID_THIET_BI_1; không thay function allowed bằng allow true. Bản sửa không mở quyền cho thiết bị mới. Chưa triển khai Rules lên Firebase Console từ môi trường này.

## Quy tắc nhắc ngày

- Lịch dương: hằng năm, hằng tháng hoặc một lần. 29/2 hằng năm nhắc 28/2 trong năm không nhuận. Ngày 31 hằng tháng nhắc ngày cuối tháng nếu tháng đó ngắn hơn. Ngày một lần phải hợp lệ đúng năm.
- Lịch âm UTC+7: ngày 30 gặp tháng thiếu nhắc ngày 29 khi lặp; một lần phải có ngày tương ứng thật. Hằng năm giữ lựa chọn tháng nhuận như cũ; hằng tháng nhắc cả tháng thường và tháng nhuận.
- Chọn Nội/Ngoại thuộc bên vợ hoặc chồng; có thêm Gia đình chung và Chưa phân bên vợ/chồng cho dữ liệu cũ.
- Dashboard liệt kê các dịp trong 30 ngày tới, lịch đánh dấu cả ô đầu/cuối tháng lân cận. Không gửi thông báo nền.
- App chỉ đóng biểu mẫu và báo đã lưu sau khi Firebase xác nhận. Nếu mất mạng, thao tác chờ kết nối; nếu từ chối quyền, biểu mẫu giữ nội dung để sửa/thử lại.

## Chi tiết lịch âm

Hiển thị thứ, ngày/tháng/năm Can Chi, con giáp ngày, số ngày trong tháng âm, pha trăng xấp xỉ, tiết khí, giờ Can Chi và sáu giờ hoàng đạo. Tra giờ theo ngày đang chọn, UTC+7; đổi ngày dân sự lúc 00:00. Giờ Tý là hai đoạn ở đầu/cuối ngày. Tháng Can Chi ở màn lịch tính theo tháng âm; phần lập quẻ dùng tháng tiết khí.

Bảng giờ truyền thống dùng nhóm chi ngày, đối chiếu ví dụ công khai tại https://giohoangdao.vn/ (19/10/2026 Bính Dần: Tý, Sửu, Thìn, Tỵ, Mùi, Tuất), tham khảo dự án lịch https://github.com/de-men/amlich . Không hiển thị điểm phần trăm ngày tốt, màu trang sức, số may mắn hoặc gợi ý cắt tóc khi chưa có nguồn/quy tắc cụ thể. Đây không phải các đại lượng thiên văn hoặc xác suất có thể tự suy ra từ ngày âm.

Đã kiểm thử thuật toán trong bộ test; chưa kiểm thử Rules mới trên Firebase emulator/server và chưa xác nhận đồng bộ các trường mới giữa hai máy thật.
