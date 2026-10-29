# Bữa ăn học đường — Frontend

Ứng dụng React + TypeScript + Vite, chỉ frontend theo yêu cầu cập nhật. Không có backend, database, đăng nhập thật hoặc gửi thông báo.

## Cập nhật Giám sát & an toàn

Giữ đúng **5 không gian**: Phụ huynh, Ban Giám hiệu, Phòng VH–XH, Bếp trung tâm và Bếp tại trường. Trong Giám sát, Bếp trung tâm mở form ghi nhận xuất bếp; BGH mở popup đối chiếu mốc xuất bếp và các form xác nhận đến trường, ra món, sẵn sàng. Không có không gian riêng cho tiếp nhận hoặc ra món. Mỗi mốc bắt buộc ảnh thực tế riêng; xuất bếp cần đủ QR, nhận thiếu/thừa cần lý do. Các form xác nhận yêu cầu đối chiếu dữ liệu trước khi lưu. Phần này thay thế mô tả cũ bên dưới về vai trò tiếp nhận/ra món và việc chỉ mốc READY cần ảnh.

Hướng dẫn, quy tắc, kiểm thử và giới hạn: [docs/SUPERVISION_WORKFLOW.md](docs/SUPERVISION_WORKFLOW.md). Dữ liệu vẫn lưu cục bộ, chưa có API hoặc migration.

## Lưu dữ liệu DEMO và cập nhật giao diện

Các form tạo/cập nhật ghi vào `localStorage` qua `src/lib/demoStorage.ts`. Sau khi ghi thành công, màn liên quan đọc lại dữ liệu trong cùng tab; các tab cùng origin cập nhật qua `storage` event. Các khóa dữ liệu cũ được giữ nguyên, không reset bản ghi đã tạo. Trường, ngày phục vụ và một trong 5 không gian đang chọn được lưu riêng tại `demo-ui-context-v1` và khôi phục khi tải lại; thay đổi không gian ở tab khác không ép đổi không gian của tab đang dùng.

Áp dụng cho các luồng đã có: tiến trình/xác nhận bữa ăn, thực đơn/danh mục bếp/món đề xuất, QR, hồ sơ bếp, phản ánh/phản hồi, nhà cung cấp, phiếu kho và nhân sự/phân ca. Thành phần đang mở được bổ sung đăng ký làm mới cho các danh sách liên quan. Đây là lưu trữ DEMO của trình duyệt, không phải database hoặc xác thực thật.

Thử nhanh: tạo nhà cung cấp hoặc phản ánh → xem bản ghi xuất hiện → tải lại trang để xem lại. Mở cùng danh sách ở tab thứ hai trước khi tạo để kiểm tra đồng bộ. Phải dùng cùng trình duyệt/profile và cùng URL origin (scheme, hostname, port); `localhost` khác `127.0.0.1`, cổng 5173 khác 5174. Xóa dữ liệu trình duyệt sẽ mất dữ liệu cục bộ.

Kiểm thử: `npm.cmd exec playwright test tests/demo-storage.spec.ts tests/supervision-workflow.spec.ts`. Bao gồm tạo mới, lưu qua reload, đồng bộ hai tab, giữ ngữ cảnh và lỗi quota. Không có API/migration mới; rollback bằng revert source, không cần xóa các khóa nghiệp vụ đã lưu.

## Chạy

### Luồng kho thống nhất

Vào **Quản lý kho** trong không gian BGH / Bếp trung tâm / Bếp tại trường. Phòng VH–XH chỉ xem. Không thêm không gian mới.

1. **Nhập kho** → Thêm phiếu nhập → chọn kho, nhà cung cấp, hàng hóa, đơn vị và lô/hạn dùng → **Lưu tạm** hoặc **Lưu phiếu nhập**. Phiếu lưu tạm không cộng tồn; bấm **Hoàn thành phiếu nhập** ở danh sách để ghi sổ.
2. **Xuất kho** → Thêm phiếu xuất → chọn đúng kho/mặt hàng, nhập lượng, người nhận và mục đích → Lưu tạm hoặc Hoàn thành. Khi hoàn thành, kiểm tra lại tồn khả dụng; chặn vượt tồn, lô hết hạn, lô không thuộc kho. Nếu không chọn lô, tự phân bổ các lô còn hạn theo FEFO rồi đến phần chưa định danh lô.
3. **Tồn kho** → tìm mặt hàng → **Chi tiết**. Popup có 5 tab: Theo kho, Theo lô / hạn dùng, Lịch sử nhập xuất, Điều chỉnh, Truy xuất nguồn gốc. Tổng tồn, giữ chỗ, hết hạn và khả dụng tách riêng; link chứng từ mở đúng danh sách nguồn. Popup có focus bàn phím, cuộn bảng và responsive.
4. **Chuyển kho** dùng biểu mẫu nhiều dòng đã có: kiểm tra tồn, kho/lô, đơn vị; bản nháp không ghi sổ. Hoàn thành giảm kho nguồn và tăng kho nhận cùng một snapshot, giữ liên kết lô.

**Lưu trữ và chuyển dữ liệu:** nghiệp vụ mới dùng `demo-warehouse-stock-book-v2`, chứa số dư, lô, phiếu nhập/xuất/chuyển, version và audit DEMO. Mỗi lần ghi lưu một snapshot để tránh ghi phiếu thành công nhưng số dư thất bại. Kiểm tra version trước lưu, không ghi sổ lại phiếu đã hoàn thành, cập nhật các tab cùng origin. Đây vẫn không phải transaction/khóa liên tab hoặc audit bất biến của backend.

Các khóa `demo-warehouse-*` cũ được đọc làm **số dư chuyển tiếp** khi chưa có sổ v2; phiếu lịch sử được giữ để xem, không tự cộng/trừ lại. `demo-inventory-movements` của module đã gỡ được giữ nguyên để đối soát, không tự nhập vào sổ mới vì khác mã hàng/kho. `src/lib/inventory.ts` còn phục vụ dữ liệu truy xuất/định lượng legacy, không còn màn tác nghiệp riêng. Dữ liệu JSON hỏng sẽ báo lỗi và giữ nguyên, không tự reset.

**Thay đổi source:** gỡ `src/InventoryPanel.tsx`; cập nhật điều hướng ở `src/App.tsx`, `src/Admin.tsx`, `src/lib/store.ts`, `src/CentralKitchenRoleDashboard.tsx`. Logic ghi sổ mới: `packages/domain/warehouse-stock.ts`; lịch sử lô/chuyển: `packages/domain/stock-detail.ts`. UI: `src/WarehouseManagement.tsx`, `src/WarehouseReceiptEntry.tsx`, `src/WarehouseIssueEntry.tsx`, `src/WarehouseDialog.tsx`, `src/StockDetail.tsx`, `src/WarehouseManagement.css`; tái sử dụng `src/WarehouseTransferEntry.tsx` và domain chuyển kho.

**Kiểm tra:** `npm.cmd test` và `npm.cmd exec playwright test tests/warehouse-flow.spec.ts tests/demo-storage.spec.ts`; bổ sung `warehouse-stock.test.ts`, `warehouse-flow.spec.ts` và đổi kiểm tra lưu kho sang key v2 trong `demo-storage.spec.ts`. Kiểm tra nhập/xuất nháp và hoàn thành, FEFO, quy đổi đơn vị, xuất vượt tồn, hạn dùng/giữ chỗ, chuyển hai kho, popup cập nhật xuyên tab, reload, lỗi quota, dữ liệu cũ/hỏng, quyền chỉ đọc; responsive 375/390/430/768/1024/1440px và axe sáng/tối. Ảnh QA: `docs/screenshots/warehouse-unified-stock-{desktop,mobile,dark}.png`.

Không có HTTP API hoặc SQL migration mới. Nếu rollback source, sao lưu key v2 trước; các thay đổi mới không được tự ghi ngược vào định dạng cũ. Chưa triển khai production, chưa có định danh kho theo tài khoản thật, đối soát tự động lịch sử cũ hoặc quy trình hủy hàng hết hạn. Các E2E legacy mô tả module Xuất nhập tồn và các không gian đã gỡ không nằm trong bộ nghiệm thu mới này.

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
- Quản lý bếp trung tâm: trong **Thực đơn & bữa ăn**, quản lý hồ sơ bếp trung tâm được phân công và lập bản nháp thực đơn ngày/tuần; mỗi món phải gắn đúng bếp chuẩn bị. Các vai trò bếp trung tâm khác chỉ xem theo quyền. Mốc xuất bếp vẫn được ghi nhận riêng tại tiến trình.
- Nhân viên tiếp nhận tại trường: chỉ cập nhật mốc `ARRIVED` sau khi bếp trung tâm đã xuất bếp; không ghi thay mốc xuất bếp, ra món hoặc xác nhận của BGH.
- Nhân viên ra món: cập nhật tuần tự `PLATED` và `READY`; chỉ `READY` bắt buộc ảnh thực tế; không sửa thực đơn hoặc xác nhận thay BGH.
- Ban Giám hiệu: duyệt thực đơn và xác nhận các mốc đã được vai trò tác nghiệp báo cáo; không trực tiếp tạo mốc xuất bếp/đến trường/ra món.
- Trang tổng quan có CTA dẫn thẳng tới tiến trình: nhóm bếp/tiếp nhận/ra món thấy **Cập nhật tiến trình suất ăn**; BGH thấy **Xem & xác nhận tiến trình**; Phòng VH–XH thấy **Xem tiến trình suất ăn**. Phụ huynh không có CTA tác nghiệp.
- QR từng suất bếp trung tâm: phát hành đúng một token opaque cho mỗi suất, in nhãn QR, thu hồi/cấp lại có lịch sử và mở trang truy xuất public allowlist. Mốc xuất bếp bị chặn nếu số QR hoạt động không khớp số suất thực xuất. Toàn bộ vẫn là dữ liệu DEMO cục bộ.
- Bếp nấu tại trường: trong **Thực đơn & bữa ăn**, quản lý danh mục bếp `ON_SITE` của đúng trường và lập bản nháp thực đơn ngày/tuần; ghi nhận ra món/sẵn sàng và phiếu nhập/xuất vẫn thực hiện ở đúng khu vực tác nghiệp.
- Thực đơn & bữa ăn: BGH quản lý được cả hai mô hình; quản lý bếp trung tâm chỉ thao tác `CENTRAL_KITCHEN`, bếp tại trường chỉ thao tác `ON_SITE`. Danh mục bếp lưu mã, tên, người phụ trách, công suất, trạng thái và trường được gắn. Thực đơn lưu mô hình phục vụ, bếp chuẩn bị, trạng thái `DRAFT` và `version`; nút **Lên thực đơn ngày** áp dụng một ngày, **Lên thực đơn tuần** tạo mẫu cho bảy ngày rồi cho phép chỉnh từng ngày. Phòng VH–XH và các vai trò không có quyền tiếp tục chỉ đọc.
- Nguồn gốc và Giám sát (mọi vai trò liên quan): dùng chung component hiển thị với bản phụ huynh để trạng thái công khai không bị lệch. BGH/bếp có dải giải thích quyền và liên kết sang khu vực tác nghiệp; Phòng VH–XH chỉ đọc theo trường trong địa bàn. Ảnh chờ duyệt, bản scan và chứng từ nội bộ không xuất hiện trong phần dùng chung.
- Phòng VH–XH: giám sát thực đơn và tiến trình bữa ăn theo từng trường trong địa bàn, đối chiếu trạng thái, xem xuất–nhập–tồn và tải CSV minh họa; không có quyền sửa thực đơn, số suất hoặc định lượng.
- Quản lý nhà cung cấp: 6 bản ghi seed DEMO, KPI công nợ, tìm kiếm/lọc, phân trang, export CSV và CRUD lưu localStorage. BGH/bếp được thao tác; Phòng VH–XH chỉ đọc.
- Quản lý kho: 7 tab Tổng quan, Tồn kho, Nhập kho, Xuất kho, Chuyển kho, Lô hàng/Serial và Truy xuất nguồn gốc. Module `Xuất nhập tồn` riêng đã được gỡ; URL cũ chuyển sang `/quan-ly-kho`. Các nghiệp vụ mới dùng một sổ kho DEMO chung, phiếu nhập/xuất/chuyển hoàn thành mới thay đổi số dư. KPI và biểu đồ lấy từ sổ hiện có, không tự tạo chuỗi tăng trưởng hoặc serial.
- Chi tiết tồn kho (bảng Tồn kho → Chi tiết): 5 tab Theo kho, Theo lô / hạn dùng, Lịch sử nhập xuất, Điều chỉnh, Truy xuất nguồn gốc. Tồn khả dụng = tồn thực tế − tồn lô hết hạn − giữ chỗ hợp lệ (không âm); lịch sử chỉ lấy từ phiếu nhập/xuất/chuyển DEMO đã hoàn thành; điều chỉnh chỉ từ phiếu "Nhập điều chỉnh"/"Xuất điều chỉnh"; truy xuất theo mã lô, thiếu liên kết thì ghi "Chưa có dữ liệu liên kết". Quy tắc tính nằm ở `packages/domain/stock-detail.ts`.
- Dữ liệu lưu trong localStorage trên cùng trình duyệt. Không nhập dữ liệu cá nhân hoặc hồ sơ thật. Xóa dữ liệu trình duyệt sẽ mất bản nháp.
- Các phân hệ quản trị, form phản ánh, thực đơn tuần, gallery và trang truy xuất QR được tải theo nhu cầu; bundle chính hiện khoảng 387 KB trước gzip.
- Ảnh mốc Sẵn sàng phục vụ: phụ huynh chỉ thấy sau khi BGH xác nhận; BGH, bếp tại trường, nhân viên ra món/tiếp nhận (đúng trường), bếp trung tâm (đúng bếp) và Phòng VH–XH (đúng địa bàn) thấy ngay tại Giám sát với nhãn "Chờ BGH xác nhận, chưa công khai cho phụ huynh" (quy tắc `canViewUnconfirmedMealPhotos` trong `packages/domain/policy.ts`). Ảnh lớn ở thẻ bữa ăn vẫn chỉ dùng ảnh đã xác nhận.
- Form tiến trình nhận tối đa 4 ảnh riêng cho mỗi mốc, ảnh gốc tối đa 5 MB và tự tối ưu thành JPEG tối đa 1 MB để lưu DEMO. Form xuất bếp hiển thị số QR/suất và cho phát hành QR ngay trong popup khi chưa có bộ QR. Chọn giấy tờ ở form legacy chỉ lưu tên file, không lưu/tải tài liệu.

## Cấu trúc

`src/App.tsx`: shell, giao diện phụ huynh, dialog, bộ chọn vai trò.
`src/Admin.tsx`: các chế độ xem tác nghiệp minh họa (lazy loaded).
`src/lib/data.ts`: nguồn dữ liệu trình duyệt, không gọi HTTP API.
`src/lib/store.ts`: Zustand cho trường/ngày/vai trò giao diện.
`src/BoardingMenuManager.tsx`, `src/lib/boardingMenu.ts`: danh mục bếp trung tâm/bếp tại trường, phân phạm vi vai trò và thực đơn ngày/tuần DEMO có version.
`src/BoardingMenuManager.tsx`, `src/lib/dates.ts`: bảng thực đơn ngày × bữa dùng thống nhất cho các vai trò. BGH/quản lý bếp thao tác theo scope; vai trò tác nghiệp liên quan và phụ huynh dùng chế độ chỉ đọc, trong đó bản phụ huynh chỉ nhận dữ liệu công khai.
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
