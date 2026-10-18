import { useMemo, useState } from 'react'
import { AlertCircle, Check, ExternalLink, Eye, Printer, QrCode, RotateCcw, ShieldCheck } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { School } from './lib/data'
import type { ViewRole } from './lib/store'
import { portionQrDemo, portionTraceUrl } from './lib/portionQr'
import './PortionQr.css'

const kitchenName = 'Bếp trung tâm An Tâm'

export default function PortionQrPanel({role,school,date,servings,dishes}:{role:ViewRole;school:School;date:string;servings:number;dishes:string[]}) {
  const [revision,setRevision]=useState(0)
  const [notice,setNotice]=useState('')
  const [error,setError]=useState('')
  const [selectedToken,setSelectedToken]=useState<string|null>(null)
  const [printMode,setPrintMode]=useState(false)
  const [showReissue,setShowReissue]=useState(false)
  const scope=useMemo(()=>portionQrDemo.scopeForSchool({schoolId:school.id,serviceDate:date}),[school.id,date])

  if(school.mode!=='CENTRAL_KITCHEN') return <section className="card portion-not-applicable"><QrCode size={38}/><h2>QR riêng không áp dụng cho bữa này</h2><p>Yêu cầu dán QR cho từng suất được áp dụng với mô hình nấu tại bếp trung tâm. Bữa đang chọn là nấu tại trường.</p></section>

  const actor=portionQrDemo.actorFor(role,scope)
  let records:ReturnType<typeof portionQrDemo.list>=[]
  try { records=portionQrDemo.list(actor,scope) } catch { /* A scoped read error is rendered below. */ }
  const active=records.filter(record=>record.state==='ACTIVE')
  const revoked=records.filter(record=>record.state==='REVOKED')
  const selected=active.find(record=>record.publicToken===(selectedToken??active[0]?.publicToken))
  const canIssue=role==='central_kitchen'
  const canRead=canIssue||role==='school_board'||role==='culture_social_office'
  const difference=Math.abs(servings-active.length)

  if(!canRead) return <section className="card portion-not-applicable"><AlertCircle size={38}/><h2>Không có quyền truy cập</h2><p>Danh sách QR cá thể chỉ dành cho bếp trung tâm được gán, BGH trường nhận và đơn vị quản lý đúng địa bàn.</p></section>

  const issue=(quantity:number)=>{
    setError('');setNotice('')
    try {
      const created=portionQrDemo.issue({actor,scope,quantity,idempotencyKey:crypto.randomUUID(),schoolName:school.name,kitchenName,dishNames:dishes})
      setSelectedToken(created[0]?.publicToken??null);setRevision(value=>value+1)
      setNotice(`Đã phát hành ${created.length.toLocaleString('vi-VN')} mã QR DEMO riêng biệt. Hãy in và dán đúng một nhãn cho mỗi suất.`)
    } catch(caught) {
      const code=caught instanceof Error?caught.message:''
      setError(code==='ACTIVE_BATCH_EXISTS'?'Bữa ăn đã có một lô QR đang hoạt động. Muốn đổi số lượng, hãy thu hồi lô cũ và phát hành lại.':code==='FORBIDDEN'?'Tài khoản này không phải bếp trung tâm được gán.':'Không thể phát hành lô QR. Vui lòng kiểm tra số suất và thử lại.')
    }
  }

  const reissue=(reason:string)=>{
    setError('');setNotice('')
    try {
      const count=portionQrDemo.revokeActive(actor,scope,reason)
      const created=portionQrDemo.issue({actor,scope,quantity:servings,idempotencyKey:crypto.randomUUID(),schoolName:school.name,kitchenName,dishNames:dishes})
      setSelectedToken(created[0]?.publicToken??null);setRevision(value=>value+1);setShowReissue(false)
      setNotice(`Đã thu hồi ${count.toLocaleString('vi-VN')} mã cũ và phát hành ${created.length.toLocaleString('vi-VN')} mã mới. Mã cũ không còn truy xuất hợp lệ.`)
    } catch(caught) {
      setError(caught instanceof Error&&caught.message==='REVOCATION_REASON_REQUIRED'?'Lý do thu hồi cần ít nhất 8 ký tự.':'Không thể phát hành lại lô QR.')
    }
  }

  return <div className="portion-qr-page" data-revision={revision}>
    <section className="portion-qr-summary" aria-label="Đối soát QR từng suất ăn">
      <div className="card"><QrCode/><strong>{active.length.toLocaleString('vi-VN')}</strong><span>QR đang hoạt động</span></div>
      <div className={`card ${difference?'attention':''}`}><AlertCircle/><strong>{difference.toLocaleString('vi-VN')}</strong><span>Chênh lệch QR / suất</span></div>
      <div className="card"><RotateCcw/><strong>{revoked.length.toLocaleString('vi-VN')}</strong><span>QR đã thu hồi</span></div>
      <div className="card"><ShieldCheck/><strong>{servings.toLocaleString('vi-VN')}</strong><span>Suất dự kiến / xuất bếp</span></div>
    </section>

    <section className="card portion-qr-card" aria-labelledby="portion-qr-title">
      <div className="card-header"><div><div className="section-kicker">MỖI SUẤT · MỘT MÃ TRUY XUẤT</div><h2 id="portion-qr-title">Nhãn QR suất ăn · {school.name}</h2><p className="muted">Bữa trưa · {new Date(`${date}T12:00:00`).toLocaleDateString('vi-VN')} · {kitchenName}</p></div><span className="portion-required"><Check size={16}/> Bắt buộc trước xuất bếp</span></div>
      <div className="portion-privacy"><ShieldCheck size={19}/><p><strong>QR không chứa thông tin học sinh.</strong> Mỗi token là chuỗi opaque ngẫu nhiên, chỉ mở allowlist dữ liệu công khai của đúng suất ăn và các lô nguyên liệu liên kết.</p></div>
      {notice&&<p className="inventory-success" role="status"><Check size={17}/>{notice}</p>}
      {error&&<p className="error portion-error" role="alert">{error}</p>}

      {!active.length?<div className="portion-empty"><span><QrCode size={40}/></span><h3>Chưa phát hành QR cho {servings.toLocaleString('vi-VN')} suất</h3><p>Mốc xuất bếp sẽ bị chặn cho đến khi số QR hoạt động khớp số suất xuất.</p>{canIssue?<button className="primary" onClick={()=>issue(servings)}><QrCode size={17}/>Phát hành {servings.toLocaleString('vi-VN')} mã QR DEMO</button>:<small>Chờ bếp trung tâm được gán phát hành lô QR.</small>}</div>:<>
        <div className="portion-actions"><div><strong>{active.length===servings?'Đã đủ QR để đối soát':'Số QR chưa khớp, chưa thể xuất bếp'}</strong><p>{active.length.toLocaleString('vi-VN')} mã hoạt động / {servings.toLocaleString('vi-VN')} suất dự kiến</p></div><div><button className="outline" onClick={()=>setPrintMode(value=>!value)}><Printer size={16}/>{printMode?'Đóng bản in':'Chuẩn bị bản in'}</button>{canIssue&&<button className="text-button danger-text" onClick={()=>setShowReissue(value=>!value)}><RotateCcw size={15}/>Thu hồi & cấp lại</button>}</div></div>
        {showReissue&&<form className="portion-reissue" onSubmit={event=>{event.preventDefault();reissue(String(new FormData(event.currentTarget).get('reason')??''))}}><label>Lý do thu hồi toàn bộ lô QR<input name="reason" required minLength={8} maxLength={300} placeholder="Ví dụ: Sai số suất xuất bếp, cần in lại toàn bộ…"/></label><button className="outline" type="submit">Xác nhận thu hồi và cấp lại</button></form>}
        <div className="portion-registry"><div className="portion-token-list" aria-label="Danh sách QR đang hoạt động">{active.slice(0,24).map(record=><button className={selected?.id===record.id?'selected':''} key={record.id} onClick={()=>setSelectedToken(record.publicToken)}><span>Suất #{String(record.sequence).padStart(3,'0')}</span><small>…{record.publicToken.slice(-8)}</small><Eye size={15}/></button>)}{active.length>24&&<p>Hiển thị 24/{active.length.toLocaleString('vi-VN')} mã. Bản in vẫn bao gồm toàn bộ.</p>}</div>{selected&&<aside className="portion-preview"><QRCodeSVG value={portionTraceUrl(selected.publicToken)} size={156} level="M" marginSize={2}/><strong>Suất #{String(selected.sequence).padStart(3,'0')}</strong><span>Token …{selected.publicToken.slice(-10)}</span><a href={portionTraceUrl(selected.publicToken)} target="_blank" rel="noreferrer">Mở trang truy xuất <ExternalLink size={14}/></a></aside>}</div>
      </>}
      <div className="table-note"><AlertCircle size={15}/>DEMO · Dữ liệu lưu trên trình duyệt này. Khi triển khai thật, phát hành token, đối soát số lượng và tra cứu công khai phải do backend thực hiện trong transaction.</div>
    </section>

    {printMode&&active.length>0&&<section className="portion-print-wrap card"><div className="portion-print-toolbar"><div><h2>Bản in nhãn QR</h2><p>Kiểm tra máy in và vật liệu nhãn trước khi in toàn bộ.</p></div><button className="primary" onClick={()=>window.print()}><Printer size={17}/>In {active.length.toLocaleString('vi-VN')} nhãn</button></div><div className="portion-label-sheet">{active.map(record=><article className="portion-label" key={record.id}><QRCodeSVG value={portionTraceUrl(record.publicToken)} size={112} level="M" marginSize={1}/><div><b>BỮA ĂN HỌC ĐƯỜNG · DEMO</b><strong>Suất #{String(record.sequence).padStart(3,'0')}</strong><span>{school.name}</span><small>Bữa trưa · {new Date(`${date}T12:00:00`).toLocaleDateString('vi-VN')}</small><code>{record.publicToken.slice(-12)}</code></div></article>)}</div></section>}
  </div>
}
