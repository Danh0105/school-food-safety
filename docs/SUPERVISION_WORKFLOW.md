# Cập nhật hành trình tại Giám sát & an toàn

## Phạm vi

Frontend DEMO, lưu trên cùng trình duyệt. Giám sát & an toàn và Tiến trình suất ăn dùng chung `AdminPanel` với `operationsOnly` cho màn giám sát, cùng khóa `demo-admin-meals`. Không thêm API, database hoặc migration; không cung cấp phân quyền hay timestamp server thật.

## Quy trình bữa trưa

| Mốc | Người báo cáo | Điều kiện |
| --- | --- | --- |
| Xuất bếp | Bếp trung tâm: quản lý / điều phối | Trường dùng bếp trung tâm; đủ QR đang hoạt động đúng số suất xuất |
| Đến trường | BGH trong không gian nhà trường | Form xác nhận giờ đến, số suất nhận và ảnh; bắt buộc ghi lý do nếu khác số suất xuất |
| Ra món | BGH xác nhận tại trường với CENTRAL_KITCHEN; bếp tại trường báo cáo với ON_SITE | Đã đến trường với CENTRAL_KITCHEN; đang chuẩn bị với ON_SITE |
| Sẵn sàng phục vụ | BGH xác nhận tại trường với CENTRAL_KITCHEN; bếp tại trường báo cáo với ON_SITE | Đã ra món |
| Đối chiếu mốc do bếp báo cáo | Ban Giám hiệu | Popup hiển thị thời điểm và ảnh báo cáo gốc; tích xác nhận đối chiếu rồi lưu; có thể Hủy |

Chỉ có năm không gian như trước: Phụ huynh, Ban Giám hiệu, Phòng VH–XH, Bếp trung tâm, Bếp tại trường. Các type legacy `school_receiver`/`meal_service_staff` được giữ để tương thích, không xuất hiện và không chọn được qua `setRole`. BGH không ghi nhận xuất bếp thay bếp trung tâm. Các mốc tại trường do BGH chứng thực qua form được lưu trạng thái xác nhận và lịch sử xác nhận ngay cùng bản ghi, không tạo bước tự duyệt giả.

Mỗi mốc có 1–4 ảnh thực tế riêng (JPG/PNG/WebP, ảnh gốc tối đa 5 MB/ảnh), được giải mã và tối ưu thành JPEG tối đa 1 MB để lưu DEMO. Không dùng URL nhập tay; chặn ảnh trùng trong cùng mốc hoặc đã dùng ở mốc trước. Kiểm tra ngày phục vụ, thứ tự thời điểm, số suất nguyên 1–5.000. Không tự tạo mốc hoàn tất khi chưa có dữ liệu.

Form xuất bếp hiển thị số QR đang hoạt động so với số suất đang nhập. Nếu chưa có QR, bấm **Phát hành QR cho số suất này** ngay trong form rồi tiếp tục **Lưu mốc và ảnh**; giữ nguyên thời điểm, ghi chú và ảnh đã chọn. Nếu đã có QR nhưng số lượng khác, đối chiếu số suất hoặc dùng mục QR từng suất ăn để thu hồi/cấp lại; không tự thay bộ QR cũ. Khi chưa chọn ảnh, form giải thích vì sao nút lưu chưa bật. Lỗi kiểm tra/lưu được cuộn vào vùng nhìn thấy.

Sự kiện mới lưu ID, version, idempotency key, vai trò/người thao tác DEMO, thời điểm khai báo, thời điểm trình duyệt ghi nhận, số suất, ghi chú và ảnh. Xác nhận lưu riêng danh sách `confirmations` và cập nhật projection `confirmed` của sự kiện, giữ nguyên ID/nội dung sự kiện ban đầu. Không có thao tác sửa/xóa mốc trong giao diện này.

Thay đổi phát `demo-meal-service-updated` và làm mới TanStack Query. Tab khác nhận `storage` event. Lưu kiểm tra version mới nhất trước khi ghi để phát hiện dữ liệu cũ; đây không phải transaction hoặc khóa liên tab của backend.

## Thử luồng

1. `npm.cmd run dev`, chọn Tiểu học An Phú và ngày 17/10/2026.
2. Không gian Bếp trung tâm → QR từng suất ăn → phát hành đủ QR.
3. Giám sát & an toàn → Đã xuất bếp → nhập thời điểm, số suất và ảnh minh chứng.
4. Chuyển sang Ban Giám hiệu → Giám sát → Xác nhận mốc đã xuất bếp: đối chiếu thời gian/ảnh trong popup, tích xác nhận rồi lưu hoặc Hủy.
5. Vẫn trong Ban Giám hiệu: mở form Xác nhận đến trường, nhập giờ nhận, số suất, ảnh riêng và lý do chênh lệch nếu có.
6. Tiếp tục mở form Xác nhận ra món, rồi Xác nhận sẵn sàng phục vụ; mỗi form có ảnh riêng và checkbox đối chiếu.
7. Phụ huynh xem nhật ký; ảnh sẵn sàng chỉ xuất hiện như ảnh công khai sau xác nhận.

Ngày/giờ thử phải thuộc ngày phục vụ và không nằm trong tương lai. Chỉ dùng dữ liệu, ảnh minh họa khi thử DEMO.

## Kiểm thử

- `npm.cmd test`: quy tắc chuyển trạng thái, scope, quyền, ảnh bắt buộc ở từng mốc.
- `npm.cmd exec playwright test tests/supervision-workflow.spec.ts`: luồng qua các vai trò, đồng bộ hai tab, thiếu QR, ảnh dùng lại, ảnh giả, thiếu ảnh, chênh lệch số suất, xác nhận và lưu qua reload, ảnh riêng tư; responsive 375/390/430/768/1024/1440px, axe WCAG AA desktop sáng và mobile tối.
- Ảnh QA: `docs/screenshots/supervision-workflow-desktop.png`, `docs/screenshots/supervision-workflow-{375,390,430,768,1024}.png`, `docs/screenshots/supervision-workflow-dark-390.png`.

## Giới hạn và rollback

Chưa có API/upload server, audit bất biến, phân quyền tài khoản thật, chống replay nguyên tử, thời gian server, sửa sai bằng phụ lục, thông báo hoặc cảnh báo chậm bữa tự động. `localStorage` có thể bị chỉnh bằng DevTools hoặc hết quota; không nhập dữ liệu thật. Phạm vi hiện tại là bữa trưa, chưa tách tiến trình cho từng bữa sáng/xế hoặc nhiều chuyến giao.

Không cần rollback migration. Revert các file source của thay đổi để quay lại UI cũ; các trường metadata mới là tùy chọn trong dữ liệu cục bộ. Sao lưu dữ liệu DEMO trước khi đổi phiên bản, không tự xóa dữ liệu trình duyệt.

## Báo cáo thay đổi và kết quả kiểm tra

- `src/App.tsx`: gắn khối cập nhật vào Giám sát, giữ đúng 5 không gian và làm mới cache theo sự kiện.
- `src/Admin.tsx`: dùng chung luồng cập nhật, kiểm tra dữ liệu/ảnh, lưu version và lịch sử xác nhận, đồng bộ tab.
- `src/MealJourney.tsx`: ưu tiên mốc báo cáo mới nhất trong tóm tắt; bổ sung nhãn truy cập cho QR.
- `src/lib/data.ts`: giữ ảnh của các mốc theo điều kiện công khai; bỏ nhật ký hoàn tất tự sinh.
- `src/lib/store.ts`: chỉ cho chọn 5 không gian đã có, giữ type legacy để tương thích.
- `src/Admin.css`: bố cục checkbox đối chiếu và nút Hủy/Lưu trong popup.
- `src/index.css`: đồng bộ foreground dark mode cho nội dung kế thừa màu chữ.
- `packages/domain/policy.ts`, `packages/domain/policy.test.ts`: ảnh bắt buộc theo từng mốc, bếp ON_SITE không báo ra món cho CENTRAL_KITCHEN và kiểm thử quyền/scope.
- `tests/supervision-workflow.spec.ts`: E2E cho luồng và các nhánh lỗi; thêm hồi quy ảnh gốc trên 1 MB, phát hành QR ngay trong popup, giữ dữ liệu đã nhập, lưu thành công và tải lại.
- `README.md`, tài liệu này và ảnh `supervision-workflow-*`: hướng dẫn và bằng chứng giao diện.

Kết quả: 79 unit test qua; 2 E2E mới qua; lint sạch; build thành công; không tràn ngang ở sáu kích thước đã nêu; axe không phát hiện vi phạm trong hai chế độ đã kiểm tra. Build còn cảnh báo chunk chính lớn hơn 500 KB trước gzip. Chưa chạy toàn bộ E2E cũ; không có API/migration thay đổi.

Bổ sung sửa luồng lưu xuất bếp: `src/Admin.tsx` dùng bộ giải mã/tối ưu ảnh chung tại `src/lib/feedback-images.ts`, cho phát hành QR trực tiếp trong form, hiển thị điều kiện và lỗi lưu rõ hơn; `src/Admin.css` bổ sung trạng thái QR. Kiểm tra lại: 79 unit test, 3 E2E của `supervision-workflow.spec.ts`, lint và build đều qua (vẫn có cảnh báo chunk lớn). E2E hồi quy dùng ảnh gốc trên 1 MB, phát hành QR ngay trong popup rồi lưu và reload để kiểm tra bản ghi. Không thay API/migration, không gỡ điều kiện QR hoặc thứ tự trạng thái.
