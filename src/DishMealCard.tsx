import { CheckCircle2, ClipboardCheck, Eye, FileSearch, Pencil, Scale, Trash2, UsersRound } from 'lucide-react'
import SpotlightCard from './components/react-bits/SpotlightCard'
import type { BoardingDish } from './lib/boardingMenu'
import { dishImage } from './lib/dishImages'

type Props = {
  dish: BoardingDish
  order: number
  canManage: boolean
  isDefault?: boolean
  selectionCount?: number
  isChosen?: boolean
  explicitChoice?: boolean
  onChoose?: () => void
  onSetDefault?: () => void
  onOpen: () => void
  onEdit: () => void
  onRemove: () => void
}

/** A compact, full-card accessible trigger. Counts are declarations, not verified safety results. */
export default function DishMealCard({ dish, order, canManage, isDefault = false, selectionCount, isChosen = false, explicitChoice = false, onChoose, onSetDefault, onOpen, onEdit, onRemove }: Props) {
  const records = dish.ingredientRecords ?? []
  const ingredientCount = Math.max(records.length, dish.ingredients.length)
  const traced = records.filter(item => item.supplier.trim() && item.lotCode.trim()).length
  const reportedSafety = dish.safetyMonitoring?.threeStep === 'REPORTED'
    && dish.safetyMonitoring?.retainedSample === 'REPORTED'
  const grams = dish.portionWeightGrams
  return <SpotlightCard
    className={`calendar-dish rb-dish-spotlight ${isChosen ? 'dish-parent-chosen' : ''}`}
    theme="light" spotlightColor="#2367c6" spotlightSize={160} intensity={0.09}
    softness={0.88} borderGlow={0.14} proximity={24} smoothing={0.35}
    flare={false} ambient={false}
  >
    <button type="button" className="dish-detail-trigger dish-card-open" onClick={onOpen}
      title={`Xem định lượng, truy xuất nguồn gốc và giám sát của ${dish.name}`}
      aria-label={`Xem chi tiết ${dish.name}, ${grams != null ? `${grams} gam một suất` : 'chưa cập nhật định lượng'}, ${traced} trên ${ingredientCount} nguyên liệu khai báo nguồn gốc`}>
      <span className="dish-card-main">
        <img className="calendar-dish-photo" src={dishImage(dish.name, dish.mealType, dish.imageUrl)} alt="" loading="lazy" />
        <span className="dish-card-text"><span className="dish-card-number">{isChosen ? 'ĐANG ÁP DỤNG' : `MÓN ${order}`}</span>{isDefault && <span className="dish-default-badge">Mặc định</span>}<strong className="dish-card-name">{dish.name}</strong></span>
      </span>
      <span className="dish-card-weight"><Scale size={13} aria-hidden="true"/>{grams != null ? `${grams.toLocaleString('vi-VN')} g / suất` : 'Chưa có định lượng'}<Eye size={13} className="dish-card-eye" aria-hidden="true" /></span>
    </button>
    <div className="dish-card-meta" aria-label="Thông tin khai báo món ăn">
      <span title="Số suất dự kiến"><UsersRound size={13} aria-hidden="true" />{dish.expectedQuantity.toLocaleString('vi-VN')} suất</span>
      <span title="Số nguyên liệu đã khai báo nhà cung cấp và mã lô"><FileSearch size={13} aria-hidden="true" />Lô {traced}/{ingredientCount}</span>
    </div>
    {selectionCount !== undefined && <small className="dish-choice-count">{selectionCount} lượt chọn riêng (DEMO)</small>}
    {onChoose && <button type="button" className={`dish-parent-pick ${isChosen ? 'selected' : ''}`} aria-pressed={isChosen}
      aria-label={`${isChosen ? 'Món hiện tại' : explicitChoice ? 'Đổi sang món' : 'Chọn món'} ${dish.name} cho học sinh`}
      title={isChosen ? 'Món đang áp dụng cho học sinh' : 'Lưu chọn món cho học sinh trong ngày'}
      onClick={onChoose}>
      {isChosen ? <><CheckCircle2 size={14}/>{explicitChoice ? 'Đã chọn' : 'Đang mặc định'}</> : explicitChoice ? 'Đổi món' : 'Chọn món'}
    </button>}
    <div className="dish-card-bottom">
      <span className={`dish-card-status ${reportedSafety ? 'reported' : ''}`} title="Đây chỉ là nhật ký khai báo, không phải xác nhận an toàn thực phẩm"><ClipboardCheck size={12} aria-hidden="true" />{reportedSafety ? 'Đã khai báo giám sát' : 'Chưa đủ nhật ký GS'}</span>
      {canManage && <div className="dish-actions">
        {!isDefault && onSetDefault && <button className="dish-set-default" type="button" aria-label={`Đặt ${dish.name} làm món mặc định`} title="Đặt món mặc định" onClick={onSetDefault}>☆</button>}
        <button type="button" aria-label={`Chỉnh sửa ${dish.name}`} title="Chỉnh sửa" onClick={onEdit}><Pencil size={14}/></button>
        <button type="button" aria-label={`Xóa ${dish.name}`} title="Xóa món" onClick={onRemove}><Trash2 size={14}/></button>
      </div>}
    </div>
  </SpotlightCard>
}
