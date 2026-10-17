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

- Phụ huynh: chọn 3 trường, ngày/lịch tuần; bữa ăn, ảnh phóng to, nguồn gốc minh họa, timeline hai mô hình, gửi góp ý hoặc phản ánh và xem lại.
- Nút tài khoản góc trên phải mở bộ chọn không gian DEMO: Phụ huynh / BGH / Bếp trung tâm / Phòng VH–XH. Đây là chuyển giao diện, không phải xác thực hay cơ chế bảo mật.
- BGH: sửa thực đơn/số suất bản nháp, ghi nhận mốc có ảnh, mô phỏng xác nhận, thêm thông tin giấy tờ, phản hồi ý kiến cục bộ.
- Bếp: ghi nhận xuất bếp với ảnh; các bước nhận hàng/ra món thuộc chế độ xem trường; phản ánh chỉ đọc.
- VH–XH: tổng quan, tìm/lọc trường, xem chi tiết và tải CSV minh họa.
- Dữ liệu lưu trong localStorage trên cùng trình duyệt. Không nhập dữ liệu cá nhân hoặc hồ sơ thật. Xóa dữ liệu trình duyệt sẽ mất bản nháp.
- Ảnh sự kiện giới hạn 4 ảnh, mỗi ảnh 1 MB. Chọn giấy tờ chỉ lưu tên file, không lưu/tải tài liệu.

## Cấu trúc

`src/App.tsx`: shell, giao diện phụ huynh, dialog, bộ chọn vai trò.
`src/Admin.tsx`: các chế độ xem tác nghiệp minh họa (lazy loaded).
`src/lib/data.ts`: nguồn dữ liệu trình duyệt, không gọi HTTP API.
`src/lib/store.ts`: Zustand cho trường/ngày/vai trò giao diện.
`src/index.css`, `src/App.css`, `src/Admin.css`: tokens và giao diện responsive/dark mode.
`packages/domain`: logic quy trình thuần TypeScript và kiểm thử; không phải backend.
`tests`: kiểm thử trình duyệt và axe.
`docs/screenshots`: ảnh chụp QA.

Ảnh minh họa thực phẩm: Unsplash, https://images.unsplash.com/photo-1547592180-85f173990554, lưu tại `public/meal-demo.jpg`. Không phải ảnh báo cáo thực tế.

## Giới hạn

Quyền giao diện chỉ dùng mô phỏng. Không cung cấp bảo mật dữ liệu, xác minh giấy phép, chữ ký chính thức, upload server, QR truy xuất thật, thông báo Zalo hoặc quy trình vận hành production. Không triển khai hosting/production. Chưa kiểm thử trong runtime Zalo thực tế.
