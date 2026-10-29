import { useState } from 'react'
import { Plus, Eye } from 'lucide-react'
import Select from './components/ui/Select'
import WarehouseDialog from './WarehouseDialog'
import { warehouseBalances } from '../packages/domain/stock-detail'
import type { StockIssue, StockProduct, LedgerLot } from '../packages/domain/warehouse-stock'

type Props={items:StockIssue[];products:StockProduct[];lots:LedgerLot[];warehouses:string[];canEdit:boolean;actorName:string;focusId?:string;onCommit:(issue:StockIssue)=>void}
const number=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:3})
const money=new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0})
const nowInput=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date()).replace(' ','T')

function IssueForm({initial,products,lots,warehouses,actorName,onCommit,onClose}:{initial:StockIssue|null;onClose:()=>void}&Pick<Props,'products'|'lots'|'warehouses'|'actorName'|'onCommit'>){
 const [id]=useState(()=>initial?.id??crypto.randomUUID())
 const [warehouse,setWarehouse]=useState(initial?.branch??warehouses[0]??'')
 const [productId,setProductId]=useState(initial?.productId??'')
 const [lotNumber,setLotNumber]=useState(initial?.lotNumber??'')
 const [quantity,setQuantity]=useState(String(initial?.quantity??''))
 const [date,setDate]=useState(initial?.date??nowInput)
 const [error,setError]=useState('')
 const product=products.find(v=>v.id===productId&&v.warehouse===warehouse)
 const balance=product?warehouseBalances([product],lots).find(v=>v.warehouse===warehouse):null
 const available=balance?.available??0
 const submit=(form:HTMLFormElement,status:'draft'|'completed')=>{
  const data=new FormData(form)
  try{onCommit({...initial,id,number:initial?.number??'',date,description:String(data.get('description')??'').trim(),receiver:String(data.get('receiver')??'').trim(),kind:String(data.get('kind')??'Xuất chế biến'),salesDocument:false,branch:warehouse,productId,quantity:Number(quantity),unitPrice:product?.unitCost??0,total:0,status,creator:actorName,lotNumber:lotNumber||undefined,idempotencyKey:initial?.idempotencyKey??id});onClose()}catch(caught){setError(caught instanceof Error?caught.message:'Không lưu được phiếu xuất.')}
 }
 return <WarehouseDialog title={initial?`Phiếu xuất ${initial.number}`:'Thêm phiếu xuất kho'} onClose={onClose} wide><form className="management-form warehouse-issue-form" onSubmit={event=>{event.preventDefault();submit(event.currentTarget,(event.nativeEvent as SubmitEvent).submitter?.getAttribute('value')==='draft'?'draft':'completed')}}>
  <div className="management-form-grid">
   <label>Kho xuất<Select label="Kho xuất" value={warehouse} onValueChange={value=>{setWarehouse(value);setProductId('');setLotNumber('')}} options={warehouses.map(value=>({value,label:value}))}/></label>
   <label>Thời điểm xuất<input type="datetime-local" value={date} onChange={event=>setDate(event.target.value)} required/></label>
   <label className="wide">Hàng hóa<Select label="Hàng hóa xuất" value={productId} onValueChange={value=>{setProductId(value);setLotNumber('')}} options={[{value:'',label:'Chọn mặt hàng tại kho xuất'},...products.filter(v=>v.warehouse===warehouse).map(v=>({value:v.id,label:`${v.code} · ${v.name} (${v.unit})`}))]}/></label>
   <label>Lô xuất<Select label="Lô xuất" value={lotNumber} onValueChange={setLotNumber} options={[{value:'',label:'Tự phân bổ FEFO / phần chưa có lô'},...lots.filter(v=>v.productId===productId&&v.warehouse===warehouse).map(v=>({value:v.number,label:`${v.number} · còn ${number.format(v.remaining)}`}))]}/></label>
   <label>Số lượng xuất ({product?.unit??'đơn vị tồn'})<input aria-label="Số lượng xuất" type="number" min="0.000001" step="any" value={quantity} onChange={event=>setQuantity(event.target.value)} required/></label>
   <label>Người nhận<input name="receiver" defaultValue={initial?.receiver??''} required maxLength={120}/></label>
   <label>Loại xuất<Select label="Loại xuất" name="kind" defaultValue={initial?.kind??'Xuất chế biến'} options={['Xuất chế biến','Xuất sử dụng','Xuất điều chỉnh'].map(value=>({value,label:value}))}/></label>
   <label className="wide">Mục đích xuất<textarea name="description" defaultValue={initial?.description??''} required maxLength={500}/></label>
  </div>
  <div className="warehouse-availability" role="status"><strong>Tồn khả dụng: {number.format(available)} {product?.unit??''}</strong><span>Đã loại tồn hết hạn và giữ chỗ. Giá vốn: {money.format(product?.unitCost??0)} / {product?.unit??'đơn vị'}. Chỉ phiếu hoàn thành mới giảm tồn.</span></div>
  {error&&<p className="error-panel" role="alert">{error}</p>}
  <p className="demo-note">DEMO · Tự phân bổ lô còn hạn theo FEFO khi không chọn lô cụ thể. Giá vốn và số dư được kiểm tra lại khi lưu.</p>
  <div className="management-form-actions"><button type="button" className="outline" onClick={onClose}>Hủy</button><button className="outline" name="action" value="draft">Lưu tạm</button><button className="primary" name="action" value="completed">Hoàn thành phiếu xuất</button></div>
 </form></WarehouseDialog>
}

export default function WarehouseIssueEntry({items,products,lots,warehouses,canEdit,actorName,focusId,onCommit}:Props){
 const [editing,setEditing]=useState<StockIssue|null|undefined>()
 const [viewing,setViewing]=useState<string|null>(null)
 const [query,setQuery]=useState('')
 const current=items.find(v=>v.id===viewing)
 const filtered=items.filter(v=>`${v.number} ${v.receiver} ${v.description}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))
 return <><section className="card management-table-card"><div className="card-header"><div><div className="section-kicker">CHỨNG TỪ VÀ BIẾN ĐỘNG TỒN</div><h2>Danh sách xuất kho</h2></div>{canEdit&&<button className="primary" onClick={()=>setEditing(null)}><Plus size={16}/>Thêm phiếu xuất</button>}</div><div className="management-toolbar"><label className="grow">Tìm phiếu xuất<input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Mã phiếu, người nhận, mục đích…"/></label></div><div className="table-scroll"><table><thead><tr><th>Số phiếu</th><th>Thời điểm</th><th>Kho xuất</th><th>Hàng hóa</th><th>Số lượng</th><th>Giá trị</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{filtered.map(item=><tr key={item.id} id={`warehouse-document-${item.id}`} className={item.id===focusId?'selected-row':undefined}><td>{item.number}</td><td>{new Date(item.date).toLocaleString('vi-VN')}</td><td>{item.branch}</td><td>{products.find(v=>v.id===item.productId)?.name??'Mặt hàng lịch sử'}</td><td>{number.format(item.quantity)}</td><td>{money.format(item.total)}</td><td><span className={`management-badge ${item.status}`}>{item.status==='completed'?'Hoàn thành':'Lưu tạm · Chưa trừ tồn'}</span></td><td><button className="text-button" onClick={()=>setViewing(item.id)} aria-label={`Xem phiếu ${item.number}`}><Eye size={16}/>Chi tiết</button>{canEdit&&item.status==='draft'&&<button className="text-button" onClick={()=>setEditing(item)}>Mở bản nháp</button>}</td></tr>)}</tbody></table></div>{!filtered.length&&<div className="empty-state"><h3>Chưa có phiếu xuất phù hợp</h3></div>}</section>
 {editing!==undefined&&<IssueForm key={editing?.id??'new'} initial={editing??null} products={products} lots={lots} warehouses={warehouses} actorName={actorName} onCommit={onCommit} onClose={()=>setEditing(undefined)}/>}
 {current&&<WarehouseDialog title={`Chi tiết phiếu ${current.number}`} onClose={()=>setViewing(null)}><div className="management-detail-grid"><div><span>Kho xuất</span><strong>{current.branch}</strong></div><div><span>Người nhận</span><strong>{current.receiver}</strong></div><div><span>Số lượng</span><strong>{number.format(current.quantity)}</strong></div><div><span>Trạng thái</span><strong>{current.status==='completed'?'Hoàn thành':'Bản nháp'}</strong></div></div><p>{current.description}</p><ul>{current.allocations?.map((line,index)=><li key={index}>{line.lotNumber??'Chưa định danh lô'}: {number.format(line.quantity)}</li>)}</ul><p className="demo-note">{current.completedAt?`Ghi sổ DEMO: ${new Date(current.completedAt).toLocaleString('vi-VN')}`:'Bản ghi lịch sử hoặc chưa ghi sổ trong sổ kho mới.'}</p></WarehouseDialog>}
 </>
}
