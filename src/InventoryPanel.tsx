import { useMemo, useState } from 'react'
import { AlertCircle, ArrowDownToLine, ArrowUpFromLine, Boxes, Check, ClipboardList, Clock3, PackageCheck, Search, UserRound } from 'lucide-react'
import type { School } from './lib/data'
import { inventoryDemo, inventoryItems, kitchenActorForSchool } from './lib/inventory'
import type { InventoryActor, InventoryMovementType } from './lib/inventory'
import type { ViewRole } from './lib/store'

const number = new Intl.NumberFormat('vi-VN', {maximumFractionDigits:2})
const dateTime = (value:string) => new Date(value).toLocaleString('vi-VN', {hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'})

function readerActor(role:ViewRole,school:School):InventoryActor {
  if(role==='school_board') return {id:`bgh.${school.id}`,name:`BGH · ${school.name}`,role,schoolId:school.id,kitchenId:null,wardId:'ward-binh-hung-hoa'}
  return {id:'uy-ban-phuong-binh-hung-hoa',name:'Uỷ ban phường Bình Hưng Hoà',role,schoolId:null,kitchenId:null,wardId:'ward-binh-hung-hoa'}
}

export default function InventoryPanel({role,school}:{role:ViewRole;school:School}) {
  const [,setRevision]=useState(0)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
  const [movementType,setMovementType]=useState<'ALL'|InventoryMovementType>('ALL')
  const [movementSearch,setMovementSearch]=useState('')
  const isKitchen=role==='central_kitchen'||role==='school_kitchen'
  const kitchenActor=useMemo(()=>kitchenActorForSchool(school.id,role==='school_kitchen'?'school_kitchen':'central_kitchen'),[school.id,role])
  const canRead=role==='school_board'||role==='culture_social_office'
  const reader=useMemo(()=>readerActor(role,school),[role,school])
  const rows=canRead?inventoryDemo.snapshot(reader):[]
  const movements=canRead?inventoryDemo.movements(reader):[]
  const catalog=useMemo(()=>isKitchen?inventoryDemo.catalog(kitchenActor):[],[isKitchen,kitchenActor])
  const kitchenMovements=isKitchen?inventoryDemo.kitchenMovements(kitchenActor):[]
  const filteredKitchenMovements=(()=>{
    const query=movementSearch.trim().toLocaleLowerCase('vi')
    return kitchenMovements.filter(movement=>{
      if(movementType!=='ALL'&&movement.type!==movementType) return false
      if(!query) return true
      const item=inventoryItems.find(value=>value.id===movement.itemId)
      return [movement.reference,movement.note,item?.ingredientName,item?.lotCode]
        .some(value=>value?.toLocaleLowerCase('vi').includes(query))
    })
  })()

  if(isKitchen) {
    const receivedCount=kitchenMovements.filter(item=>item.type==='RECEIPT').length
    const issuedCount=kitchenMovements.filter(item=>item.type==='ISSUE').length
    const itemCount=new Set(kitchenMovements.map(item=>item.itemId)).size
    return <div className="inventory-page">
      <section aria-labelledby="kitchen-inventory-summary-title">
        <div className="inventory-section-heading"><div><div className="section-kicker">THỐNG KÊ TRONG PHẠM VI KHO ĐƯỢC GÁN</div><h2 id="kitchen-inventory-summary-title">Tổng quan phiếu nhập / xuất</h2></div><span>{kitchenActor.name}</span></div>
        <div className="inventory-kpis" aria-label="Thống kê phiếu nhập xuất của bếp"><div className="card"><ClipboardList size={20}/><strong>{kitchenMovements.length}</strong><span>Tổng số phiếu DEMO</span></div><div className="card"><ArrowDownToLine size={20}/><strong>{receivedCount}</strong><span>Phiếu nhập kho</span></div><div className="card"><ArrowUpFromLine size={20}/><strong>{issuedCount}</strong><span>Phiếu xuất kho</span></div><div className="card"><Boxes size={20}/><strong>{itemCount}</strong><span>Mặt hàng đã phát sinh</span></div></div>
      </section>
      <section className="card inventory-entry" aria-labelledby="inventory-entry-title">
      <div className="card-header"><div><div className="section-kicker">TÀI KHOẢN BẾP ĂN · GHI NHẬN TÁC NGHIỆP</div><h2 id="inventory-entry-title">Tạo phiếu nhập / xuất kho</h2><p className="muted">{kitchenActor.name} · {school.name}</p></div><span className="inventory-lock"><UserRound size={18}/> Quyền ghi phiếu</span></div>
      <div className="inventory-boundary"><AlertCircle size={18}/><p>Tài khoản bếp chỉ ghi nhận giao dịch được phân công. Số tồn và báo cáo tổng hợp chỉ hiển thị cho BGH và Uỷ ban.</p></div>
      {!catalog.length?<div className="empty-state"><Boxes size={38}/><h3>Chưa được phân công kho</h3><p>Tài khoản hiện tại không có danh mục nguyên liệu thuộc trường này.</p></div>:<form className="inventory-form" onSubmit={event=>{
        event.preventDefault();setError('');setMessage('')
        const form=new FormData(event.currentTarget)
        try {
          const movement=inventoryDemo.record(kitchenActor,{itemId:String(form.get('itemId')),type:String(form.get('type')) as InventoryMovementType,quantity:Number(form.get('quantity')),occurredAt:new Date(String(form.get('occurredAt'))).toISOString(),reference:String(form.get('reference')).trim(),note:String(form.get('note')).trim(),idempotencyKey:crypto.randomUUID()})
          event.currentTarget.reset();setRevision(value=>value+1);setMessage(`Đã lưu ${movement.type==='RECEIPT'?'phiếu nhập':'phiếu xuất'} DEMO lúc ${dateTime(movement.recordedAt)} bởi ${movement.actorName}.`)
        } catch (caught) {
          const code=caught instanceof Error?caught.message:''
          setError(code==='INSUFFICIENT_STOCK'?'Số lượng xuất vượt số tồn hiện có. BGH hoặc Uỷ ban có thể kiểm tra báo cáo tồn.':code==='INVALID_QUANTITY'?'Số lượng phải lớn hơn 0 và không quá 5.000.':'Tài khoản bếp không có quyền ghi nhận cho kho này.')
        }
      }}>
        <div className="inventory-form-grid"><label>Loại giao dịch<select name="type" defaultValue="RECEIPT" required><option value="RECEIPT">Nhập kho</option><option value="ISSUE">Xuất kho</option></select></label><label>Nguyên liệu / lô<select name="itemId" required>{catalog.map(item=><option value={item.id} key={item.id}>{item.ingredientName} · {item.lotCode}</option>)}</select></label><label>Số lượng<input name="quantity" type="number" min="0.01" max="5000" step="0.01" inputMode="decimal" required/></label><label>Thời điểm thực hiện<input name="occurredAt" type="datetime-local" defaultValue="2026-10-18T08:30" required/></label><label>Mã phiếu / chứng từ<input name="reference" required minLength={4} maxLength={80} placeholder="Ví dụ: DEMO-PN-1810-01"/></label><label className="inventory-note">Ghi chú<textarea name="note" required minLength={5} maxLength={500} placeholder="Mục đích nhập/xuất và thông tin đối chiếu…"/></label></div>
        {error&&<p className="error" role="alert">{error}</p>}{message&&<p className="inventory-success" role="status"><Check size={17}/>{message}</p>}
        <p className="demo-note">DEMO · Phiếu được lưu cục bộ, gắn tài khoản bếp thực hiện và giờ ghi nhận của hệ thống. Đây không phải chứng từ kho thật.</p>
        <button className="primary" type="submit"><PackageCheck size={17}/>Lưu phiếu DEMO</button>
      </form>}
      </section>
      <section className="card inventory-audit inventory-kitchen-list" aria-labelledby="kitchen-movements-title">
        <div className="card-header"><div><div className="section-kicker">NHẬT KÝ KHÔNG SỬA ĐÈ</div><h2 id="kitchen-movements-title">Danh sách phiếu xuất nhập</h2><p className="muted">{kitchenMovements.length} phiếu thuộc kho đang được phân công · Dữ liệu minh họa</p></div><Clock3 size={21}/></div>
        <div className="inventory-list-filters"><label className="table-search"><Search size={16}/><input aria-label="Tìm phiếu xuất nhập" placeholder="Tìm mã phiếu, nguyên liệu, lô…" value={movementSearch} onChange={event=>setMovementSearch(event.target.value)}/></label><label><span>Loại phiếu</span><select aria-label="Lọc loại phiếu" value={movementType} onChange={event=>setMovementType(event.target.value as 'ALL'|InventoryMovementType)}><option value="ALL">Tất cả</option><option value="RECEIPT">Phiếu nhập</option><option value="ISSUE">Phiếu xuất</option></select></label></div>
        {filteredKitchenMovements.length?<div className="inventory-movements">{filteredKitchenMovements.map(movement=>{const item=inventoryItems.find(value=>value.id===movement.itemId);return <article key={movement.id}><span className={movement.type==='RECEIPT'?'receipt':'issue'}>{movement.type==='RECEIPT'?<ArrowDownToLine size={17}/>:<ArrowUpFromLine size={17}/>}</span><div><div className="inventory-movement-title"><strong>{movement.reference}</strong><b>{movement.type==='RECEIPT'?'Phiếu nhập':'Phiếu xuất'}</b></div><p>{item?.ingredientName} · {item?.lotCode} · <strong>{number.format(movement.quantity)} {item?.unit}</strong></p><p className="inventory-movement-note">{movement.note}</p><small><UserRound size={12}/>{movement.actorName} · Thực hiện {dateTime(movement.occurredAt)} · Ghi nhận {dateTime(movement.recordedAt)}</small></div><em>DEMO</em></article>})}</div>:<div className="empty-state inventory-list-empty"><Search size={34}/><h3>Không tìm thấy phiếu phù hợp</h3><p>Thử đổi từ khóa hoặc loại phiếu đang lọc.</p></div>}
        <div className="table-note"><AlertCircle size={15}/>Danh sách chỉ gồm phiếu thuộc kho được gán cho tài khoản bếp. Số tồn và báo cáo tổng hợp vẫn chỉ hiển thị cho BGH và Uỷ ban.</div>
      </section>
    </div>
  }

  if(!canRead) return <section className="card"><div className="empty-state"><AlertCircle size={38}/><h3>Không có quyền truy cập</h3><p>Báo cáo xuất–nhập–tồn chỉ dành cho BGH và Uỷ ban trong đúng phạm vi được giao.</p></div></section>

  const belowMinimum=rows.filter(row=>row.closingBalance<row.minimumStock).length
  return <div className="inventory-page">
    <div className="inventory-kpis" aria-label="Tổng quan xuất nhập tồn"><div className="card"><Boxes size={20}/><strong>{rows.length}</strong><span>Mặt hàng đang theo dõi</span></div><div className="card"><ArrowDownToLine size={20}/><strong>{movements.filter(item=>item.type==='RECEIPT').length}</strong><span>Phiếu nhập DEMO</span></div><div className="card"><ArrowUpFromLine size={20}/><strong>{movements.filter(item=>item.type==='ISSUE').length}</strong><span>Phiếu xuất DEMO</span></div><div className={`card ${belowMinimum?'inventory-warning':''}`}><AlertCircle size={20}/><strong>{belowMinimum}</strong><span>Mặt hàng dưới định mức</span></div></div>
    <section className="card inventory-report" aria-labelledby="inventory-report-title"><div className="card-header"><div><div className="section-kicker">BÁO CÁO NỘI BỘ · CHỈ BGH VÀ UỶ BAN</div><h2 id="inventory-report-title">Xuất – nhập – tồn nguyên liệu</h2><p className="muted">{role==='school_board'?school.name:'Toàn địa bàn phường Bình Hưng Hoà'} · Dữ liệu minh họa</p></div><span className="inventory-lock"><Check size={17}/> Quyền xem</span></div>
      <div className="table-scroll"><table><thead><tr><th>Nguyên liệu / lô</th><th>Đơn vị</th><th>Tồn đầu</th><th>Nhập</th><th>Xuất</th><th>Tồn cuối</th><th>Kho / trường</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><strong>{row.ingredientName}</strong><small>{row.lotCode} · HSD {new Date(`${row.expiresAt}T12:00:00`).toLocaleDateString('vi-VN')}</small></td><td>{row.unit}</td><td>{number.format(row.openingBalance)}</td><td className="inventory-in">+{number.format(row.received)}</td><td className="inventory-out">−{number.format(row.issued)}</td><td><strong>{number.format(row.closingBalance)}</strong>{row.closingBalance<row.minimumStock&&<small className="low-stock">Dưới định mức {number.format(row.minimumStock)} {row.unit}</small>}</td><td>{row.kitchenName}<small>{row.schoolName}</small></td></tr>)}</tbody></table></div>
      <div className="table-note"><AlertCircle size={15}/>Tồn cuối được tính từ tồn đầu + nhập − xuất. Không trộn cộng các mặt hàng có đơn vị khác nhau.</div>
    </section>
    <section className="card inventory-audit" aria-labelledby="inventory-audit-title"><div className="card-header"><div><div className="section-kicker">DẤU VẾT THAO TÁC</div><h2 id="inventory-audit-title">Phiếu gần đây</h2></div><Clock3 size={21}/></div><div className="inventory-movements">{movements.slice(0,8).map(movement=>{const item=inventoryItems.find(value=>value.id===movement.itemId);return <article key={movement.id}><span className={movement.type==='RECEIPT'?'receipt':'issue'}>{movement.type==='RECEIPT'?<ArrowDownToLine size={17}/>:<ArrowUpFromLine size={17}/>}</span><div><strong>{movement.type==='RECEIPT'?'Nhập kho':'Xuất kho'} · {item?.ingredientName}</strong><p>{movement.reference} · {number.format(movement.quantity)} {item?.unit}</p><small><UserRound size={12}/>{movement.actorName} · {dateTime(movement.recordedAt)}</small></div><em>DEMO</em></article>})}</div><div className="table-note"><UserRound size={15}/>Người thực hiện trên mọi phiếu là tài khoản bếp ăn; BGH và Uỷ ban chỉ có quyền xem trong màn hình này.</div></section>
  </div>
}
