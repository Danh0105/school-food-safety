# Báo cáo QA frontend

Ngày: 17/10/2026. Phạm vi: frontend minh họa, không backend.

## Kết quả
- `npm.cmd run build`: đạt (TypeScript strict và Vite).
- `npm.cmd test`: 9/9 đạt, quy trình hai mô hình và logic vai trò thuần TypeScript.
- `npm.cmd run test:e2e`: 7/7 đạt trên Edge headless.
- axe WCAG 2 A/AA: không ghi nhận vi phạm tự động ở trang chủ phụ huynh và tổng quan VH–XH trong các bài test.
- Responsive không tràn ngang toàn trang: 375, 390, 430, 768, 1024, 1440px. Bảng dữ liệu quản trị có vùng cuộn ngang riêng.
- Ảnh chụp: `docs/screenshots/home-*.png`, `dark-mobile.png`, `ward-desktop.png`, `ward-mobile.png`.

## Luồng đã kiểm tra
Chọn trường; xem lịch tuần và đổi ngày; tab nguồn gốc/giám sát; drawer di động; dark mode; gửi góp ý và lưu lại sau reload; đổi không gian BGH/bếp/VH–XH; chỉnh thực đơn và số suất phản ánh lại ở view phụ huynh; xuất bếp có ảnh minh họa; bếp không có nút nhận hàng hộ trường; tải CSV theo chế độ xem.

## Files chính
`src/App.tsx`, `src/Admin.tsx`, `src/lib/data.ts`, `src/lib/store.ts`, `src/index.css`, `src/App.css`, `src/Admin.css`, `packages/domain/policy.ts`, `packages/domain/policy.test.ts`, `tests/*.spec.ts`, `playwright.config.ts`, `vite.config.ts`, `package.json`, `package-lock.json`, `public/meal-demo.jpg`, `public/favicon.svg`, `index.html`, `README.md`, `IMPLEMENTATION_PLAN.md`.

Không có API/migration/database thay đổi còn lại: mã backend và dependencies thử nghiệm đã gỡ theo yêu cầu chỉ frontend.

## Giới hạn
- Bundle chính khoảng 588 KB trước gzip (~185 KB gzip); module quản trị đã lazy load. Vite còn cảnh báo kích thước chunk.
- Chưa kiểm tra Zalo runtime, Lighthouse hoặc máy di động vật lý. axe không thay thế kiểm tra accessibility thủ công đầy đủ.
- Không có xác thực/phân quyền thật. localStorage không phù hợp dữ liệu cá nhân và không đồng bộ giữa thiết bị.
- Upload ảnh là đọc file trên trình duyệt; giấy tờ chỉ lưu tên và metadata. Không có quét mã độc hoặc lưu trữ máy chủ.
- Không tuyên bố bản frontend này hoàn thành toàn bộ nghiệp vụ M01–M08 vận hành thực tế.

## Cập nhật hình ảnh và bảng màu
Đã thêm 9 ảnh phối cảnh do người dùng cung cấp tại `public/images/canteen/`, sử dụng ảnh toàn cảnh ở hero và bộ sưu tập `src/CanteenGallery.tsx`. Ảnh giữ nguyên nội dung và luôn gắn nhãn phối cảnh minh họa. Bảng màu đổi sang cobalt/navy, nền kem và điểm nhấn vàng cam; cập nhật light/dark mode, favicon và theme-color. Các ảnh không được dùng như ảnh bữa ăn hay bằng chứng xác nhận.

Build đạt; 7/7 E2E và axe hiện có đạt sau cập nhật màu. Kiểm tra bổ sung trên trình duyệt: mở bộ sưu tập, ảnh tiếp, phím mũi tên, Escape và không tràn ngang ở 390px. Ảnh chụp `cobalt-gallery-desktop.png`, `cobalt-gallery-mobile.png`.

## Mobile theo giao diện ứng dụng
Đã bổ sung `src/MobileNavigation.tsx` và `src/MobileApp.css`, cập nhật shell trong `src/App.tsx`.
- Thanh tab 5 mục cố định; vai trò quản trị có Vận hành/Thực đơn/Thêm.
- Header sticky, chọn ngày nhanh, thẻ nội dung tối ưu điện thoại, segmented navigation sticky.
- Form/tài khoản/chi tiết mở dạng bottom sheet bằng native dialog; hỗ trợ Escape và focus mặc định của dialog.
- Khoảng đệm đáy, safe-area, input 16px để hạn chế zoom form trên iOS, reduced-motion.
- Desktop giữ bố cục hiện tại; frontend-only, không API/migration.

Kiểm chứng: build đạt; 8/8 Playwright tests đạt, gồm tab mobile, bảng tài khoản bám đáy và footer không bị thanh tab che. Responsive 375–1440px không tràn ngang. axe trên mobile 390px sáng/tối không có vi phạm WCAG A/AA tự động. Chưa kiểm tra thiết bị thật/Zalo runtime. Ảnh mới: `mobile-app-390.png`, `mobile-app-light-390.png`, `mobile-app-dark-390.png`.

## React Bits
Đã tích hợp mã nguồn TypeScript chính thức từ https://reactbits.dev/ và https://github.com/DavidHDev/react-bits:
- CountUp: số liệu phụ huynh/quản trị chuyển số trong 650 ms.
- SpotlightCard: ánh sáng vàng nhẹ trên hero trường, không chạy ambient loop.
- ClickSpark: sáu tia nhỏ khi bấm/chạm thẻ chỉ số; tự dừng khi bật reduced-motion, kể cả thay đổi tùy chọn trong lúc trang mở.

Mã nguồn và giấy phép giữ tại `src/components/react-bits/`, cấu hình giao diện ở `integration.css`. Dùng Motion hiện có, không thêm thư viện hiệu ứng mới. Không đổi backend hoặc dữ liệu.

Kiểm thử: 8/8 E2E hiện có đạt sau tích hợp; kiểm tra bổ sung touch navigation, counter khi đổi trường, dừng/xóa canvas khi chuyển reduced-motion và không có lỗi JavaScript đạt. Build TypeScript/Vite đạt. Bundle chính khoảng 626 KB trước gzip; vẫn có cảnh báo chunk lớn như trước.

## Popup căn giữa
Theo yêu cầu mới, popup mobile (tài khoản, form, ngày, chi tiết, ảnh và quản trị) chuyển từ bottom sheet sang modal căn giữa ngang/dọc. Giữ lề an toàn, giới hạn chiều cao và cuộn nội dung; bỏ thanh kéo ở đầu sheet. Sửa `src/MobileApp.css` và cập nhật kiểm thử vị trí dialog trong `tests/parent.spec.ts`. Build đạt; kiểm thử popup tài khoản mobile kiểm tra tọa độ tâm, điều hướng và khoảng đệm thanh tab.

## Sửa lỗi popup lô nguyên liệu ở góc trái trên
Đã tái hiện desktop 1440px: dialog có x=0, y=0 và margin=0 do reset CSS. Bản sửa trước chỉ căn giữa trong media query mobile. Đã đặt `position: fixed; inset: 0; margin: auto` vào quy tắc dialog chung trong `src/App.css`. Kiểm thử hồi quy đúng popup “Thông tin lô nguyên liệu DEMO” trên 390/768/1440px kiểm tra tâm ngang/dọc và nút đóng. Build đạt.
