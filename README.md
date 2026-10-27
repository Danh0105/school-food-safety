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
- Nút tài khoản góc trên mở bộ chọn không gian DEMO: Phụ huynh / BGH / Bếp trung tâm / Nhân viên tiếp nhận tại trường / Nhân viên ra món / Bếp nấu tại trường / Phòng VH–XH. Đây là chuyển giao diện, không phải xác thực hay cơ chế bảo mật.
- BGH: sửa thực đơn/số suất bản nháp, mô phỏng xác nhận từng mốc và duyệt ảnh ở bước Sẵn sàng phục vụ, thêm thông tin giấy tờ, phản hồi ý kiến cục bộ và xem xuất–nhập–tồn đúng trường.
- Bếp trung tâm: ghi nhận xuất bếp không cần ảnh và tạo phiếu nhập/xuất cho kho được gán; không xem số tồn hoặc báo cáo kho.
- Nhân viên tiếp nhận tại trường: chỉ cập nhật mốc `ARRIVED` sau khi bếp trung tâm đã xuất bếp; không ghi thay mốc xuất bếp, ra món hoặc xác nhận của BGH.
- Nhân viên ra món: cập nhật tuần tự `PLATED` và `READY`; chỉ `READY` bắt buộc ảnh thực tế; không sửa thực đơn hoặc xác nhận thay BGH.
- Ban Giám hiệu: duyệt thực đơn và xác nhận các mốc đã được vai trò tác nghiệp báo cáo; không trực tiếp tạo mốc xuất bếp/đến trường/ra món.
- Trang tổng quan có CTA dẫn thẳng tới tiến trình: nhóm bếp/tiếp nhận/ra món thấy **Cập nhật tiến trình suất ăn**; BGH thấy **Xem & xác nhận tiến trình**; Phòng VH–XH thấy **Xem tiến trình suất ăn**. Phụ huynh không có CTA tác nghiệp.
- QR từng suất bếp trung tâm: phát hành đúng một token opaque cho mỗi suất, in nhãn QR, thu hồi/cấp lại có lịch sử và mở trang truy xuất public allowlist. Mốc xuất bếp bị chặn nếu số QR hoạt động không khớp số suất thực xuất. Toàn bộ vẫn là dữ liệu DEMO cục bộ.
- Bếp nấu tại trường: lựa chọn riêng cho mô hình `ON_SITE`, ghi nhận ra món/sẵn sàng và phiếu nhập/xuất đúng kho trường; không xem báo cáo tồn.
- Thực đơn & bữa ăn (mọi vai trò tác nghiệp): dùng cùng giao diện Bữa ăn của phụ huynh (chọn ngày, thực đơn cả tuần, chi tiết món/định lượng, hành trình bữa ăn), không có nút góp ý/phản ánh; banner nêu phạm vi quyền. Chỉ BGH có nút Chỉnh bản nháp; bếp trung tâm, bếp tại trường và Phòng VH–XH chỉ xem, trong phạm vi trường được phép.
- Nguồn gốc và Giám sát (mọi vai trò liên quan): dùng chung component hiển thị với bản phụ huynh để trạng thái công khai không bị lệch. BGH/bếp có dải giải thích quyền và liên kết sang khu vực tác nghiệp; Phòng VH–XH chỉ đọc theo trường trong địa bàn. Ảnh chờ duyệt, bản scan và chứng từ nội bộ không xuất hiện trong phần dùng chung.
- Phòng VH–XH: giám sát thực đơn và tiến trình bữa ăn theo từng trường trong địa bàn, đối chiếu trạng thái, xem xuất–nhập–tồn và tải CSV minh họa; không có quyền sửa thực đơn, số suất hoặc định lượng.
- Quản lý nhà cung cấp: 6 bản ghi seed DEMO, KPI công nợ, tìm kiếm/lọc, phân trang, export CSV và CRUD lưu localStorage. BGH/bếp được thao tác; Phòng VH–XH chỉ đọc.
- Quản lý kho: 7 tab Tổng quan, Tồn kho, Nhập kho, Xuất kho, Chuyển kho, Lô hàng/Serial và Truy xuất nguồn gốc; gồm 31 mặt hàng, 16 lô, KPI/cảnh báo/biểu đồ, form chứng từ và lịch sử DEMO. Đây là module mới, không thay thế màn `Xuất nhập tồn` nghiệp vụ đã có.
- Chi tiết tồn kho (bảng Tồn kho → Chi tiết): 5 tab Theo kho, Theo lô / hạn dùng, Lịch sử nhập xuất, Điều chỉnh, Truy xuất nguồn gốc. Tồn khả dụng = tồn thực tế − tồn lô hết hạn − giữ chỗ hợp lệ (không âm); lịch sử chỉ lấy từ phiếu nhập/xuất/chuyển DEMO đã hoàn thành; điều chỉnh chỉ từ phiếu "Nhập điều chỉnh"/"Xuất điều chỉnh"; truy xuất theo mã lô, thiếu liên kết thì ghi "Chưa có dữ liệu liên kết". Quy tắc tính nằm ở `packages/domain/stock-detail.ts`.
- Dữ liệu lưu trong localStorage trên cùng trình duyệt. Không nhập dữ liệu cá nhân hoặc hồ sơ thật. Xóa dữ liệu trình duyệt sẽ mất bản nháp.
- Các phân hệ quản trị, form phản ánh, thực đơn tuần, gallery và trang truy xuất QR được tải theo nhu cầu; bundle chính hiện khoảng 387 KB trước gzip.
- Ảnh mốc Sẵn sàng phục vụ: phụ huynh chỉ thấy sau khi BGH xác nhận; BGH, bếp tại trường, nhân viên ra món/tiếp nhận (đúng trường), bếp trung tâm (đúng bếp) và Phòng VH–XH (đúng địa bàn) thấy ngay tại Giám sát với nhãn "Chờ BGH xác nhận, chưa công khai cho phụ huynh" (quy tắc `canViewUnconfirmedMealPhotos` trong `packages/domain/policy.ts`). Ảnh lớn ở thẻ bữa ăn vẫn chỉ dùng ảnh đã xác nhận.
- Ảnh tại mốc Sẵn sàng phục vụ giới hạn 4 ảnh, mỗi ảnh 1 MB. Các mốc trước không nhận ảnh. Chọn giấy tờ chỉ lưu tên file, không lưu/tải tài liệu.

## Cấu trúc

`src/App.tsx`: shell, giao diện phụ huynh, dialog, bộ chọn vai trò.
`src/Admin.tsx`: các chế độ xem tác nghiệp minh họa (lazy loaded).
`src/lib/data.ts`: nguồn dữ liệu trình duyệt, không gọi HTTP API.
`src/lib/store.ts`: Zustand cho trường/ngày/vai trò giao diện.
`src/WeeklyMenu.tsx`, `src/lib/dates.ts`: lịch thực đơn tuần dùng chung; `WeekPicker`/`MealDayDetail` trong `src/App.tsx` dùng chung cho phụ huynh (bản công khai) và trang Thực đơn & bữa ăn của các vai trò tác nghiệp.
`src/PortionQrPanel.tsx`, `src/PortionTracePage.tsx`, `src/lib/portionQr.ts`: vertical slice QR riêng từng suất ăn.
`src/SupplierManagement.tsx`, `src/lib/suppliers.ts`: danh sách và CRUD nhà cung cấp DEMO.
`src/WarehouseManagement.tsx`, `src/WarehouseManagement.css`: dashboard và 7 phân hệ quản lý kho DEMO.
`src/index.css`, `src/App.css`, `src/Admin.css`: tokens và giao diện responsive/dark mode.
`packages/domain`: logic quy trình thuần TypeScript và kiểm thử; không phải backend.
`tests`: kiểm thử trình duyệt và axe.
`docs/screenshots`: ảnh chụp QA.
`docs/PORTION_QR.md`: ERD, migration PostgreSQL và API đích cho QR từng suất.

Ảnh minh họa thực phẩm: Unsplash, https://images.unsplash.com/photo-1547592180-85f173990554, lưu tại `public/meal-demo.jpg`. Không phải ảnh báo cáo thực tế.

Ảnh `public/meal-ready-demo.webp` do người dùng cung cấp, được tối ưu thành asset web và chỉ gắn với mốc `READY` trong dữ liệu DEMO. Ảnh không phải kết luận an toàn thực phẩm.

## Giới hạn

Quyền giao diện chỉ dùng mô phỏng. Không cung cấp bảo mật dữ liệu, xác minh giấy phép, chữ ký chính thức, upload server, QR truy xuất thật, thông báo Zalo hoặc quy trình vận hành production. Không triển khai hosting/production. Chưa kiểm thử trong runtime Zalo thực tế.
