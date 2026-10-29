import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertCircle, Check, ClipboardCheck, FileSearch, ImagePlus, Plus, Scale, Trash2, X } from 'lucide-react'
import SpotlightCard from './components/react-bits/SpotlightCard'
import type { School } from './lib/data'
import type { ViewRole } from './lib/store'
import { useUI } from './lib/store'
import { inventoryItems } from './lib/inventory'
import { readSuppliers } from './lib/suppliers'
import { dishImage, compressDishPhoto } from './lib/dishImages'
import { gradeForSchool, kitchenDishProposalsRepository, mealTypeOptions, KITCHEN_DISH_PROPOSALS_KEY } from './lib/boardingMenu'
import type { BoardingMealType, KitchenDishProposal } from './lib/boardingMenu'
import IngredientTraceDialog from './IngredientTraceDialog'
import './KitchenDishCatalog.css'

type IngredientDraft = { inventoryItemId: string; amount: string }
const today = () => new Date().toLocaleDateString('sv-SE')
const nowIso = () => new Date().toISOString()
const fmt = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })
const newId = () => typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID() : `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

export default function KitchenDishCatalog({ school, role }: { school: School; role: ViewRole }) {
  const isKitchen = role === 'central_kitchen' || role === 'school_kitchen'
  const [proposals, setProposals] = useState<KitchenDishProposal[]>(() => { try { return kitchenDishProposalsRepository.load() } catch { return [] } })
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mealType, setMealType] = useState<BoardingMealType>('LUNCH')
  const [weight, setWeight] = useState('320')
  const [servings, setServings] = useState('485')
  const [priority, setPriority] = useState('1')
  const [imageUrl, setImageUrl] = useState('')
  const [imageBusy, setImageBusy] = useState(false)
  const [ingredientRows, setIngredientRows] = useState<IngredientDraft[]>([])
  const [threeStep, setThreeStep] = useState<'NOT_RECORDED' | 'REPORTED'>('NOT_RECORDED')
  const [retainedSample, setRetainedSample] = useState<'NOT_RECORDED' | 'REPORTED'>('NOT_RECORDED')
  const [supervisor, setSupervisor] = useState('')
  const [recordedAt, setRecordedAt] = useState('')
  const [safetyNote, setSafetyNote] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [traceId, setTraceId] = useState('')
  const [currentDate] = useState(today)
  const isCorrectKitchen = role === 'central_kitchen' ? school.mode === 'CENTRAL_KITCHEN' : school.mode === 'ON_SITE'
  const items = useMemo(() => inventoryItems.filter(item => item.schoolId === school.id && item.unit !== 'chai' && (
    role === 'central_kitchen' ? item.kitchenId === 'kitchen-an-tam' : role === 'school_kitchen' ? item.kitchenId !== 'kitchen-an-tam' : true
  )), [role, school.id])
  const allowed = items.filter(item => item.expiresAt >= currentDate)
  const recordFor = (id: string) => items.find(item => item.id === id)
  const suppliers = readSuppliers()
  const readable = proposals.filter(item => item.schoolId === school.id && (role === 'school_board' || item.createdBy === role))
  const addRow = () => setIngredientRows(current => [...current, { inventoryItemId: '', amount: '' }])
  const updateRow = (index: number, update: Partial<IngredientDraft>) => setIngredientRows(current => current.map((item, i) => i === index ? { ...item, ...update } : item))
  const clear = () => {
    setName(''); setDescription(''); setMealType('LUNCH'); setWeight('320'); setServings('485'); setPriority('1')
    setIngredientRows([]); setImageUrl(''); setThreeStep('NOT_RECORDED'); setRetainedSample('NOT_RECORDED')
    setSupervisor(''); setRecordedAt(''); setSafetyNote(''); setError('')
  }
  useEffect(() => {
    const update = () => { try { setProposals(kitchenDishProposalsRepository.load()) } catch { /* giữ dữ liệu hiện tại */ } }
    const onStorage = (event: StorageEvent) => { if (!event.key || event.key === KITCHEN_DISH_PROPOSALS_KEY) update() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('demo-kitchen-dishes-updated', update)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('demo-kitchen-dishes-updated', update) }
  }, [])
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError('')
    const count = Number(servings); const grams = Number(weight); const order = Number(priority)
    if (!isKitchen || !isCorrectKitchen || useUI.getState().role !== role || useUI.getState().schoolId !== school.id) return setError('Không có quyền tạo món ở trường/bếp này.')
    if (!name.trim() || !description.trim()) return setError('Nhập tên và mô tả món ăn.')
    if (!Number.isInteger(count) || count <= 0 || !Number.isInteger(order) || order < 0 || !Number.isFinite(grams) || grams <= 0) return setError('Số suất và định lượng phải hợp lệ.')
    if (!ingredientRows.length) return setError('Chọn ít nhất một nguyên liệu trong kho.')
    if (ingredientRows.some(row => !row.inventoryItemId || !Number.isFinite(Number(row.amount)) || Number(row.amount) <= 0)) return setError('Từng nguyên liệu phải chọn từ kho và có định lượng lớn hơn 0.')
    if (new Set(ingredientRows.map(row => row.inventoryItemId)).size !== ingredientRows.length) return setError('Một lô nguyên liệu chỉ được chọn một lần.')
    if (ingredientRows.some(row => !allowed.some(item => item.id === row.inventoryItemId))) return setError('Có nguyên liệu đã hết hạn hoặc không thuộc kho được phân công.')
    const kitchenId = items[0]?.kitchenId
    if (!kitchenId) return setError('Chưa có kho nguyên liệu được gán cho bếp này.')
    const ingredientRecords = ingredientRows.map(row => {
      const item = recordFor(row.inventoryItemId)!
      const supplier = suppliers.find(source => source.id === item.supplierId)
      return { inventoryItemId: item.id, name: item.ingredientName, amountPerServing: Number(row.amount), unit: (item.unit === 'lít' ? 'ml' : 'g') as 'ml'|'g', supplier: supplier?.name ?? '', lotCode: item.lotCode, origin: item.origin ?? '' }
    })
    const now = nowIso()
    const proposal: KitchenDishProposal = { id: newId(), schoolId: school.id, kitchenId, createdBy: role as 'central_kitchen'|'school_kitchen', mealType, gradeLevel: gradeForSchool(school.id), name: name.trim(), description: description.trim(), imageUrl: imageUrl || undefined, expectedQuantity: count, priority: order, portionWeightGrams: grams, ingredientRecords, safetyMonitoring: { threeStep, retainedSample, supervisor: supervisor.trim(), recordedAt: recordedAt ? new Date(recordedAt).toISOString() : '', note: safetyNote.trim() }, createdAt: now, updatedAt: now, demo: true }
    try { kitchenDishProposalsRepository.save(proposal); setOpen(false); clear(); setSuccess(`Đã lưu món “${proposal.name}” vào danh mục đề xuất DEMO. Ban Giám hiệu sẽ chọn khi lập thực đơn.`) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể lưu món đề xuất.') }
  }
  return <section className="kitchen-proposals" aria-label="Danh mục món do bếp đề xuất">
    <div className="kitchen-proposals-heading"><div><span className="section-kicker">DANH MỤC MÓN ĂN · DỮ LIỆU DEMO</span><h3>Món do bếp đề xuất</h3><p>Bếp tạo công thức và liên kết lô trong kho. Chỉ Ban Giám hiệu được đưa món vào lịch thực đơn.</p></div>
      {isKitchen && <button type="button" className="primary" onClick={() => { setError(''); setOpen(true) }} disabled={!isCorrectKitchen || !allowed.length}><Plus size={16}/> Tạo món</button>}
    </div>
    {isKitchen && !isCorrectKitchen && <p className="demo-note">Hãy chọn trường có mô hình bếp phù hợp để lập món từ kho được phân công.</p>}
    {success && <div className="kitchen-proposals-success" role="status"><Check size={17}/>{success}</div>}
    {readable.length ? <div className="kitchen-proposals-grid">{readable.map(item => <SpotlightCard key={item.id} theme="light" className="kitchen-proposal-card" spotlightColor="#2e88bd" intensity={0.10} borderGlow={0.14} proximity={24} flare={false} ambient={false}>
      <img src={dishImage(item.name,item.mealType,item.imageUrl)} alt={`Ảnh minh họa ${item.name}`} /><div><span className="kitchen-proposal-tag">DEMO · Chờ BGH xếp lịch</span><h4>{item.name}</h4><p>{item.description}</p><small>{fmt(item.portionWeightGrams)} g/suất · {fmt(item.expectedQuantity)} suất · {item.ingredientRecords.length} nguyên liệu kho</small></div>
    </SpotlightCard>)}</div> : <p className="kitchen-proposals-empty">Chưa có món đề xuất cho trường này.</p>}
    {open && <div className="kitchen-proposal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) { setOpen(false); clear() } }}>
      <div className="kitchen-proposal-modal" role="dialog" aria-modal="true" aria-label="Tạo món từ nguyên liệu trong kho"><header><div><span className="section-kicker">BẾP TẠO CÔNG THỨC MỚI</span><h2>Tạo món ăn</h2></div><button type="button" className="icon-button" aria-label="Đóng" onClick={() => { setOpen(false); clear() }}><X/></button></header>
      <form onSubmit={submit} className="kitchen-proposal-form"><div className="kitchen-proposal-fields"><label>Tên món ăn <input required maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Ví dụ: Cháo gà rau củ"/></label><label>Bữa ăn <select value={mealType} onChange={e=>setMealType(e.target.value as BoardingMealType)}>{mealTypeOptions.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select></label><label>Khối lượng món sau nấu (g/suất) <input required type="number" min="0.01" step="any" value={weight} onChange={e=>setWeight(e.target.value)}/></label><label>Số suất dự kiến <input required type="number" min="1" step="1" value={servings} onChange={e=>setServings(e.target.value)}/></label><label>Thứ tự ưu tiên <input required type="number" min="0" step="1" value={priority} onChange={e=>setPriority(e.target.value)}/></label><label>Khối lớp <input disabled value={gradeForSchool(school.id) === 'KINDERGARTEN' ? 'Mầm non' : gradeForSchool(school.id) === 'PRIMARY' ? 'Tiểu học' : 'THCS'} readOnly/></label><label className="wide">Mô tả món ăn <textarea value={description} required maxLength={500} onChange={e=>setDescription(e.target.value)}/></label></div>
        <div className="kitchen-proposal-ingredient-head"><div><h3><Scale size={19}/> Nguyên liệu & định lượng</h3><p>Chỉ được chọn lô trong kho của bếp. Mã lô và nhà cung cấp sẽ tự điền, không nhập tay.</p></div><button type="button" className="outline" onClick={addRow} disabled={!allowed.length}><Plus size={15}/> Thêm nguyên liệu</button></div>
        {ingredientRows.map((row,index) => { const stock=recordFor(row.inventoryItemId); const supplier=suppliers.find(s=>s.id===stock?.supplierId); return <div className="kitchen-proposal-ingredient" key={index}><div className="kitchen-proposal-fields"><label>Nguyên liệu trong kho <select aria-label={`Chọn nguyên liệu ${index+1}`} required value={row.inventoryItemId} onChange={e=>updateRow(index,{inventoryItemId:e.target.value})}><option value="">Chọn nguyên liệu/lô</option>{items.map(item=><option key={item.id} value={item.id} disabled={item.expiresAt<currentDate}>{item.ingredientName} · {item.lotCode}{item.expiresAt<currentDate?' (hết hạn)':''}</option>)}</select></label><label>Định lượng / suất ({stock?.unit==='lít'?'ml':'g'}) <input type="number" required min="0.01" step="any" value={row.amount} onChange={e=>updateRow(index,{amount:e.target.value})}/></label></div><div className="kitchen-proposal-stock-source"><span>Nhà cung cấp: <strong>{supplier?.name??'Chưa khai báo'}</strong></span><span>Mã lô: <strong>{stock?.lotCode??'Chưa chọn'}</strong></span><span>Xuất xứ: <strong>{stock?.origin??'Chưa khai báo'}</strong></span>{stock&&<button type="button" onClick={()=>setTraceId(stock.id)}><FileSearch size={14}/> Xem hồ sơ</button>}<button type="button" className="danger" onClick={()=>setIngredientRows(current=>current.filter((_,i)=>i!==index))} aria-label={`Xóa nguyên liệu ${index+1}`}><Trash2 size={16}/></button></div></div> })}
        <div className="kitchen-proposal-photo"><div><h3><ImagePlus size={18}/> Ảnh minh họa món ăn</h3><p>Không thay thế ảnh thực tế khi phục vụ.</p><input type="file" accept="image/jpeg,image/png,image/webp" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;setImageBusy(true);try{setImageUrl(await compressDishPhoto(f));setError('')}catch(ex){setError(ex instanceof Error?ex.message:'Không thể xử lý ảnh')}finally{setImageBusy(false);e.target.value=''}}}/></div><img src={dishImage(name,mealType,imageUrl)} alt="Xem trước món ăn"/></div>
        <fieldset className="kitchen-proposal-safety"><legend><ClipboardCheck size={18}/> Nhật ký giám sát (chỉ là khai báo DEMO)</legend><div className="kitchen-proposal-fields"><label>Kiểm thực ba bước <select value={threeStep} onChange={e=>setThreeStep(e.target.value as typeof threeStep)}><option value="NOT_RECORDED">Chưa ghi nhận</option><option value="REPORTED">Đã khai báo nội bộ</option></select></label><label>Lưu mẫu thức ăn <select value={retainedSample} onChange={e=>setRetainedSample(e.target.value as typeof retainedSample)}><option value="NOT_RECORDED">Chưa ghi nhận</option><option value="REPORTED">Đã khai báo nội bộ</option></select></label><label>Người ghi nhận <input maxLength={100} value={supervisor} onChange={e=>setSupervisor(e.target.value)}/></label><label>Thời điểm ghi nhận <input type="datetime-local" value={recordedAt} onChange={e=>setRecordedAt(e.target.value)}/></label><label className="wide">Ghi chú <textarea value={safetyNote} maxLength={500} onChange={e=>setSafetyNote(e.target.value)}/></label></div></fieldset>
        {error&&<p role="alert" className="kitchen-proposal-error"><AlertCircle size={17}/>{error}</p>}
        <div className="kitchen-proposal-actions"><small>DEMO · Món đề xuất không tự động thay đổi thực đơn do BGH quản lý.</small><button type="button" className="outline" onClick={()=>{setOpen(false);clear()}}>Hủy</button><button className="primary" type="submit" disabled={imageBusy || !allowed.length}><Check size={16}/> Lưu món đề xuất</button></div>
      </form></div></div>}
    {traceId && <IngredientTraceDialog stockItem={inventoryItems.find(item=>item.id===traceId)} onClose={()=>setTraceId('')}/>}
  </section>
}
