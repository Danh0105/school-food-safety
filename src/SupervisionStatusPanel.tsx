import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, ClipboardCheck, Clock3, FileClock, Pencil, ShieldAlert, ShieldCheck, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import type { School } from './lib/data'
import type { ViewRole } from './lib/store'
import {
  CHECK_DEFINITIONS,
  SUPERVISION_STATUS_EVENT,
  SUPERVISION_STATUS_STORAGE_KEY,
  canConfirmSupervision,
  canReportSupervision,
  readSupervisionStatuses,
  updateSupervisionStatus,
} from './lib/supervisionStatus'
import type { CheckAction, CheckId, CheckStatus, SupervisionMealType, SupervisionScope } from './lib/supervisionStatus'

const labels: Record<CheckStatus, string> = {
  not_reported: 'Chưa cập nhật', reported: 'Chờ BGH xác nhận',
  revision_requested: 'Cần bổ sung', confirmed: 'Đã xác nhận (DEMO)',
}
const formatTimestamp = (value: string) => new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
const actionLabels: Record<CheckAction, string> = {
  report: 'Bếp báo cáo', confirm: 'BGH xác nhận', request_revision: 'BGH yêu cầu bổ sung',
}

type Editing = { id: CheckId; action: CheckAction }
export default function SupervisionStatusPanel({ school, date, mealType, role }: {
  school: School
  date: string
  mealType: SupervisionMealType
  role: ViewRole
}) {
  const scope: SupervisionScope = { schoolId: school.id, serviceDate: date, mealType }
  const [revision, setRevision] = useState(0)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [note, setNote] = useState('')
  const [evidenceRef, setEvidenceRef] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const queryClient = useQueryClient()
  useEffect(() => {
    const update = () => setRevision(value => value + 1)
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === SUPERVISION_STATUS_STORAGE_KEY) update()
    }
    window.addEventListener(SUPERVISION_STATUS_EVENT, update)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(SUPERVISION_STATUS_EVENT, update)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  // Recalculate after writes in this tab and cross-tab storage changes.
  void revision
  const checks = readSupervisionStatuses(scope)
  const canReport = canReportSupervision(role, school.mode)
  const canConfirm = canConfirmSupervision(role)
  const confirmedCount = checks.filter(item => item.status === 'confirmed').length
  const pendingCount = checks.filter(item => item.status === 'reported').length
  const mealLabel = mealType === 'BREAKFAST' ? 'bữa sáng' : 'bữa trưa'
  const selected = editing && CHECK_DEFINITIONS.find(item => item.id === editing.id)
  const start = (id: CheckId, action: CheckAction) => {
    setEditing({ id, action })
    setError('')
    setNote('')
    setEvidenceRef('')
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editing) return
    try {
      updateSupervisionStatus({ scope, id: editing.id, action: editing.action, role, schoolMode: school.mode, note, evidenceRef })
      setEditing(null)
      setError('')
      setMessage('Đã cập nhật trạng thái DEMO cho ' + mealLabel + '. Chưa phải kết quả kiểm tra ATTP chính thức.')
      void queryClient.invalidateQueries({ queryKey: ['supervision-meal-day', school.id, date, mealType] })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể lưu trạng thái. Vui lòng thử lại.')
    }
  }
  return (
    <section className="card supervision-checklist" aria-label={`Cập nhật trạng thái giám sát ${mealLabel}`}>
      <div className="card-header supervision-checklist-header">
        <div>
          <div className="section-kicker">KIỂM THỰC VÀ LƯU MẪU THEO BỮA</div>
          <h2>Trạng thái giám sát · {mealLabel}</h2>
          <p className="muted">Cập nhật riêng theo trường, ngày và bữa. Hồ sơ bếp báo cáo chỉ chuyển sang đã xác nhận khi Ban Giám hiệu đối chiếu.</p>
        </div>
        <div className="supervision-checklist-actions">
          <span className="supervision-check-count"><ShieldCheck size={16}/>{confirmedCount}/{checks.length} đã xác nhận</span>
          {canReport && <button type="button" className="primary" disabled={!checks.some(item => item.status === 'not_reported' || item.status === 'revision_requested')} onClick={() => {
            const first = checks.find(item => item.status === 'not_reported' || item.status === 'revision_requested')
            if (first) start(first.id, 'report')
          }}><Pencil size={16}/>Cập nhật trạng thái</button>}
          {canConfirm && pendingCount > 0 && <button type="button" className="primary" onClick={() => {
            const first = checks.find(item => item.status === 'reported')
            if (first) start(first.id, 'confirm')
          }}><ClipboardCheck size={16}/>Xác nhận trạng thái ({pendingCount})</button>}
        </div>
      </div>
      {message && <div className="supervision-status-message" role="status"><CheckCircle2 size={16}/><span>{message}</span><button type="button" aria-label="Đóng thông báo" onClick={() => setMessage('')}><X size={15}/></button></div>}
      <div className="supervision-check-rows">
        {CHECK_DEFINITIONS.map(def => {
          const item = checks.find(check => check.id === def.id)!
          const latest = item.history.at(-1)
          return <article key={def.id} className="supervision-check-row">
            <div className="supervision-check-icon">{item.status === 'confirmed' ? <CheckCircle2 size={21}/> : item.status === 'revision_requested' ? <ShieldAlert size={21}/> : <FileClock size={21}/>}</div>
            <div className="supervision-check-main">
              <strong>{def.label}</strong>
              <p>{def.description}</p>
              {latest && (canReport || canConfirm) && <small>{latest.actorLabel} · {formatTimestamp(latest.recordedAt)} · {latest.evidenceRef ? `Tham chiếu: ${latest.evidenceRef}` : 'Không có tham chiếu'}</small>}
              {showHistory && (canReport || canConfirm) && item.history.length > 0 && <ol className="supervision-status-history">{item.history.map(entry => <li key={entry.id}><strong>{actionLabels[entry.action]}</strong> · {formatTimestamp(entry.recordedAt)} · {entry.note}</li>)}</ol>}
            </div>
            <div className="supervision-check-controls">
              <span className={`supervision-check-pill ${item.status}`}>{item.status === 'confirmed' ? <CheckCircle2 size={13}/> : <Clock3 size={13}/>} {labels[item.status]}</span>
              {canReport && (item.status === 'not_reported' || item.status === 'revision_requested') && <button className="outline" type="button" onClick={() => start(def.id, 'report')}>Cập nhật</button>}
              {canConfirm && item.status === 'reported' && <><button className="primary" type="button" onClick={() => start(def.id, 'confirm')}>Xác nhận</button><button className="outline" type="button" onClick={() => start(def.id, 'request_revision')}>Yêu cầu bổ sung</button></>}
            </div>
          </article>
        })}
      </div>
      <div className="supervision-check-footer">
        <p><ShieldAlert size={16}/> Nhật ký tự báo cáo không thay thế hồ sơ, biên bản hoặc kết luận của cơ quan có thẩm quyền. Dữ liệu DEMO chỉ lưu trên trình duyệt này.</p>
        {(canReport || canConfirm) && <button type="button" className="text-button" aria-expanded={showHistory} onClick={() => setShowHistory(value => !value)}>{showHistory ? 'Ẩn lịch sử cập nhật' : 'Xem lịch sử cập nhật'}</button>}
      </div>
      {editing && selected && <div className="supervision-edit-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setEditing(null) }}>
        <section role="dialog" aria-modal="true" aria-labelledby="supervision-edit-title" className="supervision-edit-dialog">
          <div className="dialog-head"><h2 id="supervision-edit-title">{editing.action === 'report' ? 'Cập nhật trạng thái' : editing.action === 'confirm' ? 'Xác nhận trạng thái' : 'Yêu cầu bổ sung'}</h2><button type="button" className="icon-button" aria-label="Đóng" onClick={() => setEditing(null)}><X size={20}/></button></div>
          <p className="supervision-edit-context">{school.name} · {date} · {mealLabel} · <strong>{selected.label}</strong></p>
          <form onSubmit={submit} className="supervision-edit-form">
            {editing.action === 'report' && <label>Mã sổ / mã mẫu / tham chiếu hồ sơ <span aria-hidden="true">*</span><input required minLength={3} maxLength={120} value={evidenceRef} onChange={event => setEvidenceRef(event.target.value)} placeholder="Ví dụ: KT3B-SANG-1710-01" /></label>}
            {editing.action !== 'report' && <p className="supervision-edit-guidance">{editing.action === 'confirm' ? 'BGH xác nhận đã đối chiếu bản báo cáo và hồ sơ tương ứng trong DEMO. Không phải xác nhận kiểm tra ATTP chính thức.' : 'Hồ sơ sẽ chuyển sang Cần bổ sung để bếp cập nhật lại, không xóa lịch sử cũ.'}</p>}
            <label>Ghi chú / nội dung ghi nhận <span aria-hidden="true">*</span><textarea required minLength={5} maxLength={1000} rows={4} value={note} onChange={event => setNote(event.target.value)} placeholder="Nhập thông tin đối chiếu hoặc nội dung cần bổ sung…" /></label>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="supervision-edit-buttons"><button type="button" className="outline" onClick={() => setEditing(null)}>Hủy</button><button type="submit" className="primary">{editing.action === 'report' ? 'Lưu và gửi BGH xác nhận' : editing.action === 'confirm' ? 'Xác nhận DEMO' : 'Gửi yêu cầu bổ sung'}</button></div>
          </form>
        </section>
      </div>}
    </section>
  )
}
