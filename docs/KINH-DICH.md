# Kinh Dịch: cấu trúc, nội dung và quy ước

## Phạm vi

- Hiện đồng thời quẻ gốc, hỗ và biến. Quẻ tĩnh không tạo quẻ biến khác.
- Mai Hoa: ngày giờ, hai số, sê-ri; một hào động. Nhập tay và ba đồng xu: 0–6 hào động.
- Thư viện 64 quẻ: lời tham khảo, diễn nghĩa quái từ tiếng Việt, cổ văn quái từ, Thoán truyện, Đại tượng và 384 hào từ. Gợi ý vị trí hào được ghi riêng, không mạo nhận là bản dịch hào từ.
- Nạp giáp, tám cung, Thế–Ứng, Lục thân, Lục thú, Phục thần, Tuần không, Nguyệt phá, Nhật xung, Nguyệt hợp; quan hệ ngũ hành và hồi đầu sinh/khắc.
- Dụng thần do người dùng chọn; liệt kê Nguyên/Kỵ/Cừu theo hành, không tự chọn câu hỏi thay người dùng.
- Copy bao gồm câu hỏi, cách gieo, thời gian, quy ước, bảng sáu hào, hào biến, Phục thần, phân tích và cổ văn của các quẻ liên quan. Không gọi API AI.

## Quy ước tính

Hào 1 nằm dưới; bit thấp nhất là hào 1; dương = 1, âm = 0. Các hào động được đảo đồng thời. Quẻ hỗ dùng 2–3–4 cho nội quái và 3–4–5 cho ngoại quái. Nhiều hào động không tự rút thành một hào hoặc gán Thể–Dụng Mai Hoa kiểu một hào động.

Ba đồng xu: người dùng chọn một mặt bằng 2, mặt kia bằng 3; giữ quy ước suốt sáu lần. Tổng 6 = âm động, 7 = dương tĩnh, 8 = âm tĩnh, 9 = dương động. Lần đầu nhập vào hào 1.

Bát cung Kinh Phòng dùng mặt nạ biến `0, 1, 3, 7, 15, 31, 23, 16`. Thế lần lượt ở hào `6, 1, 2, 3, 4, 5, 4, 3`; Ứng cách ba hào. **Lục thân quẻ biến vẫn quy theo hành cung gốc**, không đổi sang hành cung biến. Các hào quẻ biến không tương ứng hào động được ghi là tham chiếu.

Phục thần lấy cùng vị trí ở quẻ bát thuần của cung, chỉ lấy những nhóm Lục thân thiếu trong chính quẻ. Phi–Phục được mô tả bằng quan hệ ngũ hành; chưa kết luận xuất phục.

Thời gian Việt Nam UTC+7; đổi ngày 00:00, giờ Tý bắt đầu 23:00 và giữ ngày đã chọn. Năm Lục hào theo Lập Xuân, Nguyệt kiến theo tiết khí. Kinh độ Mặt Trời dùng thuật toán xấp xỉ của module lịch; trong khoảng 0,04 độ quanh giao tiết, giao diện và prompt yêu cầu đối chiếu giờ giao tiết. Riêng phép lập Mai Hoa theo thời gian vẫn dùng chi năm âm, tháng âm, ngày âm như trước.

Vượng/Tướng/Hưu/Tù/Tử chỉ biểu thị quan hệ hành với tháng, không phải điểm tổng hợp. Cờ Nhật xung không tự kết luận ám động. App chưa tự luận toàn hệ tam hợp, tam hình, tiến thoái thần, mộ tuyệt, ám động hay ứng kỳ; các giới hạn này ghi trong Kiến thức và prompt.

## Nội dung và nguồn

- [Chu Dịch trên Wikisource](https://zh.wikisource.org/wiki/周易): đối chiếu quẻ, hào, Bát cung.
- [Bản chép cổ văn trong ZHOUYI](https://github.com/bollwarm/ZHOUYI/blob/master/lib/ZHOUYI.pm): chỉ trích phần cổ văn thuộc phạm vi công cộng, không dùng mã Perl hoặc lời bình hiện đại. Dữ liệu lưu trong `src/data/iching-classic.json`. Có dị bản và lỗi chép có thể còn tồn tại; chưa tuyên bố hiệu đính toàn bộ.
- [Bốc Phệ Toàn Thư, Cấn cung](https://eee-learning.com/book/1665): bảng Nạp giáp, Thế–Ứng và Lục thân cổ.
- [Khởi Lục thần quyết](https://www.shidianguji.com/zh/mingju/7623585340431319091): phép khởi theo can ngày.

Diễn nghĩa tiếng Việt và phần liên hệ thực hành do app biên soạn. Đây không phải bản dịch học thuật hoặc dịch đầy đủ 384 hào từ sang tiếng Việt. Bản sao chép yêu cầu AI dịch nghĩa từng hào liên quan và phân biệt bản dịch với lời bình.

Nhập lại cổ văn khi cần: tải bản nguồn vào vị trí tạm rồi chạy `node scripts/import-iching-classic.mjs <đường-dẫn-bản-nguồn>`. Script kiểm tra đủ 64 mục, mỗi mục sáu hào, quái từ, Thoán và Đại tượng. Cần xem diff và kiểm thử trước khi cập nhật dữ liệu.

## Đối chiếu

Ví dụ ảnh: Hỏa Thủy Vị Tế, hào 2 động → Hỏa Địa Tấn; hỗ là Thủy Hỏa Ký Tế. Cung Ly/Hỏa, Tam thế, Thế 3, Ứng 6. Từ hào 1: Mậu Dần Phụ mẫu, Mậu Thìn Tử tôn, Mậu Ngọ Huynh đệ, Kỷ Dậu Thê tài, Kỷ Mùi Tử tôn, Kỷ Tỵ Huynh đệ. Phục thần: Kỷ Hợi Quan quỷ dưới hào 3. Hào 2 biến thành Ất Tỵ/Hỏa, vẫn là Huynh đệ theo cung gốc.

Kiểm thử bao phủ bảng cung đủ 64 quẻ, mọi tổ hợp 64 quẻ × 64 mẫu hào động, quy tắc ba đồng xu, ngày Giáp Tý 2000-01-07, tháng trước/sau Lập Xuân, Can Chi, Lục thú, đủ 384 hào từ và nội dung prompt.
