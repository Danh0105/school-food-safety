# QR truy xuất riêng cho từng suất ăn bếp trung tâm

## Quy tắc nghiệp vụ

- Chỉ áp dụng khi `MealService.serviceMode = CENTRAL_KITCHEN`.
- Mỗi suất thực xuất có một `MealPortion` và đúng một QR `ACTIVE`. Không dùng một QR chung cho cả chuyến hoặc cả trường.
- QR chứa duy nhất URL với token opaque ngẫu nhiên tối thiểu 128 bit; không chứa tên, lớp, mã học sinh, số điện thoại, ID nội bộ hay URL file riêng tư.
- Trước chuyển `PREPARING → DISPATCHED`, backend khóa bản ghi bữa ăn và kiểm tra `activeQrCount = actualServings`, token và số thứ tự suất đều duy nhất.
- Thu hồi/cấp lại tạo audit event; không sửa/xóa âm thầm token cũ. Token bị thu hồi chỉ trả trạng thái thu hồi, không trả chuỗi truy xuất.
- Trang công khai chỉ serialize allowlist thông tin đã được phép công khai. Có rate limit, cache ngắn và không trả chứng từ/file private.
- QR đầy đủ chỉ chứng minh khả năng truy xuất của suất; không phải kết luận suất ăn “an toàn”.

## ERD bổ sung

```text
MealService 1 ─── * MealPortion
MealService 1 ─── * PortionQrBatch
PortionQrBatch 1 ─── * QrPublicToken
MealPortion 1 ─── * QrPublicToken
QrPublicToken 1 ─── * PortionQrEvent (append-only)

MealService * ─── * ProductBatch (qua MealIngredientBatch)
```

`MealPortion` không liên kết với học sinh. Nó chỉ đại diện cho một suất vật lý trong một bữa/ca cụ thể.

## Migration PostgreSQL dự kiến

Repo hiện chưa có backend/ORM nên đây là migration đích, chưa được áp dụng vào database.

```sql
create table meal_portions (
  id uuid primary key,
  meal_service_id uuid not null references meal_services(id),
  ordinal integer not null check (ordinal > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references users(id),
  version integer not null default 1,
  unique (meal_service_id, ordinal)
);

create table portion_qr_batches (
  id uuid primary key,
  meal_service_id uuid not null references meal_services(id),
  quantity integer not null check (quantity between 1 and 5000),
  idempotency_key varchar(128) not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references users(id),
  unique (meal_service_id, idempotency_key)
);

create table portion_qr_tokens (
  id uuid primary key,
  meal_portion_id uuid not null references meal_portions(id),
  batch_id uuid not null references portion_qr_batches(id),
  public_token_hash bytea not null unique,
  -- Chỉ cần nếu hỗ trợ in lại; mã hóa envelope bằng KMS, không dùng làm khóa lookup.
  public_token_ciphertext bytea,
  state varchar(16) not null check (state in ('ACTIVE','REVOKED')),
  issued_at timestamptz not null default now(),
  issued_by uuid not null references users(id),
  version integer not null default 1
);

create unique index uq_active_qr_per_portion
  on portion_qr_tokens(meal_portion_id) where state = 'ACTIVE';

create table portion_qr_events (
  id uuid primary key,
  qr_token_id uuid not null references portion_qr_tokens(id),
  event_type varchar(24) not null check (event_type in ('ISSUED','PRINTED','REVOKED','REPLACED','SCANNED')),
  reason text,
  actor_id uuid references users(id),
  request_id uuid,
  recorded_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index ix_portion_qr_events_token_time on portion_qr_events(qr_token_id, recorded_at desc);
```

Rollback chỉ được chạy khi chưa có dữ liệu vận hành. Khi đã phát hành QR, không drop bảng/audit; dùng migration tiến để vô hiệu hóa hoặc chuyển đổi.

## API đích

| Endpoint | Quyền | Hành vi chính |
|---|---|---|
| `POST /api/v1/meal-services/:id/portion-qr-batches` | Bếp trung tâm được gán | Header `Idempotency-Key`; tạo `actualServings` phần tử và QR trong một transaction |
| `GET /api/v1/meal-services/:id/portion-qrs` | Bếp được gán, BGH trường nhận, cán bộ đúng địa bàn | Danh sách đối soát có phân trang; không trả token đầy đủ nếu không có quyền in |
| `POST /api/v1/portion-qrs/:id/revoke` | Bếp được gán | Bắt buộc lý do; append audit event |
| `POST /api/v1/meal-services/:id/portion-qrs/reissue` | Bếp được gán | Thu hồi lô đang hoạt động và cấp lô mới bằng transaction/idempotency |
| `POST /api/v1/meal-services/:id/events` (`DISPATCHED`) | Bếp được gán | Khóa optimistic `version`; chặn nếu QR active không khớp `actualServings` |
| `GET /api/public/v1/portion-trace/:publicToken` | Công khai, rate limit | Hash token để lookup; allowlist dữ liệu đã công khai; không PII/file private |

Response công khai tối thiểu: trạng thái token, trường nhận, bếp nguồn, ngày/loại bữa, số thứ tự suất, thực đơn công khai, metadata lô được duyệt, timeline công khai và cảnh báo thu hồi. Không trả `createdBy`, ID nội bộ, thông tin học sinh, hóa đơn, ảnh/tài liệu chưa duyệt.

## Trạng thái hiện tại trong frontend DEMO

Vertical slice hiện tại phát hành token bằng Web Crypto, lưu localStorage, tạo nhãn QR thật có thể in, cho phép thu hồi/cấp lại và có trang `/truy-xuat-suat/:token`. Luồng xuất bếp đã kiểm tra độ phủ QR.

- Bếp trung tâm được gán là vai trò duy nhất phát hành, in và thu hồi lô QR.
- BGH đúng trường có màn đối soát chỉ đọc, xem từng QR và tự nhận thay đổi phát hành/thu hồi giữa các tab cùng trình duyệt qua `storage` event; cập nhật trong cùng tab dùng custom event.
- Scope đồng bộ là tổ hợp `schoolId + kitchenId + serviceDate + mealType`, vì vậy QR của trường/ngày/bữa khác không được trộn vào danh sách BGH.
- Khi mốc `READY` đã được BGH xác nhận, giao diện Giám sát & an toàn hiển thị QR đại diện suất `#001` và tổng số QR đang hoạt động. Nếu bếp chưa phát hành, giao diện chỉ báo trạng thái chờ, không tự sinh token dưới quyền phụ huynh.
- Trang quét công khai hiển thị ảnh và serial suất ăn, thực đơn và định lượng, nhà cung cấp/lô nguyên liệu, thời điểm nhập kho, bắt đầu chế biến, xuất bếp/bàn giao, đến trường, ra món, READY, hạn phục vụ được đơn vị ghi nhận, kết quả kiểm tra công khai và ảnh READY đã được duyệt. Mốc thiếu dữ liệu hiển thị “Chưa ghi nhận”; hạn phục vụ DEMO không được diễn giải thành thời hạn pháp lý hoặc kết luận ATTP. Ảnh chờ duyệt, hóa đơn, chứng từ riêng tư và PII vẫn bị loại khỏi response/view.

Đây vẫn là cơ chế DEMO trong một trình duyệt, không phải đồng bộ đa thiết bị. Triển khai thật phải thay localStorage/event bằng API và database transaction, đồng thời giữ nguyên RBAC, scope record-level, idempotency, audit append-only, rate limit và allowlist public response nêu trên.
