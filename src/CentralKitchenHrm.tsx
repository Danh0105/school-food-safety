import Select from './components/ui/Select'
import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { AlertTriangle, CalendarClock, Check, ChevronLeft, ChevronRight, Clock3, ContactRound, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2, UserCheck, Users, X } from 'lucide-react'
import {
  demoAssignments,
  demoEmployees,
  employmentStatusLabels,
  kitchenStations,
  positionLabels,
  readAssignments,
  readEmployees,
  saveAssignments,
  saveEmployees,
  shiftCatalog,
  weekFrom,
} from './lib/hrm'
import type { EmployeePosition, EmploymentStatus, KitchenEmployee, ShiftCode, WorkAssignment } from './lib/hrm'
import './WarehouseManagement.css'
import './CentralKitchenHrm.css'

type Tab = 'employees' | 'schedule'
const demoToday = '2026-10-26'
const longDate = new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="management-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="management-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="dialog-head"><h2>{title}</h2><button className="icon-button" aria-label="Đóng" onClick={onClose}><X /></button></div>
      {children}
    </section>
  </div>
}

function dateObject(value: string) { return new Date(`${value}T12:00:00`) }
function shortDate(value: string) { return `${value.slice(8, 10)}/${value.slice(5, 7)}` }
function expiryState(value: string) {
  const remaining = Math.ceil((dateObject(value).getTime() - dateObject(demoToday).getTime()) / 86_400_000)
  if (remaining < 0) return { label: 'Đã hết hạn', tone: 'expired' }
  if (remaining <= 60) return { label: `Còn ${remaining} ngày`, tone: 'expiring' }
  return { label: 'Còn hiệu lực', tone: 'valid' }
}
function maskedPhone(value: string) { return value.length >= 6 ? `${value.slice(0, 3)} ••• ${value.slice(-3)}` : value || '—' }

export default function CentralKitchenHrm({canManageEmployees=true}:{canManageEmployees?:boolean}) {
  const [tab, setTab] = useState<Tab>('employees')
  const [employees, setEmployees] = useState(readEmployees)
  const [assignments, setAssignments] = useState(readAssignments)
  const [employeeDialog, setEmployeeDialog] = useState<KitchenEmployee | null | undefined>(undefined)
  const [assignmentDialog, setAssignmentDialog] = useState<{ employeeId: string; date: string } | null>(null)
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState<'all' | EmployeePosition>('all')
  const [status, setStatus] = useState<'all' | EmploymentStatus>('all')
  const [weekAnchor, setWeekAnchor] = useState(demoToday)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const week = useMemo(() => weekFrom(weekAnchor), [weekAnchor])
  const activeEmployees = employees.filter(employee => employee.status === 'active')
  const selectedAssignment = assignmentDialog ? assignments.find(item => item.employeeId === assignmentDialog.employeeId && item.date === assignmentDialog.date) : undefined
  const filteredEmployees = useMemo(() => employees.filter(employee => {
    const term = search.trim().toLocaleLowerCase('vi')
    return (!term || `${employee.code} ${employee.fullName}`.toLocaleLowerCase('vi').includes(term))
      && (position === 'all' || employee.position === position)
      && (status === 'all' || employee.status === status)
  }), [employees, position, search, status])
  const assignedToday = new Set(assignments.filter(item => item.date === demoToday).map(item => item.employeeId))
  const credentialAlerts = activeEmployees.filter(employee => [employee.healthCertificateExpiry, employee.foodSafetyTrainingExpiry].some(value => expiryState(value).tone !== 'valid')).length

  const persistEmployees = (next: KitchenEmployee[]) => {
    try { saveEmployees(next); setEmployees(next); return true } catch { setError('Không thể lưu dữ liệu trên trình duyệt. Vui lòng kiểm tra dung lượng và thử lại.'); return false }
  }
  const persistAssignments = (next: WorkAssignment[]) => {
    try { saveAssignments(next); setAssignments(next); return true } catch { setError('Không thể lưu lịch làm trên trình duyệt. Vui lòng thử lại.'); return false }
  }
  const submitEmployee = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('')
    const form = new FormData(event.currentTarget)
    const employee: KitchenEmployee = {
      id: employeeDialog?.id ?? crypto.randomUUID(),
      code: String(form.get('code')).trim().toUpperCase(),
      fullName: String(form.get('fullName')).trim(),
      position: String(form.get('position')) as EmployeePosition,
      phone: String(form.get('phone')).trim(),
      startDate: String(form.get('startDate')),
      status: String(form.get('status')) as EmploymentStatus,
      healthCertificateExpiry: String(form.get('healthCertificateExpiry')),
      foodSafetyTrainingExpiry: String(form.get('foodSafetyTrainingExpiry')),
    }
    if (employees.some(item => item.code.toLocaleLowerCase('vi') === employee.code.toLocaleLowerCase('vi') && item.id !== employee.id)) { setError('Mã nhân sự đã tồn tại.'); return }
    const next = employeeDialog ? employees.map(item => item.id === employee.id ? employee : item) : [employee, ...employees]
    if (persistEmployees(next)) { setEmployeeDialog(undefined); setNotice(employeeDialog ? 'Đã cập nhật hồ sơ nhân sự DEMO.' : 'Đã thêm nhân sự DEMO.'); setError('') }
  }
  const submitAssignment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('')
    const form = new FormData(event.currentTarget)
    const employeeId = String(form.get('employeeId'))
    const date = String(form.get('date'))
    const existing = assignments.find(item => item.employeeId === employeeId && item.date === date)
    const assignment: WorkAssignment = {
      id: existing?.id ?? crypto.randomUUID(), employeeId, date,
      shift: String(form.get('shift')) as ShiftCode,
      station: String(form.get('station')),
      task: String(form.get('task')).trim(), note: String(form.get('note')).trim(),
    }
    const next = existing ? assignments.map(item => item.id === existing.id ? assignment : item) : [...assignments, assignment]
    if (persistAssignments(next)) { setAssignmentDialog(null); setNotice(existing ? 'Đã cập nhật ca làm DEMO.' : 'Đã phân ca làm DEMO.'); setError('') }
  }
  const shiftWeek = (amount: number) => {
    const value = dateObject(weekAnchor); value.setDate(value.getDate() + amount); setWeekAnchor(value.toLocaleDateString('sv-SE'))
  }
  const dayAssignments = (date: string) => assignments.filter(item => item.date === date && activeEmployees.some(employee => employee.id === item.employeeId))

  return <div className="management-page hrm-page">
    <header className="management-page-header"><div><div className="section-kicker">DỮ LIỆU MINH HỌA · BẾP TRUNG TÂM AN TÂM</div><h2>Nhân sự & phân ca</h2><p>Quản lý hồ sơ đội bếp, theo dõi điều kiện làm việc và sắp lịch theo tuần cho từng vị trí vận hành.</p></div><div className="management-header-actions">{tab === 'employees' ? canManageEmployees&&<button className="primary" onClick={() => { setEmployeeDialog(null); setError('') }}><Plus size={17} />Thêm nhân sự</button> : <button className="primary" onClick={() => { setAssignmentDialog({ employeeId: activeEmployees[0]?.id ?? '', date: week[0]! }); setError('') }} disabled={!activeEmployees.length}><CalendarClock size={17} />Phân ca</button>}</div></header>
    {!canManageEmployees&&<div className="management-readonly"><ShieldCheck size={17}/><span>Bếp trưởng được xem hồ sơ và phân ca vận hành; chỉ Quản lý bếp trung tâm được thêm hoặc sửa hồ sơ nhân sự.</span></div>}
    {notice && <div className="local-toast" role="status"><Check size={16} />{notice}<button aria-label="Đóng thông báo" onClick={() => setNotice('')}><X size={15} /></button></div>}
    {error && !employeeDialog && !assignmentDialog && <p className="error" role="alert">{error}</p>}
    <div className="management-kpis">
      <article className="card"><Users /><span>Nhân sự đang làm việc</span><strong>{activeEmployees.length}</strong><small>{employees.length} hồ sơ trong bản DEMO</small></article>
      <article className="card"><UserCheck /><span>Đã phân ca hôm nay</span><strong>{assignedToday.size}</strong><small>Ngày {shortDate(demoToday)}</small></article>
      <article className={`card ${activeEmployees.length - assignedToday.size > 0 ? 'warning' : ''}`}><CalendarClock /><span>Chưa có lịch hôm nay</span><strong>{Math.max(0, activeEmployees.length - assignedToday.size)}</strong><small>Cần rà soát trước khi chốt lịch</small></article>
      <article className={`card ${credentialAlerts ? 'warning' : ''}`}><ShieldCheck /><span>Hồ sơ sắp hết hạn</span><strong>{credentialAlerts}</strong><small>Trong 60 ngày từ mốc DEMO</small></article>
    </div>
    <nav className="management-tabs" aria-label="Phân hệ nhân sự bếp trung tâm"><button className={tab === 'employees' ? 'active' : ''} aria-current={tab === 'employees' ? 'page' : undefined} onClick={() => setTab('employees')}><ContactRound size={16} />Danh sách nhân sự</button><button className={tab === 'schedule' ? 'active' : ''} aria-current={tab === 'schedule' ? 'page' : undefined} onClick={() => setTab('schedule')}><CalendarClock size={16} />Lịch phân ca</button></nav>

    {tab === 'employees' && <section className="card management-table-card">
      <div className="card-header"><div><div className="section-kicker">HỒ SƠ ĐỘI BẾP</div><h2>{filteredEmployees.length} nhân sự phù hợp</h2></div></div>
      <div className="management-toolbar hrm-toolbar"><label className="grow"><span>Tìm nhân sự</span><div><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Mã hoặc họ tên…" /></div></label><label><span>Vị trí</span><Select label="Vị trí" size="sm" value={position} onValueChange={value=>setPosition(value as typeof position)}><option value="all">Tất cả vị trí</option>{Object.entries(positionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select></label><label><span>Trạng thái</span><Select label="Trạng thái" size="sm" value={status} onValueChange={value=>setStatus(value as typeof status)}><option value="all">Tất cả trạng thái</option>{Object.entries(employmentStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select></label><button className="icon-button hrm-reset-filter" aria-label="Làm mới bộ lọc" onClick={() => { setSearch(''); setPosition('all'); setStatus('all') }}><RefreshCw size={17} /></button></div>
      <div className="table-scroll"><table className="management-table hrm-employee-table"><thead><tr><th>Nhân sự</th><th>Vị trí</th><th>Liên hệ DEMO</th><th>Khám sức khỏe</th><th>Tập huấn ATTP</th><th>Trạng thái</th>{canManageEmployees&&<th>Thao tác</th>}</tr></thead><tbody>{filteredEmployees.map(employee => { const health = expiryState(employee.healthCertificateExpiry); const training = expiryState(employee.foodSafetyTrainingExpiry); return <tr key={employee.id}><td><strong>{employee.fullName}</strong><small>{employee.code} · Từ {new Date(`${employee.startDate}T12:00:00`).toLocaleDateString('vi-VN')}</small></td><td>{positionLabels[employee.position]}</td><td>{maskedPhone(employee.phone)}</td><td><span className={`management-badge ${health.tone}`}>{health.label}</span><small>{new Date(`${employee.healthCertificateExpiry}T12:00:00`).toLocaleDateString('vi-VN')}</small></td><td><span className={`management-badge ${training.tone}`}>{training.label}</span><small>{new Date(`${employee.foodSafetyTrainingExpiry}T12:00:00`).toLocaleDateString('vi-VN')}</small></td><td><span className={`management-badge ${employee.status === 'active' ? 'active' : employee.status === 'leave' ? 'expiring' : 'inactive'}`}>{employmentStatusLabels[employee.status]}</span></td>{canManageEmployees&&<td><div className="row-actions"><button aria-label={`Sửa ${employee.fullName}`} onClick={() => { setEmployeeDialog(employee); setError('') }}><Pencil size={15} /></button></div></td>}</tr> })}</tbody></table></div>
      {!filteredEmployees.length && <div className="empty-state"><Search size={36} /><h3>Không tìm thấy nhân sự</h3><p>Thử thay đổi từ khóa hoặc bộ lọc trạng thái.</p></div>}
      <div className="hrm-data-note"><ShieldCheck size={16} /><p>Số điện thoại được che trên danh sách. Đây là hồ sơ DEMO lưu cục bộ, không dùng cho vận hành hoặc chấm công thực tế.</p></div>
    </section>}

    {tab === 'schedule' && <section className="card hrm-schedule-card">
      <header className="hrm-schedule-header"><div><div className="section-kicker">KẾ HOẠCH NHÂN SỰ THEO TUẦN</div><h2>{shortDate(week[0]!)} – {shortDate(week[6]!)}</h2><p>Chọn một ô để phân hoặc điều chỉnh ca của nhân sự trong ngày.</p></div><div className="hrm-week-actions"><button className="icon-button" aria-label="Tuần trước" onClick={() => shiftWeek(-7)}><ChevronLeft /></button><button className="outline" onClick={() => setWeekAnchor(demoToday)}>Tuần hiện tại</button><button className="icon-button" aria-label="Tuần sau" onClick={() => shiftWeek(7)}><ChevronRight /></button></div></header>
      <div className="hrm-coverage" aria-label="Độ phủ nhân sự theo ngày">{week.map(date => { const count = dayAssignments(date).length; return <article key={date} className={count === 0 ? 'missing' : ''}><span>{longDate.format(dateObject(date))}</span><strong>{count} người</strong><small>{count ? `${count * 8} giờ dự kiến` : 'Chưa có lịch'}</small></article> })}</div>
      <div className="hrm-schedule-scroll"><table className="hrm-schedule"><thead><tr><th>Nhân sự</th>{week.map(date => <th key={date}><span>{dateObject(date).toLocaleDateString('vi-VN', { weekday: 'short' })}</span><strong>{date.slice(8)}</strong></th>)}</tr></thead><tbody>{activeEmployees.map(employee => <tr key={employee.id}><th><strong>{employee.fullName}</strong><small>{positionLabels[employee.position]}</small></th>{week.map(date => { const assignment = assignments.find(item => item.employeeId === employee.id && item.date === date); return <td key={date}><button className={assignment ? `hrm-shift ${assignment.shift}` : 'hrm-shift empty'} aria-label={`${assignment ? 'Sửa' : 'Phân'} ca ${employee.fullName} ngày ${new Date(`${date}T12:00:00`).toLocaleDateString('vi-VN')}`} onClick={() => { setAssignmentDialog({ employeeId: employee.id, date }); setError('') }}>{assignment ? <><strong>{shiftCatalog[assignment.shift].label}</strong><span>{shiftCatalog[assignment.shift].time}</span><small>{assignment.station}</small></> : <><Plus size={15} /><span>Phân ca</span></>}</button></td> })}</tr>)}</tbody></table></div>
      <footer className="hrm-schedule-footer"><span><i className="morning" />Ca sáng 05:30–13:30</span><span><i className="day" />Ca hành chính 07:00–15:00</span><span><i className="afternoon" />Ca chiều 10:00–18:00</span><p><Clock3 size={15} />Giờ làm chỉ là kế hoạch DEMO, chưa kết nối chấm công.</p></footer>
    </section>}

    {employeeDialog !== undefined && <Modal title={employeeDialog ? 'Chỉnh sửa nhân sự' : 'Thêm nhân sự'} onClose={() => setEmployeeDialog(undefined)}><form className="management-form" onSubmit={submitEmployee}><div className="management-form-grid"><label>Mã nhân sự<input name="code" defaultValue={employeeDialog?.code ?? ''} required minLength={3} maxLength={20} placeholder="VD: BC-020" /></label><label>Họ và tên<input name="fullName" defaultValue={employeeDialog?.fullName ?? ''} required minLength={2} maxLength={120} /></label><label>Vị trí<Select label="Vị trí" name="position" defaultValue={employeeDialog?.position ?? 'cook'}>{Object.entries(positionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select></label><label>Trạng thái<Select label="Trạng thái" name="status" defaultValue={employeeDialog?.status ?? 'active'}>{Object.entries(employmentStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select></label><label>Điện thoại DEMO<input name="phone" defaultValue={employeeDialog?.phone ?? ''} inputMode="tel" pattern="[0-9 +.-]{8,20}" required /></label><label>Ngày bắt đầu<input name="startDate" type="date" defaultValue={employeeDialog?.startDate ?? demoToday} required /></label><label>Hạn khám sức khỏe<input name="healthCertificateExpiry" type="date" defaultValue={employeeDialog?.healthCertificateExpiry ?? '2027-10-26'} required /></label><label>Hạn tập huấn ATTP<input name="foodSafetyTrainingExpiry" type="date" defaultValue={employeeDialog?.foodSafetyTrainingExpiry ?? '2027-10-26'} required /></label></div>{error && <p className="error" role="alert">{error}</p>}<p className="demo-note">DEMO · Chỉ nhập dữ liệu minh họa. Hồ sơ được lưu trên trình duyệt hiện tại và không gửi lên máy chủ.</p><div className="management-form-actions"><button type="button" className="outline" onClick={() => setEmployeeDialog(undefined)}>Hủy</button><button className="primary">Lưu nhân sự</button></div></form></Modal>}

    {assignmentDialog && <Modal title={selectedAssignment ? 'Điều chỉnh ca làm' : 'Phân ca làm'} onClose={() => setAssignmentDialog(null)}><form className="management-form" onSubmit={submitAssignment}><div className="management-form-grid"><label>Nhân sự<Select label="Nhân sự" name="employeeId" defaultValue={assignmentDialog.employeeId} required>{activeEmployees.map(employee => <option value={employee.id} key={employee.id}>{employee.fullName} · {positionLabels[employee.position]}</option>)}</Select></label><label>Ngày làm<input name="date" type="date" defaultValue={assignmentDialog.date} required /></label><label>Ca làm<Select label="Ca làm" name="shift" defaultValue={selectedAssignment?.shift ?? 'morning'}>{Object.entries(shiftCatalog).map(([value, shift]) => <option value={value} key={value}>{shift.label} · {shift.time}</option>)}</Select></label><label>Khu vực<Select label="Khu vực" name="station" defaultValue={selectedAssignment?.station ?? kitchenStations[0]}>{kitchenStations.map(station => <option value={station} key={station}>{station}</option>)}</Select></label><label className="wide">Nhiệm vụ<input name="task" defaultValue={selectedAssignment?.task ?? ''} required minLength={3} maxLength={180} placeholder="Nhiệm vụ chính trong ca…" /></label><label className="wide">Ghi chú<textarea name="note" defaultValue={selectedAssignment?.note ?? ''} maxLength={500} placeholder="Bàn giao hoặc lưu ý (nếu có)…" /></label></div>{error && <p className="error" role="alert">{error}</p>}<p className="demo-note">Mỗi nhân sự có một ca trong ngày. Lưu lại sẽ thay ca hiện có của cùng ngày trong bản DEMO.</p><div className="management-form-actions">{selectedAssignment && <button type="button" className="danger-button" onClick={() => { const next = assignments.filter(item => item.id !== selectedAssignment.id); if (persistAssignments(next)) { setAssignmentDialog(null); setNotice('Đã xóa ca làm DEMO.') } }}><Trash2 size={16} />Xóa ca</button>}<button type="button" className="outline" onClick={() => setAssignmentDialog(null)}>Hủy</button><button className="primary">Lưu phân ca</button></div></form></Modal>}
    {(employees.length !== demoEmployees.length || assignments.length !== demoAssignments.length) && <p className="management-reset"><button onClick={() => { if (persistEmployees(demoEmployees) && persistAssignments(demoAssignments)) setNotice('Đã khôi phục dữ liệu HRM DEMO.') }}><RefreshCw size={14} />Khôi phục dữ liệu mẫu</button></p>}
    <div className="hrm-warning"><AlertTriangle size={17} /><span>Lịch làm và trạng thái chứng nhận chỉ hỗ trợ trình diễn giao diện; chưa phải dữ liệu nhân sự, chấm công hoặc hồ sơ pháp lý thực tế.</span></div>
  </div>
}
