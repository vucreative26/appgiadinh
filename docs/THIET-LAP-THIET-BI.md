# Dùng Nhà mình bằng PIN, không cần email

## 1. Bật đúng phương thức Firebase

Trong project **App Gia Đình**:

1. Authentication → Sign-in method (hoặc Sign-in providers).
2. Add new provider → **Anonymous** → Enable → Save.
3. Giữ Firestore Standard database `(default)` ở production mode.
4. Không bật chức năng tự động xóa tài khoản Anonymous sau 30 ngày nếu có. Không cần bật Google hoặc Email/Password để dùng app.

Việc chỉnh provider và publish Rules phải thực hiện bằng tài khoản quản trị Firebase của bạn. Người dùng app không đăng nhập email.

## 2. Tạo PIN trên bản cài dùng thật

1. Mở URL app đã triển khai bằng Safari trên iPhone/iPad.
2. Chia sẻ → Thêm vào Màn hình chính.
3. Mở Nhà mình từ biểu tượng vừa thêm.
4. Nhập tên hiển thị (Chồng/Vợ hoặc tên riêng), chọn PIN 4 số và nhập lại.
5. PIN có thể bắt đầu bằng 0. Mỗi bản cài có PIN riêng; có thể tự đặt cùng mã trên hai máy nếu muốn.

PIN không cần gửi cho ai, không đưa vào Firebase Console hay GitHub.

## 3. Đăng ký rồi cấp quyền máy

1. Trong app → Khác → Cài đặt & kết nối.
2. Nhấn **Đăng ký thiết bị này**, rồi **Copy mã thiết bị**.
3. Lấy UID của từng bản cài định cho dùng. Safari và app màn hình chính có thể không dùng chung UID. Đăng ký trên iPad riêng nếu cần.
4. Trong `firestore.rules`, tìm:

```text
request.auth.uid in ['UID_THIET_BI_1', 'UID_THIET_BI_2']
```

5. Thay các chuỗi mẫu bằng UID đã Copy, giữ dấu nháy và dấu phẩy. Muốn thêm iPad thì thêm UID vào cùng danh sách. Chỉ duyệt mã lấy từ máy của gia đình. UID không phải PIN.
6. Sao chép **toàn bộ file** `firestore.rules` đã chỉnh → Firebase Console → Firestore → Rules → dán → **Publish**.
7. Quay lại app → **Kiểm tra quyền**. Khi báo thiết bị đã được duyệt, Đi chợ và Ngày giỗ sẽ mở.

Nếu gửi UID cho người hỗ trợ để chỉnh Rules, chỉ gửi UID, không gửi PIN.

## Dùng hằng ngày

- Mở app → nhập PIN → dùng. Không có ô email, Google hoặc OTP.
- Mặc định rời app dưới 5 phút thì quay lại dùng tiếp; quá thời gian sẽ khóa. Đổi trong Cài đặt → Thời gian tự khóa. Tải lại hoặc mở phiên mới vẫn cần mở khóa. Menu góc trên có **Khóa app** để khóa ngay.
- Đổi PIN trong Cài đặt, cần PIN hiện tại. PIN mới chỉ áp dụng bản cài đang dùng.
- Sau 5 lần sai phải đợi, thời gian chờ tăng nếu tiếp tục nhập sai.
- Chuyển sang AI để dán lời luận rồi quay lại trong thời gian chờ sẽ không cần nhập PIN; quá thời gian sẽ khóa. Nội dung đã Copy vẫn ở clipboard. Share Bill giữ trong RAM khi chỉ khóa/mở lại, tải lại trang sẽ mất phiên như trước.
- Máy mới cần mạng để tạo UID và kiểm tra quyền. Máy từng được duyệt có thể dùng dữ liệu đã tải khi ngoại tuyến.

## Đổi máy, mất máy, quên PIN

- Thu hồi máy cũ: xóa UID của nó khỏi Rules → Publish. Không xóa collection dữ liệu chung.
- Máy cũ mất quyền truy cập trên mạng khi kiểm tra lại; dữ liệu đã lưu trên máy không tự bị xóa từ xa.
- Đổi máy/xóa dữ liệu Safari/cài lại có thể tạo UID mới; đăng ký và duyệt lại.
- Quên PIN: không thể đọc lại mã gốc. Sau khi chắc chắn thao tác đã đồng bộ, xóa dữ liệu app trong trình duyệt rồi tạo lại PIN, kiểm tra UID và duyệt lại nếu đổi. Việc xóa dữ liệu cục bộ có thể mất thao tác chưa đồng bộ và phiên Share Bill.
- Không xem PIN như mã hóa dữ liệu: nó khóa giao diện trên máy. Firestore Rules và danh tính đã được duyệt bảo vệ dữ liệu trên mạng.

## Face ID / Touch ID (tùy chọn)

1. Trên iPhone/iPad, mở đúng bản cài app qua HTTPS. Máy cần có khóa màn hình và Safari hỗ trợ WebAuthn.
2. Khác → Cài đặt → Face ID / Touch ID.
3. Nhập PIN hiện tại, nhấn Bật, rồi nhấn Tiếp tục để máy xác nhận.
4. Lần sau app khóa, nhấn **Mở bằng Face ID / Touch ID**. Hệ điều hành có thể chọn mã khóa máy thay cho sinh trắc học. PIN của app vẫn dùng được.

Không cần đổi Firebase Rules hay cấp UID mới. Đổi PIN app sẽ yêu cầu thiết lập lại liên kết mở khóa bằng thiết bị. Xóa dữ liệu trình duyệt cũng xóa liên kết này. Nếu iOS đóng tiến trình nền do thiếu bộ nhớ, lần mở lại là phiên mới nên vẫn cần mở khóa.
