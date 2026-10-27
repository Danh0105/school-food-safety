import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Apple, CalendarDays, Check, ChevronLeft, ChevronRight, CircleHelp, Coffee, Eye, Pencil, Plus, Trash2, Utensils, X } from 'lucide-react'
import Select from './components/ui/Select'
import type { School } from './lib/data'
import { addDays, boardingMenuRepository, dishTemplates, gradeOptions, mealTypeOptions, mondayOfWeek, parseIsoDate, weekFromMonday } from './lib/boardingMenu'
import type { BoardingDish, BoardingMealType, GradeLevel } from './lib/boardingMenu'
import './BoardingMenuManager.css'

type EditorDraft = {
  mealType: BoardingMealType
  scope: 'DAY' | 'WEEK' | 'SELECTED'
  selectedDates: string[]
  templateId: string
  name: string
  ingredients: string
  description: string
  priority: string
  expectedQuantity: string
}
type EditorErrors = Partial<Record<'name' | 'ingredients' | 'priority' | 'expectedQuantity' | 'scope' | 'form', string>>
type EditorTarget = { date: string; mealType: BoardingMealType; item?: BoardingDish }

const mealIcons: Record<BoardingMealType, typeof Utensils> = { BREAKFAST: Coffee, LUNCH: Utensils, SNACK: Apple }
const weekdayShort = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
const todayIso = () => new Date().toLocaleDateString('sv-SE')
const dateLabel = (value: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }) => parseIsoDate(value).toLocaleDateString('vi-VN', options)
const mealLabel = (value: BoardingMealType) => mealTypeOptions.find(option => option.value === value)?.label ?? value

function Modal({ label, children, requestClose, wide = false }: { label: string; children: ReactNode; requestClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal() }, [])
  return <dialog ref={ref} className={`boarding-dialog ${wide ? 'wide' : ''}`} aria-label={label} onCancel={event => { event.preventDefault(); requestClose() }} onClick={event => { if (event.target === event.currentTarget) requestClose() }}>{children}</dialog>
}

function MealEditor({ target, week, items, onClose, onSave }: { target: EditorTarget; week: string[]; items: BoardingDish[]; onClose: () => void; onSave: (draft: EditorDraft) => Promise<boolean> }) {
  const [draft, setDraft] = useState<EditorDraft>(() => ({
    mealType: target.mealType,
    scope: 'DAY',
    selectedDates: [target.date],
    templateId: '',
    name: target.item?.name ?? '',
    ingredients: target.item?.ingredients.join(', ') ?? '',
    description: target.item?.description ?? '',
    priority: String(target.item?.priority ?? 1),
    expectedQuantity: String(target.item?.expectedQuantity ?? 485),
  }))
  const [errors, setErrors] = useState<EditorErrors>({})
  const [saving, setSaving] = useState(false)
  const [initial] = useState(() => JSON.stringify(draft))
  const dirty = JSON.stringify(draft) !== initial
  const update = <K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) => setDraft(current => ({ ...current, [key]: value }))
  const requestClose = () => { if (!dirty || window.confirm('Bạn có thay đổi chưa lưu. Đóng mà không lưu?')) onClose() }
  const applyTemplate = (templateId: string) => {
    const template = dishTemplates.find(item => item.id === templateId)
    setDraft(current => ({ ...current, templateId, ...(template ? { name: template.name, ingredients: template.ingredients.join(', '), description: template.description } : {}) }))
  }
  const toggleDate = (value: string) => update('selectedDates', draft.selectedDates.includes(value) ? draft.selectedDates.filter(date => date !== value) : [...draft.selectedDates, value])
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: EditorErrors = {}
    if (!draft.name.trim()) nextErrors.name = 'Vui lòng nhập tên món.'
    if (!draft.priority.trim() || Number(draft.priority) < 0 || !Number.isInteger(Number(draft.priority))) nextErrors.priority = 'Thứ tự phải là số nguyên không âm.'
    if (!draft.expectedQuantity.trim() || Number(draft.expectedQuantity) < 0 || !Number.isInteger(Number(draft.expectedQuantity))) nextErrors.expectedQuantity = 'Số lượng phải là số nguyên không âm.'
    if (draft.scope === 'SELECTED' && !draft.selectedDates.length) nextErrors.scope = 'Chọn ít nhất một ngày áp dụng.'
    const targetDates = draft.scope === 'DAY' ? [target.date] : draft.scope === 'WEEK' ? week : draft.selectedDates
    for (const date of targetDates) {
      const existing = items.filter(item => item.serviceDate === date && item.mealType === draft.mealType && item.id !== target.item?.id)
      if (existing.length >= 3) nextErrors.form = `${mealLabel(draft.mealType)} ngày ${dateLabel(date)} đã đủ 3 món.`
      if (existing.some(item => item.name.trim().toLocaleLowerCase('vi') === draft.name.trim().toLocaleLowerCase('vi'))) nextErrors.form = `Món “${draft.name.trim()}” đã có trong ${mealLabel(draft.mealType).toLocaleLowerCase('vi')} ngày ${dateLabel(date)}.`
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSaving(true)
    const saved = await onSave(draft)
    setSaving(false)
    if (!saved) setErrors({ form: 'Không thể lưu trên trình duyệt. Vui lòng thử lại.' })
  }
  return <Modal wide label={target.item ? 'Chỉnh sửa món bán trú' : 'Thêm món bán trú'} requestClose={requestClose}>
    <form className="meal-editor" onSubmit={submit}>
      <header className="meal-editor-head"><div><span className="meal-editor-context">{dateLabel(target.date, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} · {mealLabel(target.mealType)}</span><h2>{target.item ? 'Chỉnh sửa món bán trú' : 'Thêm món bán trú'}</h2></div><button type="button" className="icon-button" aria-label="Đóng" onClick={requestClose}><X /></button></header>
      <div className="meal-editor-body">
        <div className="meal-form-column">
          <div className="meal-form-grid">
            <label className="meal-field">Bữa ăn<Select label="Bữa ăn" value={draft.mealType} disabled={!!target.item} onValueChange={value => update('mealType', value as BoardingMealType)} options={mealTypeOptions} /></label>
            <label className="meal-field">Phạm vi áp dụng<Select label="Phạm vi áp dụng" value={draft.scope} disabled={!!target.item} onValueChange={value => update('scope', value as EditorDraft['scope'])} options={[{ value: 'DAY', label: 'Chỉ ngày đang chọn' }, { value: 'WEEK', label: 'Cả tuần đang chọn' }, { value: 'SELECTED', label: 'Các ngày được chọn' }]} /></label>
          </div>
          {!target.item && draft.scope === 'SELECTED' && <fieldset className="meal-day-choices"><legend>Ngày áp dụng</legend>{week.map((date, index) => <label key={date}><input type="checkbox" checked={draft.selectedDates.includes(date)} onChange={() => toggleDate(date)} /><span>{weekdayShort[index]}<small>{dateLabel(date, { day: '2-digit', month: '2-digit' })}</small></span></label>)}</fieldset>}
          {errors.scope && <p className="field-error">{errors.scope}</p>}
          <label className="meal-field">Chọn nhanh món ăn mẫu<Select label="Chọn nhanh món ăn mẫu" value={draft.templateId} onValueChange={applyTemplate} options={[{ value: '', label: 'Tự nhập món mới' }, ...dishTemplates.map(item => ({ value: item.id, label: item.name }))]} /></label>
          <label className="meal-field">Tên món <span aria-hidden="true">*</span><input autoFocus value={draft.name} onChange={event => update('name', event.target.value)} maxLength={120} placeholder="Nhập tên món ăn" aria-invalid={!!errors.name} />{errors.name && <small className="field-error">{errors.name}</small>}</label>
          <label className="meal-field">Thành phần<textarea value={draft.ingredients} onChange={event => update('ingredients', event.target.value)} maxLength={500} placeholder="Ví dụ: Cơm trắng, thịt heo, rau luộc" /></label>
          <label className="meal-field">Mô tả<textarea value={draft.description} onChange={event => update('description', event.target.value)} maxLength={500} placeholder="Mô tả ngắn để phụ huynh xem chi tiết món" /></label>
          <div className="meal-form-grid">
            <label className="meal-field">Thứ tự ưu tiên<input type="number" min="0" step="1" value={draft.priority} onChange={event => update('priority', event.target.value)} aria-invalid={!!errors.priority} />{errors.priority && <small className="field-error">{errors.priority}</small>}</label>
            <label className="meal-field">Số lượng dự kiến<div className="number-suffix"><input type="number" min="0" step="1" value={draft.expectedQuantity} onChange={event => update('expectedQuantity', event.target.value)} aria-invalid={!!errors.expectedQuantity} /><span>suất</span></div>{errors.expectedQuantity && <small className="field-error">{errors.expectedQuantity}</small>}</label>
          </div>
          {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
        </div>
        <aside className="parent-preview" aria-live="polite"><span className="preview-label"><Eye size={15} /> Xem trước bên phụ huynh</span><div className="preview-phone"><div className="preview-phone-top"><span>{mealLabel(draft.mealType)}</span><small>{dateLabel(target.date)}</small></div><article><span className="preview-order">Món {Number(draft.priority) + 1}</span><h3>{draft.name.trim() || 'Tên món ăn sẽ hiển thị tại đây'}</h3><p>{draft.description.trim() || 'Mô tả ngắn dành cho phụ huynh sẽ xuất hiện ở khu vực này.'}</p><div className="preview-ingredients">{draft.ingredients.split(',').map(value => value.trim()).filter(Boolean).map(value => <span key={value}>{value}</span>)}{!draft.ingredients.trim() && <span>Thành phần đang cập nhật</span>}</div><footer><Utensils size={15} /> {Number(draft.expectedQuantity || 0).toLocaleString('vi-VN')} suất dự kiến · DEMO</footer></article></div><p>Chỉ các trường trong khung này được mô phỏng là nội dung hiển thị cho phụ huynh.</p></aside>
      </div>
      <footer className="meal-editor-footer"><span>{target.item ? 'Thay đổi chỉ áp dụng cho món đang chỉnh sửa.' : draft.scope === 'WEEK' ? 'Món sẽ được thêm vào cả 7 ngày trong tuần.' : draft.scope === 'SELECTED' ? `Món sẽ được thêm vào ${draft.selectedDates.length} ngày đã chọn.` : 'Món chỉ được thêm vào ngày đang chọn.'}</span><div><button type="button" className="outline" onClick={requestClose}>Hủy</button><button className="primary" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu món'}</button></div></footer>
    </form>
  </Modal>
}

export default function BoardingMenuManager({ school, selectedDate }: { school: School; selectedDate: string }) {
  const initialLoad = useMemo(() => { try { return { items: boardingMenuRepository.load(), error: '' } } catch (caught) { return { items: [] as BoardingDish[], error: caught instanceof Error ? caught.message : 'Không đọc được dữ liệu thực đơn DEMO.' } } }, [])
  const [items, setItems] = useState(initialLoad.items)
  const [loadError, setLoadError] = useState(initialLoad.error)
  const [grade, setGrade] = useState<GradeLevel>('PRIMARY')
  const [monday, setMonday] = useState(mondayOfWeek(selectedDate))
  const [year, setYear] = useState(String(parseIsoDate(selectedDate).getFullYear()))
  const [month, setMonth] = useState(String(parseIsoDate(selectedDate).getMonth() + 1))
  const [editor, setEditor] = useState<EditorTarget | null>(null)
  const [previewDate, setPreviewDate] = useState<string | null>(null)
  const [deleteItem, setDeleteItem] = useState<BoardingDish | null>(null)
  const [notice, setNotice] = useState('')
  const week = useMemo(() => weekFromMonday(monday), [monday])
  const visibleItems = useMemo(() => items.filter(item => item.schoolId === school.id && item.gradeLevel === grade && week.includes(item.serviceDate)), [grade, items, school.id, week])
  const filledCells = new Set(visibleItems.map(item => `${item.serviceDate}:${item.mealType}`)).size
  const weeksForMonth = useMemo(() => {
    const first = `${year}-${String(month).padStart(2, '0')}-01`
    const start = mondayOfWeek(first)
    return Array.from({ length: 6 }, (_, index) => addDays(start, index * 7)).filter(value => {
      const dates = weekFromMonday(value)
      return dates.some(date => String(parseIsoDate(date).getFullYear()) === year && String(parseIsoDate(date).getMonth() + 1) === month)
    })
  }, [month, year])
  const changeYear = (value: string) => {
    const nextMonday = mondayOfWeek(`${value}-${String(month).padStart(2, '0')}-01`)
    setYear(value)
    setMonday(nextMonday)
  }
  const changeMonth = (value: string) => {
    const nextMonday = mondayOfWeek(`${year}-${String(value).padStart(2, '0')}-01`)
    setMonth(value)
    setMonday(nextMonday)
  }
  const shiftWeek = (amount: number) => {
    const nextMonday = addDays(monday, amount)
    const nextDate = parseIsoDate(nextMonday)
    setMonday(nextMonday)
    setYear(String(nextDate.getFullYear()))
    setMonth(String(nextDate.getMonth() + 1))
  }
  const persist = (next: BoardingDish[], message: string) => {
    try { boardingMenuRepository.save(next); setItems(next); setNotice(message); window.setTimeout(() => setNotice(''), 4000); return true } catch { return false }
  }
  const save = async (draft: EditorDraft) => {
    if (!editor) return false
    const dates = editor.item ? [editor.date] : draft.scope === 'DAY' ? [editor.date] : draft.scope === 'WEEK' ? week : draft.selectedDates
    const now = new Date().toISOString()
    const ingredients = draft.ingredients.split(',').map(value => value.trim()).filter(Boolean)
    let next = items.filter(item => item.id !== editor.item?.id)
    const additions = dates.map((serviceDate, index): BoardingDish => ({ id: editor.item?.id ?? `${crypto.randomUUID()}-${index}`, schoolId: school.id, gradeLevel: grade, serviceDate, mealType: draft.mealType, name: draft.name.trim(), ingredients, description: draft.description.trim(), priority: Number(draft.priority), expectedQuantity: Number(draft.expectedQuantity), createdAt: editor.item?.createdAt ?? now, updatedAt: now, demo: true }))
    next = [...next, ...additions]
    await new Promise(resolve => window.setTimeout(resolve, 260))
    const success = persist(next, editor.item ? 'Đã cập nhật món trong dữ liệu DEMO.' : `Đã thêm món vào ${dates.length} ngày áp dụng.`)
    if (success) setEditor(null)
    return success
  }
  const remove = () => { if (!deleteItem) return; if (persist(items.filter(item => item.id !== deleteItem.id), 'Đã xóa món khỏi thực đơn DEMO.')) setDeleteItem(null) }
  const cellItems = (date: string, mealType: BoardingMealType) => visibleItems.filter(item => item.serviceDate === date && item.mealType === mealType).sort((a, b) => a.priority - b.priority)
  if (loadError) return <section className="card boarding-menu-error" role="alert"><CircleHelp size={34} /><h2>Chưa tải được thực đơn</h2><p>{loadError}</p><button className="outline" onClick={() => { try { const seeded = boardingMenuRepository.seed(); setItems(seeded); setLoadError('') } catch { setLoadError('Trình duyệt đang chặn bộ nhớ cục bộ.') } }}>Dùng lại dữ liệu DEMO</button></section>
  return <section className="boarding-menu-manager" aria-labelledby="boarding-menu-title">
    <header className="boarding-menu-title"><div><span className="section-kicker">QUẢN LÝ BÁN TRÚ · DỮ LIỆU MINH HỌA</span><h2 id="boarding-menu-title">Thiết lập thực đơn hằng ngày và hằng tuần</h2><p>Quản lý thực đơn theo khối lớp, bữa ăn và lịch áp dụng.</p></div><button className="outline" onClick={() => setPreviewDate(week[0]!)}><Eye size={17} /> Xem bản công khai</button></header>
    {notice && <div className="boarding-notice" role="status"><Check size={17} />{notice}<button aria-label="Đóng thông báo" onClick={() => setNotice('')}><X size={16} /></button></div>}
    <div className="boarding-filter-card">
      <div className="boarding-filters">
        <label>Khối lớp<Select label="Khối lớp" value={grade} onValueChange={value => setGrade(value as GradeLevel)} options={gradeOptions} /></label>
        <label>Năm<Select label="Năm" value={year} onValueChange={changeYear} options={['2025', '2026', '2027'].map(value => ({ value, label: value }))} /></label>
        <label>Tháng<Select label="Tháng" value={month} onValueChange={changeMonth} options={Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: `Tháng ${index + 1}` }))} /></label>
        <label className="week-filter">Tuần áp dụng<Select label="Tuần áp dụng" value={monday} onValueChange={setMonday} options={weeksForMonth.map(value => ({ value, label: `${dateLabel(value, { day: '2-digit', month: '2-digit' })} – ${dateLabel(addDays(value, 6), { day: '2-digit', month: '2-digit' })}` }))} /></label>
      </div>
      <div className="boarding-summary"><div><span>Đã thêm</span><strong>{filledCells}<small>/21 ô bữa ăn</small></strong></div><div><span>Số bữa</span><strong>3<small>Sáng · Trưa · Xế</small></strong></div></div>
    </div>
    <div className="boarding-weekbar"><div><button className="icon-button" aria-label="Tuần trước" onClick={() => shiftWeek(-7)}><ChevronLeft /></button><span><CalendarDays size={17} /><strong>{dateLabel(week[0]!, { day: '2-digit', month: '2-digit' })} – {dateLabel(week[6]!, { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong></span><button className="icon-button" aria-label="Tuần sau" onClick={() => shiftWeek(7)}><ChevronRight /></button></div><small>Mỗi ô tối đa 3 món · Dữ liệu lưu trên trình duyệt</small></div>
    <div className="boarding-calendar-scroll" tabIndex={0} aria-label="Lịch thực đơn tuần, có thể cuộn ngang">
      <div className="boarding-calendar" role="table" aria-label="Lịch thực đơn 7 ngày và 3 bữa">
        <div className="calendar-header" role="row"><div className="calendar-corner" role="columnheader">Bữa ăn</div>
        {week.map((date, index) => <div key={date} role="columnheader" className={`calendar-day ${date === todayIso() ? 'today' : ''} ${index > 4 ? 'weekend' : ''}`}><span>{weekdayShort[index]}</span><strong>{dateLabel(date, { day: '2-digit', month: '2-digit' })}</strong>{date === todayIso() && <small>Hôm nay</small>}</div>)}</div>
        {mealTypeOptions.map(meal => { const Icon = mealIcons[meal.value]; return <div className="calendar-row" role="row" key={meal.value}><div className="meal-row-title" role="rowheader"><span><Icon size={19} /></span><strong>{meal.label}</strong></div>{week.map(date => { const dishes = cellItems(date, meal.value); return <div className={`meal-calendar-cell ${dishes.length ? 'has-items' : ''}`} role="cell" key={date}>{dishes.map((dish, index) => <article className="calendar-dish" key={dish.id}><button className="dish-title-button" title="Xem và chỉnh sửa món" onClick={() => setEditor({ date, mealType: meal.value, item: dish })}><span>{index + 1}</span><strong>{dish.name}</strong></button><small>{dish.expectedQuantity.toLocaleString('vi-VN')} suất</small><div className="dish-actions"><button aria-label={`Chỉnh sửa ${dish.name}`} title="Chỉnh sửa" onClick={() => setEditor({ date, mealType: meal.value, item: dish })}><Pencil size={14} /></button><button aria-label={`Xóa ${dish.name}`} title="Xóa món" onClick={() => setDeleteItem(dish)}><Trash2 size={14} /></button></div></article>)}<button className="add-dish-button" disabled={dishes.length >= 3} title={dishes.length >= 3 ? 'Đã đạt giới hạn 3 món' : 'Thêm món'} onClick={() => setEditor({ date, mealType: meal.value })}><Plus size={16} />{dishes.length ? 'Thêm món' : 'Thêm món ăn'}{dishes.length >= 3 && <small>Đã đủ 3 món</small>}</button></div>})}</div> })}
      </div>
    </div>
    <div className="boarding-help"><CircleHelp size={17} /><p>“Đã thêm” đếm số ô bữa ăn có ít nhất một món, không phải tổng số món. Nội dung DEMO chưa qua quy trình duyệt hoặc công khai chính thức.</p></div>
    {editor && <MealEditor target={editor} week={week} items={items.filter(item => item.schoolId === school.id && item.gradeLevel === grade)} onClose={() => setEditor(null)} onSave={save} />}
    {deleteItem && <Modal label="Xác nhận xóa món" requestClose={() => setDeleteItem(null)}><div className="confirm-dialog"><span className="confirm-icon"><Trash2 /></span><h2>Xóa “{deleteItem.name}”?</h2><p>Món sẽ được gỡ khỏi {mealLabel(deleteItem.mealType).toLocaleLowerCase('vi')} ngày {dateLabel(deleteItem.serviceDate)}. Thao tác chỉ ảnh hưởng dữ liệu DEMO trên trình duyệt.</p><div><button className="outline" onClick={() => setDeleteItem(null)}>Giữ lại</button><button className="danger-button" onClick={remove}>Xóa món</button></div></div></Modal>}
    {previewDate && <Modal label="Xem trước thực đơn công khai" requestClose={() => setPreviewDate(null)}><div className="preview-dialog"><header><div><span className="section-kicker">XEM TRƯỚC BẢN CÔNG KHAI · DEMO</span><h2>Thực đơn {dateLabel(previewDate, { weekday: 'long', day: '2-digit', month: '2-digit' })}</h2></div><button className="icon-button" aria-label="Đóng" onClick={() => setPreviewDate(null)}><X /></button></header>{mealTypeOptions.map(meal => <section key={meal.value}><strong>{meal.label}</strong>{cellItems(previewDate, meal.value).length ? <ul>{cellItems(previewDate, meal.value).map(item => <li key={item.id}><span>{item.name}</span><small>{item.description || 'Chưa có mô tả.'}</small></li>)}</ul> : <p>Chưa cập nhật</p>}</section>)}</div></Modal>}
  </section>
}
