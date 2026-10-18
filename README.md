# Bữa ăn học đường — Frontend

Ứng dụng React + TypeScript + Vite, chỉ frontend theo yêu cầu cập nhật. Không có backend, database, đăng nhập thật hoặc gửi thông báo.

## Chạy

```powershell
npm.cmd install
npm.cmd run dev
```

Mở URL Vite hiển thị (mặc định http://localhost:5173).

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e
```

E2E dùng Microsoft Edge có sẵn trên Windows (`channel: msedge`). Nếu dùng hệ điều hành khác, đổi channel trong `playwright.config.ts` và cài browser phù hợp.

## Trải nghiệm

- Phụ huynh: chọn 3 trường; xem đồng thời thực đơn đủ 7 ngày và mở chi tiết từng ngày; xem ảnh phóng to, nguồn gốc minh họa, timeline hai mô hình, hồ sơ kiểm tra công khai DEMO, gửi góp ý hoặc phản ánh và xem lại.
- Truy xuất DEMO: 4 lô nguyên liệu có nguồn gốc khai báo, thời gian giao nhận, kiểm tra đầu vào, món liên kết và metadata chứng từ công khai; không cung cấp bản scan hoặc dữ liệu nhạy cảm.
- Nút tài khoản góc trên phải mở bộ chọn không gian DEMO: Phụ huynh / BGH / Bếp trung tâm / Phòng VH–XH. Đây là chuyển giao diện, không phải xác thực hay cơ chế bảo mật.
- BGH: sửa thực đơn/số suất bản nháp, ghi nhận mốc có ảnh, mô phỏng xác nhận, thêm thông tin giấy tờ, phản hồi ý kiến cục bộ và xem xuất–nhập–tồn đúng trường.
- Bếp trung tâm: ghi nhận xuất bếp với ảnh và tạo phiếu nhập/xuất cho kho được gán; không xem số tồn hoặc báo cáo kho.
- QR từng suất bếp trung tâm: phát hành đúng một token opaque cho mỗi suất, in nhãn QR, thu hồi/cấp lại có lịch sử và mở trang truy xuất public allowlist. Mốc xuất bếp bị chặn nếu số QR hoạt động không khớp số suất thực xuất. Toàn bộ vẫn là dữ liệu DEMO cục bộ.
- Bếp nấu tại trường: lựa chọn riêng cho mô hình `ON_SITE`, ghi nhận ra món/sẵn sàng và phiếu nhập/xuất đúng kho trường; không xem báo cáo tồn.
- Phòng VH–XH: giám sát thực đơn và tiến trình bữa ăn theo từng trường trong địa bàn, đối chiếu trạng thái, xem xuất–nhập–tồn và tải CSV minh họa; không có quyền sửa thực đơn, số suất hoặc định lượng.
- Dữ liệu lưu trong localStorage trên cùng trình duyệt. Không nhập dữ liệu cá nhân hoặc hồ sơ thật. Xóa dữ liệu trình duyệt sẽ mất bản nháp.
- Ảnh sự kiện giới hạn 4 ảnh, mỗi ảnh 1 MB. Chọn giấy tờ chỉ lưu tên file, không lưu/tải tài liệu.

## Cấu trúc

`src/App.tsx`: shell, giao diện phụ huynh, dialog, bộ chọn vai trò.
`src/Admin.tsx`: các chế độ xem tác nghiệp minh họa (lazy loaded).
`src/lib/data.ts`: nguồn dữ liệu trình duyệt, không gọi HTTP API.
`src/lib/store.ts`: Zustand cho trường/ngày/vai trò giao diện.
`src/PortionQrPanel.tsx`, `src/PortionTracePage.tsx`, `src/lib/portionQr.ts`: vertical slice QR riêng từng suất ăn.
`src/index.css`, `src/App.css`, `src/Admin.css`: tokens và giao diện responsive/dark mode.
`packages/domain`: logic quy trình thuần TypeScript và kiểm thử; không phải backend.
`tests`: kiểm thử trình duyệt và axe.
`docs/screenshots`: ảnh chụp QA.
`docs/PORTION_QR.md`: ERD, migration PostgreSQL và API đích cho QR từng suất.

Ảnh minh họa thực phẩm: Unsplash, https://images.unsplash.com/photo-1547592180-85f173990554, lưu tại `public/meal-demo.jpg`. Không phải ảnh báo cáo thực tế.

## Giới hạn

Quyền giao diện chỉ dùng mô phỏng. Không cung cấp bảo mật dữ liệu, xác minh giấy phép, chữ ký chính thức, upload server, QR truy xuất thật, thông báo Zalo hoặc quy trình vận hành production. Không triển khai hosting/production. Chưa kiểm thử trong runtime Zalo thực tế.
