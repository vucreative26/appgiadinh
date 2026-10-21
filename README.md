# Nhà mình

PWA gia đình cho hai vợ chồng, ưu tiên iPhone/iPad. Vite + Preact + TypeScript, hash router, Firebase Auth/Firestore, GitHub Pages. Không gọi AI trong app.

## Chạy app

Yêu cầu Node.js 22 hoặc mới hơn.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Lần mở đầu tạo tên hiển thị và PIN 4 số ngay trên thiết bị. Những lần sau nhập PIN để mở app. Chưa có Firebase vẫn dùng được Dashboard, lịch, Kinh Dịch, Tử Vi, Giá và Share Bill sau khi mở khóa. Đi chợ / Sổ ngày yêu thương chỉ mở khi bản cài được cấp quyền, không tạo dữ liệu giả.

## Bố cục

- Thanh dưới: Trang chủ · Lịch · Dịch / Tử vi · Giá · Khác.
- Lịch có hai tab: Âm lịch và Công giáo; ngày dương luôn hiển thị để đối chiếu.
- Kinh Dịch có nhập sáu hào, ngày giờ, hai số hoặc sê-ri tiền, kèm copy đầy đủ ngữ cảnh để hỏi AI bên ngoài.
- Tử Vi có 12 cung, Mệnh/Thân/Cục, chính tinh/phụ tinh, tứ hóa, ghi chú ngắn và copy dữ liệu lá số.
- Khác có Đi chợ và Share Bill; Sổ ngày yêu thương nằm trong menu góc trên phải.
- Sáng/tối theo hệ thống khi mở lần đầu; nút mặt trăng/mặt trời ghi nhớ lựa chọn trên thiết bị.

## Kết nối Firebase không dùng email

1. Tạo project ở Firebase Console, tạo Web App để lấy Firebase web config.
2. Bật Authentication → Sign-in method → **Anonymous**. Không cần bật Google, Email/Password hoặc Phone. Không bật tự động xóa tài khoản Anonymous sau 30 ngày nếu console có lựa chọn này.
3. Tạo Firestore Database ở production mode. Chọn vị trí phù hợp trước khi tạo.
4. Sao chép `.env.example` thành `.env`, điền Firebase web config. Không thêm PIN hoặc email vào file cấu hình.
5. Build và mở app trên địa chỉ sẽ dùng thật. Với iPhone/iPad: cài lên màn hình chính trước, rồi mở bản cài đó.
6. Tạo tên hiển thị (VD Chồng/Vợ) và PIN 4 số. Vào Cài đặt → **Đăng ký thiết bị này** → **Copy mã thiết bị**. App tạo tài khoản Anonymous và hiện UID. UID không phải PIN.
7. Thay các UID mẫu trong `firestore.rules` bằng UID thật của bản cài đã tin cậy. Dán **toàn bộ** Rules vào Firebase Console → Firestore → Rules → Publish. Hoặc dùng Firebase CLI khi đã đăng nhập tài khoản quản trị project.
8. Trong app nhấn **Kiểm tra quyền**. Chỉ kết quả đọc trực tiếp từ server được phép xác nhận một máy mới đã được duyệt.
9. Lặp lại trên bản cài của người còn lại hoặc iPad. Mỗi bản cài có thể có UID riêng. Chạy lại Vite/build sau khi thay `.env`; sửa whitelist trong Rules không đòi build lại app.

Có thể chuẩn bị file Rules bằng lệnh sau (chỉ sửa file ở máy, **chưa publish**):

```sh
npm run devices -- UID_THAT_MAY_1 UID_THAT_MAY_2
```

Lệnh thay toàn bộ danh sách cho phép: phải truyền cả UID cũ muốn giữ. Hướng dẫn từng bước: [Thiết lập thiết bị](docs/THIET-LAP-THIET-BI.md).

PIN kiểm tra bằng PBKDF2/SHA-256, salt ngẫu nhiên riêng mỗi bản cài, không lưu mã gốc hay gửi lên Firebase. Sau mỗi 5 lần sai phải đợi, tăng từ 30 giây đến tối đa 5 phút; số lần sai giữ qua tải lại. Mặc định app tự khóa sau 5 phút chạy nền; quay lại trước thời hạn sẽ dùng tiếp. Cài đặt cho chọn khóa ngay / 30 giây / 1 phút / 5 phút / 15 phút. Khi iOS tạm dừng timer, app kiểm tra lại thời hạn lúc trở về. Tải lại hoặc mở phiên mới vẫn cần mở khóa. Có nút Khóa app và đổi PIN bằng PIN hiện tại. Khóa app dừng listener Firestore và gỡ giao diện dữ liệu chung. PIN là khóa giao diện, **không mã hóa Firestore cache hoặc thay thế quyền truy cập server**. Giới hạn thử PIN ở client không chống được người đã kiểm soát mã nguồn/bộ nhớ máy.

Không cần service account JSON, mật khẩu Google, OTP hay token ghi repo trong frontend. Firebase web config công khai trong bundle là bình thường; quyền đọc/ghi nằm ở Rules.

Firestore dùng persistentLocalCache + persistentMultipleTabManager. Chỉ cấp quyền UID của thiết bị gia đình tin cậy. Rules yêu cầu provider Anonymous và UID nằm trong whitelist; mọi thiết bị Anonymous khác vẫn bị từ chối. Giữ nguyên ba collection dữ liệu ban đầu, không tạo collection xin quyền có thể tự duyệt. Khi ngoại tuyến, máy từng được server duyệt có thể dùng cache và xếp hàng thao tác; máy mới không được tự cấp quyền. Khi có mạng, kiểm tra lại quyền, kiểm tra định kỳ và xử lý permission-denied từ listener. Thu hồi quyền xóa trạng thái duyệt cục bộ, dừng listener và gỡ dữ liệu khỏi giao diện. Dữ liệu cache trên máy đã truy cập không tự biến mất chỉ vì đổi Rules từ xa. Hai máy sửa cùng trường: Firestore áp dụng lần ghi cuối.

## GitHub Pages

1. Tạo repository và đưa source lên nhánh `main`. Chưa có repository/remote được gắn với thư mục này.
2. Settings → Pages → Source: **GitHub Actions**.
3. Settings → Secrets and variables → Actions → Variables: thêm các biến `VITE_FIREBASE_*` như `.env.example`. Không cần biến email/PIN. Workflow cũng chấp nhận Actions Secrets cùng tên.
4. Workflow `deploy.yml` tự xác định base path, lấy giá, chạy test, build và deploy bằng artifact. Không cần token cá nhân trong source.
5. Mở URL Pages trên từng bản cài, tạo PIN, đăng ký UID và cấp quyền trong Firestore Rules. UID của localhost không thay thế UID của app đang chạy trên Pages. Khi đổi tên miền, Safari hoặc bản cài PWA có thể cần cấp quyền lại.

Lịch chạy ở phút **17 mỗi hai giờ**, tránh đầu giờ đông tải. GitHub có thể trễ hoặc bỏ lượt; repository công khai không hoạt động 60 ngày có thể bị tắt lịch. Bật lại ở Actions nếu cần. Có thể bấm Run workflow bất cứ lúc nào. Workflow không commit `prices.json` hoặc lịch sử. Không cam kết dịch vụ miễn phí luôn hoạt động.

## Giá thực và lịch sử

```sh
npm run prices
```

Nguồn đã kiểm tra thành công trong lần phát triển 20/10/2026:

Từ bản sửa 21/10/2026, trình duyệt gọi trực tiếp PNJ khi mở Dashboard/trang Giá, bấm **Làm mới**, khi có mạng lại và mỗi 5 phút trong lúc màn hình đó còn mở. API PNJ đã được kiểm tra CORS từ trình duyệt. File `prices.json` trên Pages là dữ liệu dự phòng và nguồn USD/lịch sử, không còn là cách duy nhất cập nhật vàng. Nếu nguồn trực tiếp lỗi hoặc thiếu một sản phẩm, giữ riêng giá và giờ nguồn của sản phẩm đó; nhãn phân biệt **Đã đối chiếu nguồn**, **Bản giá lưu**, **Giá đã cũ**. Giờ đối chiếu là giờ gọi nguồn, còn giờ nguồn là giờ PNJ thực sự niêm yết. Không ghi đè giá mới hơn bằng file hoặc phản hồi cũ hơn.

- **PNJ chính thức**: `https://edge-api.pnj.io/ecom-frontend/v1/get-gold-price?zone=00`; dự phòng cùng dữ liệu qua `https://edge-cf-api.pnj.io`. Vùng TP.HCM. SJC lấy dòng `SJC`; PNJ lấy dòng `PNJ` (Phượng Hoàng), không đánh đồng với nhẫn trơn `N24K`.
- PNJ trả nghìn đồng/chỉ; nhân **10.000** để chuẩn hóa đồng/lượng. Luôn giữ rõ loại sản phẩm và nguồn.
- **Vietcombank chính thức**: `https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx`, lấy USD mua tiền mặt và bán, không giả hai giá từ một tỷ giá trung tâm. Nguồn yêu cầu không gọi thường hơn 5 phút; workflow chỉ gọi mỗi hai giờ.
- XML SJC trực tiếp đã trả **403** tại thời điểm kiểm tra. Có parser dự phòng nhưng chưa xác minh được dữ liệu thực từ nguồn này. Hai endpoint PNJ là dự phòng hạ tầng, không phải hai nguồn dữ liệu độc lập.
- Giá thế giới để `null`.

Script kiểm tra định dạng, giới hạn giá, thời điểm nguồn; không lấy thời điểm chạy script giả làm thời điểm báo giá. Mỗi loại giá có updatedAt riêng. Giá cũ hơn 6 giờ được đánh dấu.

Trên Actions, `PRICES_URL` trỏ về JSON đang chạy trên Pages để nối lịch sử. Giữ tối đa 84 điểm trong 7 ngày. Nguồn lỗi thì giữ giá cũ cùng thời điểm cũ; lỗi một nguồn không xóa dữ liệu nguồn còn lại. Lần đầu hoàn toàn không có dữ liệu thì hiển thị chờ nguồn, không tạo giá mẫu. `public/prices.json` được gitignore và không được service worker cache như giá hiện hành.

Tính giá trị bán lại vàng bằng **giá mua vào của tiệm**. Số chỉ và giá vốn lưu localStorage của thiết bị, không đồng bộ. Giá này chỉ tương ứng đúng sản phẩm nêu trong bảng.

## Lịch, quẻ và Tử Vi

- Lịch âm theo công thức thiên văn Hồ Ngọc Đức, UTC+7. Nguồn thuật toán: https://www.informatik.uni-leipzig.de/~duc/amlich/calrules.html . Giới hạn giao diện 1900–2100. Test các mốc Tết 2025/2026/2027 và kiểm tra hai chiều toàn bộ ngày trong khoảng này; phép đổi hai chiều không thay thế đối chiếu lịch thiên văn độc lập.
- Ngày giỗ: tháng thiếu dời ngày 30 về 29 có ghi chú; tháng nhuận mặc định về tháng thường, tùy chọn ưu tiên tháng nhuận nếu năm đó có. Tìm cả cuối năm âm trước vì có thể nằm trong tháng 1 dương hiện tại.
- Lịch Công giáo là **lịch tổng quát**: Computus Gregorian, mùa phụng vụ, chu kỳ A/B/C và I/II, danh sách lễ cố định cơ bản. Chưa xử lý đầy đủ ưu tiên/chuyển lễ, lễ địa phương và toàn bộ lịch thánh nhân. Đối chiếu [HĐGM Việt Nam](https://hdgmvietnam.com/) hoặc lịch giáo phận. Không sao chép bài đọc.
- Kinh Dịch: thượng/hạ quái theo Tiên Thiên Càn 1…Khôn 8; dư 0 lấy 8, hào dư 0 lấy 6. Đánh số hào từ dưới lên. Quẻ hỗ lấy hào 2–4 và 3–5. Quẻ biến đảo đồng thời các hào động (0–6 khi nhập tay hoặc ba đồng xu; Mai Hoa theo số/ngày giờ có một hào động). Với thời gian, dùng chi năm âm + tháng âm + ngày âm, thêm chi giờ cho hạ quái và hào động. Giờ Tý muộn giữ ngày đã chọn, tháng nhuận dùng cùng số tháng. Sê-ri bỏ ký tự không phải số và tách hai nửa làm hai số; đây là quy ước app, không phải một chuẩn duy nhất. Thư viện có đủ 64 quẻ với diễn nghĩa quái từ tiếng Việt, cổ văn quái từ/Thoán/Đại tượng và 384 hào từ. Nạp giáp, Thế–Ứng, Lục thân/Lục thú, Phục thần và bản Copy chi tiết được mô tả cùng quy ước và giới hạn trong [docs/KINH-DICH.md](docs/KINH-DICH.md).
- Tử Vi dùng [iztro](https://github.com/SylarLong/iztro) (MIT), lazy load khi vào tab. Dương lịch được chuyển sang âm Việt Nam trước khi đưa vào engine bằng byLunar/withOptions. Kiểm tra engine giữ đúng ngày âm, từ chối khi không khớp. Engine vẫn dùng lịch nội bộ của nó cho các bước liên quan; chưa chứng minh tương đương tất cả trường phái Việt Nam, nhất là ngày ranh giới. Quy tắc mặc định, năm đổi mùng 1 Tết, giờ Tý muộn giữ ngày; cho chọn cách xử lý tháng nhuận. Không coi đây là lá số đã được chuyên gia nghiệm thu. Luận giải ngắn theo chính tinh và một số phụ tinh, không phải tổng luận đầy đủ.
- Phần **Xem ngày giờ / lọc ngày tốt theo việc và tuổi** trong bản đặc tả ban đầu chưa triển khai; cần chốt nguồn bảng tra trước khi bảo đảm kết quả. Can Chi và tiết khí cơ bản đã có trong lịch.

## Share Bill và riêng tư

Nhóm tối đa 10 người. Chia đều, tỷ lệ hoặc số tiền cụ thể. Tiền VND nguyên; phân bổ phần dư theo phần thập phân lớn nhất để bảo toàn tổng. Tìm phương án số lần chuyển ít nhất bằng tìm kiếm có cắt nhánh, không chỉ ghép tham lam.

Chỉ giữ dữ liệu Share Bill trong biến module của trang. Không Firestore, localStorage, sessionStorage hay URL. Chuyển mục trong cùng phiên còn dữ liệu; tải lại trang hoặc kết thúc phiên trang sẽ mất. Nút “Chia xong, xóa hết” xóa chủ động. Clipboard chỉ được ghi sau khi nhấn Copy.

## Offline và cập nhật

Service worker cache shell và tài nguyên cơ bản. Các module tính năng, bộ dữ liệu quẻ và bộ Tử Vi tải khi mở tính năng, được cache để lần sau dùng offline. **Lần đầu phải mở tính năng khi có mạng**; không hứa một tính năng chưa từng tải sẽ mở được ngoại tuyến. Giá và đồng bộ cần mạng. Không tự reload app đang có phiên Share Bill khi phát hiện bản mới; đóng/mở lại sau khi chia xong để nhận bản mới.

Safari → Chia sẻ → Thêm vào Màn hình chính để cài PWA. Cần URL HTTPS thật để nghiệm thu cài đặt trên iPhone/iPad; localhost của máy tính không phải URL truy cập từ điện thoại.

## Kiểm chứng và việc cần nghiệm thu tiếp

`npm test`: kiểm thử lunar, catholic, memorials, money, oracle, astrology, parser giá, PIN, tạo whitelist UID và các luồng phê duyệt/thu hồi quyền thiết bị. Các bài quyền thiết bị dùng Firebase SDK mock để mô phỏng server cho phép, từ chối, ngoại tuyến và kết quả đến muộn khi app đã khóa; chưa thay thế test Rules trên emulator/server thật. `npm run build`: TypeScript + build + service worker.

Firebase web config đã được nhập vào `.env` cục bộ. Chưa nghiệm thu Anonymous Auth/Rules trên project thật, hai máy đồng bộ, cài PWA trên Safari thật hoặc lịch Actions. Cần bật Anonymous, lấy UID của từng bản cài thật, publish Rules và có repo GitHub để triển khai. Không cần cung cấp email, mật khẩu hoặc PIN. Cần thêm lá số mẫu/nguồn quy tắc nếu muốn xác minh Tử Vi theo trường phái riêng.

### Mở khóa bằng Face ID / Touch ID

Cài đặt → Face ID / Touch ID → nhập PIN hiện tại → Bật → Tiếp tục và xác nhận trên máy. Dùng WebAuthn với khóa nền tảng, xác minh người dùng bắt buộc; app kiểm tra challenge, origin, RP ID và chữ ký ES256 bằng khóa công khai đã lưu. Hệ điều hành chọn Face ID, Touch ID hoặc mã khóa máy. App không nhận khuôn mặt/vân tay. Khi app khóa, chạm nút mở bằng thiết bị hoặc nhập PIN. Đổi PIN làm mất hiệu lực liên kết cũ; bật lại nếu muốn.

Cần HTTPS và trình duyệt có WebAuthn (Safari cập nhật trên iPhone/iPad); thiết lập riêng trong bản cài đang dùng. Việc tắt trong app chỉ xóa liên kết cục bộ, không xóa passkey khỏi trình quản lý mật khẩu của hệ điều hành. Đây là khóa giao diện cục bộ như PIN, không thay Firebase Auth/Rules hoặc mã hóa cache. Chưa kiểm thử Face ID trên iPhone thật; bộ kiểm thử dùng chữ ký P-256 thật để kiểm tra xác minh và các phản hồi sai.

### Sổ ngày yêu thương và lịch âm chi tiết

Sổ ngày giỗ được mở rộng thành Sổ ngày yêu thương: sinh nhật, kỷ niệm, ngày giỗ, ngày tùy chọn; lọc theo bên vợ/chồng và nhánh nội/ngoại; hỗ trợ ngày âm/dương, nhắc trong app hằng năm/hằng tháng/một lần. Dữ liệu cũ giữ ID và được đọc là giỗ âm hằng năm, chưa phân bên vợ/chồng. Giữ route #/giong và collection memorials để tương thích.

**Trước khi ghi trường mới, cập nhật riêng khối Rules memorials trong Firebase Console** theo [hướng dẫn](docs/SO-NGAY-YEU-THUONG.md) và [đoạn Rules](docs/so-ngay-yeu-thuong.rules.txt), giữ nguyên allowed() và UID đang dùng. Chưa tự triển khai Rules mới lên server. Thêm/chỉnh biểu mẫu chỉ báo thành công khi server xác nhận; lỗi quyền giữ nội dung để thử lại.

Lịch hiển thị giờ Can Chi UTC+7, sáu giờ hoàng đạo theo bảng truyền thống, con giáp ngày, tháng đủ/thiếu, pha trăng xấp xỉ và một số dịp âm lịch. Không tự tạo điểm phần trăm tốt/xấu, màu hoặc số may mắn từ ngày âm. Bộ kiểm thử bao gồm sinh nhật 29/2, ngày 31 hằng tháng, tháng âm nhuận, dữ liệu cũ và tuần lịch giáp tháng.
