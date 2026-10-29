import WarehouseDialog from './WarehouseDialog'
import { Check, Truck } from 'lucide-react'
import WarehouseIssueEntry from './WarehouseIssueEntry'
import WarehouseTransferEntry from './WarehouseTransferEntry'
import type { TransferEntryResult } from './WarehouseTransferEntry'
import { STOCK_BOOK_KEY, postReceipt, postIssue, postTransfer } from '../packages/domain/warehouse-stock'
import type { StockBook, StockProduct, StockIssue } from '../packages/domain/warehouse-stock'
import type { TransferVoucher } from '../packages/domain/warehouse-transfer'
import { localToday, expiryWarningDays } from './lib/warehouseSettings'
import { useDemoStorageRefresh } from './lib/demoStorage'
import { setDemoStorageItem } from './lib/demoStorage'
import Select from './components/ui/Select'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, BarChart3, Boxes, ChevronLeft, ChevronRight, Clock3, Plus, QrCode, RefreshCw, Search, Tags, Warehouse } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { School } from './lib/data'
import type { ViewRole } from './lib/store'
import './WarehouseManagement.css'
import StockDetail from './StockDetail'
import WarehouseReceiptEntry from './WarehouseReceiptEntry'
import type { WarehouseLot, WarehouseReceipt } from './WarehouseReceiptEntry'
import { warehouseBalances } from '../packages/domain/stock-detail'
import type { MovementDocument } from '../packages/domain/stock-detail'

type Tab='overview'|'stock'|'receipts'|'issues'|'transfers'|'lots'|'trace'
type StockStatus='valid'|'expiring'|'expired'|'out'|'low'
type Product=StockProduct
type Lot=WarehouseLot
type Receipt=WarehouseReceipt
type Issue=StockIssue
type Transfer=TransferVoucher

const money=new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0})
const number=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2})
const names=['Bánh mì','Bánh mì không','Bánh snack','Bút chì','Bút quạt','Bút thử','Canh chua','Chả','Cơm gà xối mỡ','Cơm rang dưa bò','Cơm sườn nướng','Cơm tấm','Cơm thịt kho trứng','Dầu ăn','Gạo','Thịt heo','Kẹo mút','Kẹo viên','Rau','Nước uống','Sữa tiệt trùng','Cá phi lê','Thịt gà','Trứng gà','Bí đỏ','Rau cải','Nước mắm','Đường','Muối','Mì sợi','Thanh long']
const categories=['Bán trú','Nguyên liệu, vật liệu','Ăn vặt','Học tập','Tiện ích','Đồ uống','Sữa','Snack']
const warehouses=['Canteen Trường Học A','Canteen Trường Học B','Kho Chi Nhánh']
const productSeeds:Product[]=names.map((name,index)=>{const quantity=index%9===0?0:index%7===0?4:18+(index*13)%90;const minimum=8+(index%4)*4;const status:StockStatus=quantity===0?'out':quantity<minimum?'low':index%13===0?'expired':index%6===0?'expiring':'valid';return{id:`product-${index+1}`,code:`HH${String(index+1).padStart(5,'0')}`,name,category:categories[index%categories.length]!,warehouse:warehouses[index%warehouses.length]!,quantity,reserved:index%5,unit:index%4===0?'cái':index%3===0?'lít':'kg',minimum,unitCost:12000+(index*7300)%95000,status}})
const lotSeeds:Lot[]=Array.from({length:16},(_,index)=>{const product=productSeeds[(index*2+7)%productSeeds.length]!;const expired=index===0;const expiring=index>0&&index<6;return{id:`lot-${index+1}`,number:`DEMO-LO-${String(index+1).padStart(3,'0')}`,productId:product.id,warehouse:product.warehouse,manufacturedAt:`2026-${String(8+(index%3)).padStart(2,'0')}-${String(2+(index%20)).padStart(2,'0')}`,expiresAt:expired?'2026-10-18':expiring?`2026-10-${20+index}`:`2027-${String(1+(index%7)).padStart(2,'0')}-15`,remaining:Math.max(0,product.quantity-index),status:expired?'expired':expiring?'expiring':'active'}})
const receiptSeeds:Receipt[]=[{id:'receipt-1',number:'NK000001',date:'2026-10-17T06:30',supplier:'DEMO - Nhà cung cấp nguyên liệu',warehouse:warehouses[0]!,total:810000,payment:'unpaid',status:'completed',creator:'Admin'},{id:'receipt-2',number:'NK000002',date:'2026-10-18T07:15',supplier:'Kido Hàng Hóa',warehouse:warehouses[1]!,total:470000,payment:'paid',status:'completed',creator:'Admin'}]
const issueSeeds:Issue[]=[{id:'issue-1',number:'XK000001',date:'2026-10-18T08:20',description:'Xuất nguyên liệu bữa trưa',total:380000,receiver:'Nguyễn Thị Lan',salesDocument:false,kind:'Xuất chế biến',branch:warehouses[0]!,productId:'product-15',quantity:24,unitPrice:15833,status:'completed'},{id:'issue-2',number:'XK000002',date:'2026-10-18T13:10',description:'Xuất bữa xế',total:201600,receiver:'Lê Thị Hòa',salesDocument:false,kind:'Xuất sử dụng',branch:warehouses[1]!,productId:'product-21',quantity:216,unitPrice:933,status:'completed'}]
const transferSeeds:Transfer[]=[{id:'transfer-1',number:'CK000001',date:'2026-10-18T09:15',from:warehouses[2]!,to:warehouses[0]!,total:560000,status:'completed',creator:'Admin',productId:'product-15',quantity:20}]

const tabs:{id:Tab;label:string;icon:LucideIcon}[]=[{id:'overview',label:'Tổng quan',icon:BarChart3},{id:'stock',label:'Tồn kho',icon:Boxes},{id:'receipts',label:'Nhập kho',icon:ArrowDownToLine},{id:'issues',label:'Xuất kho',icon:ArrowUpFromLine},{id:'transfers',label:'Chuyển kho',icon:ArrowLeftRight},{id:'lots',label:'Lô hàng',icon:Tags},{id:'trace',label:'Truy xuất nguồn gốc',icon:QrCode}]
const statusLabels:Record<string,string>={valid:'Hợp lệ',expiring:'Sắp hết hạn',expired:'Có hàng hết hạn',out:'Hết hàng',low:'Tồn thấp'}
const tabDescriptions:Record<Tab,string>={overview:'Tổng hợp tồn kho, cảnh báo và xu hướng vận hành.',stock:'Mỗi dòng là tồn của một mặt hàng trong một kho.',receipts:'Theo dõi và tạo phiếu nhập kho từ nhà cung cấp.',issues:'Theo dõi phiếu xuất và chi tiết hàng hóa.',transfers:'Điều phối hàng hóa giữa các kho và căn tin.',lots:'Theo dõi tồn kho theo lô, serial và hạn sử dụng.',trace:'Tra cứu chuỗi lô hàng và nhật ký dịch chuyển DEMO.'}

function stored<T>(key:string,seeds:T[]):T[]{const raw=localStorage.getItem(key);if(raw===null)return seeds;try{let parsed:unknown;try{parsed=JSON.parse(raw)}catch{throw new Error('Sổ kho đã lưu không phải JSON hợp lệ. Không tự reset dữ liệu.')};if(Array.isArray(parsed))return parsed as T[]}catch{/* giữ nguyên dữ liệu lỗi */}throw new Error('Không đọc được dữ liệu kho cũ tại '+key+'. Bản lưu được giữ nguyên để kiểm tra.');}
function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){return <WarehouseDialog title={title} onClose={onClose} wide={wide}>{children}</WarehouseDialog>}
function Badge({tone,children}:{tone:string;children:ReactNode}){return <span className={`management-badge ${tone}`}>{children}</span>}
function CsvButton({rows,name}:{rows:string[][];name:string}){return <button className="outline" onClick={()=>{const csv='\uFEFF'+rows.map(row=>row.map(value=>`"${value.replaceAll('"','""')}"`).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const link=document.createElement('a');link.href=url;link.download=name;link.click();URL.revokeObjectURL(url)}}><ArrowDownToLine size={16}/>Xuất CSV</button>}

function Overview({products,lots,receipts,issues,onTab}:{products:Product[];lots:Lot[];receipts:Receipt[];issues:Issue[];onTab:(tab:Tab)=>void}){
 const balances=products.map(product=>({product,balance:warehouseBalances([product],lots).find(v=>v.warehouse===product.warehouse)!}))
 const low=balances.filter(v=>v.balance.belowMinimum)
 const value=balances.reduce((sum,v)=>sum+v.balance.value,0)
 const expiring=lots.filter(v=>v.status==='expiring'&&v.remaining>0),expired=lots.filter(v=>v.status==='expired'&&v.remaining>0)
 const receiptDrafts=receipts.filter(v=>v.status==='draft').length,issueDrafts=issues.filter(v=>v.status==='draft').length
 const today=localToday();const dates=Array.from({length:7},(_,i)=>{const d=new Date(today+'T12:00:00');d.setDate(d.getDate()-6+i);return d.toLocaleDateString('sv-SE')})
 const days=dates.map(date=>({date,in:receipts.filter(v=>v.status==='completed'&&v.date.slice(0,10)===date).length,out:issues.filter(v=>v.status==='completed'&&v.date.slice(0,10)===date).length}))
 const maxCount=Math.max(1,...days.flatMap(v=>[v.in,v.out]))
 const consumption=new Map<string,{name:string;quantity:number}>();for(const issue of issues.filter(v=>v.status==='completed')){const product=products.find(v=>v.id===issue.productId);if(product?.unit==='kg'){const current=consumption.get(product.code)??{name:product.name,quantity:0};consumption.set(product.code,{name:current.name,quantity:current.quantity+issue.quantity})}}
 const top=[...consumption.values()].sort((a,b)=>b.quantity-a.quantity).slice(0,5),maxUsage=Math.max(1,...top.map(v=>v.quantity))
 const kpis:{label:string;value:string|number;tab:Tab}[]=[{label:'Dòng tồn mặt hàng / kho',value:products.length,tab:'stock'},{label:'Giá trị tồn ước tính',value:money.format(value),tab:'stock'},{label:'Dưới định mức khả dụng',value:low.length,tab:'stock'},{label:'Lô sắp hết hạn',value:expiring.length,tab:'lots'},{label:'Lô hết hạn còn tồn',value:expired.length,tab:'lots'},{label:'Phiếu nhập bản nháp',value:receiptDrafts,tab:'receipts'},{label:'Phiếu xuất bản nháp',value:issueDrafts,tab:'issues'}]
 return <div className="warehouse-overview"><div className="warehouse-kpis">{kpis.map(kpi=><article className="card" key={kpi.label}><span>{kpi.label}</span><strong>{kpi.value}</strong><button className="text-button" onClick={()=>onTab(kpi.tab)}>Xem danh sách</button></article>)}</div>
 <div className="warehouse-chart-grid"><section className="card warehouse-chart"><header><div><span>PHIẾU ĐÃ HOÀN THÀNH · 7 NGÀY GẦN NHẤT</span><h3>Nhập / xuất theo ngày</h3></div></header><div className="bar-chart" aria-label="Số phiếu nhập và xuất đã hoàn thành theo ngày">{days.map(day=><div key={day.date}><span title={day.in+' phiếu nhập ngày '+day.date} style={{height:(day.in/maxCount*120)+'px'}}/><i title={day.out+' phiếu xuất ngày '+day.date} style={{height:(day.out/maxCount*120)+'px'}}/><small>{day.date.slice(8)}/{day.date.slice(5,7)}</small></div>)}</div><footer><span className="receipt-dot"/>Phiếu nhập <span className="issue-dot"/>Phiếu xuất</footer></section>
 <section className="card horizontal-chart"><span>CHỈ CÁC PHIẾU XUẤT ĐÃ HOÀN THÀNH · CÙNG ĐƠN VỊ KG</span><h3>Nguyên liệu đã xuất</h3>{top.length?top.map(item=><div key={item.name}><label>{item.name}<strong>{number.format(item.quantity)} kg</strong></label><span><i style={{width:(item.quantity/maxUsage*100)+'%'}}/></span></div>):<p className="muted">Chưa có phiếu xuất nguyên liệu theo kg.</p>}</section></div>
 <section className="card warehouse-stock-rule"><h3>Cách tính tồn kho</h3><p>Phiếu nhập hoàn thành cộng tồn; phiếu xuất hoàn thành trừ tồn; bản nháp không thay đổi số dư. Khả dụng = tồn thực tế − tồn hết hạn − giữ chỗ hợp lệ.</p><p className="demo-note">Dữ liệu DEMO trong một sổ cục bộ. Không cộng chung số lượng có đơn vị khác nhau; dữ liệu trước khi chuyển sổ cần đối soát riêng.</p></section></div>
}

function Stock({products,lots,receipts,issues,transfers,onOpenDocument}:{products:Product[];lots:Lot[];receipts:Receipt[];issues:Issue[];transfers:Transfer[];onOpenDocument:(document:MovementDocument)=>void}){
  const [query,setQuery]=useState('');const [warehouse,setWarehouse]=useState('all');const [category,setCategory]=useState('all');const [status,setStatus]=useState('all');const [page,setPage]=useState(1);const [detail,setDetail]=useState<Product|null>(null)
  const detailProduct=products.find(item=>item.id===detail?.id);
  const filtered=products.filter(item=>(!query||`${item.code} ${item.name}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))&&(warehouse==='all'||item.warehouse===warehouse)&&(category==='all'||item.category===category)&&(status==='all'||item.status===status));const pages=Math.max(1,Math.ceil(filtered.length/10));const visible=filtered.slice((page-1)*10,page*10)
  const balanceOf=(item:Product)=>warehouseBalances([item],lots).find(balance=>balance.warehouse===item.warehouse)!
  return <><section className="card management-table-card"><div className="card-header"><div><div className="section-kicker">TỒN THEO MẶT HÀNG VÀ KHO</div><h2>Tồn kho tổng hợp</h2><p className="muted">Mỗi dòng là tồn của một mặt hàng trong một kho.</p></div><CsvButton name="ton-kho-DEMO.csv" rows={[['Mã hàng','Tên hàng','Kho','Tồn thực tế','Đơn vị'],...filtered.map(item=>[item.code,item.name,item.warehouse,String(balanceOf(item).onHand),item.unit])]}/></div><div className="management-toolbar"><label className="grow"><span>Tìm hàng hóa</span><div><Search size={15}/><input value={query} onChange={event=>{setQuery(event.target.value);setPage(1)}} placeholder="Mã hoặc tên hàng…"/></div></label><label><span>Kho</span><Select label="Kho" size="sm" value={warehouse} onValueChange={value=>{setWarehouse(value);setPage(1)}}><option value="all">Tất cả kho</option>{warehouses.map(item=><option key={item}>{item}</option>)}</Select></label><label><span>Phân loại</span><Select label="Phân loại" size="sm" value={category} onValueChange={value=>{setCategory(value);setPage(1)}}><option value="all">Tất cả nhóm</option>{categories.map(item=><option key={item}>{item}</option>)}</Select></label><label><span>Trạng thái</span><Select label="Trạng thái" size="sm" value={status} onValueChange={value=>{setStatus(value);setPage(1)}}><option value="all">Tất cả</option>{Object.entries(statusLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</Select></label></div><div className="table-scroll"><table><thead><tr><th>Mã hàng</th><th>Tên hàng</th><th>Phân loại</th><th>Kho</th><th>Tồn thực tế</th><th>Đã giữ chỗ</th><th>Khả dụng</th><th>Đơn vị</th><th>Trạng thái</th><th>Chi tiết</th></tr></thead><tbody>{visible.map(item=><tr key={item.id}><td><strong>{item.code}</strong></td><td>{item.name}</td><td>{item.category}</td><td>{item.warehouse}</td><td>{number.format(balanceOf(item).onHand)}</td><td>{number.format(item.reserved)}</td><td><strong>{number.format(balanceOf(item).available)}</strong></td><td>{item.unit}</td><td><Badge tone={item.status}>{statusLabels[item.status]}</Badge></td><td><button className="text-button" aria-label={`Xem chi tiết tồn kho ${item.code}`} onClick={()=>setDetail(item)}>Chi tiết</button></td></tr>)}</tbody></table></div><footer className="management-pagination"><span>{filtered.length} mặt hàng</span><div><button aria-label="Trang trước" disabled={page<=1} onClick={()=>setPage(value=>value-1)}><ChevronLeft/></button><strong>{page}/{pages}</strong><button aria-label="Trang sau" disabled={page>=pages} onClick={()=>setPage(value=>value+1)}><ChevronRight/></button></div></footer></section>{detailProduct&&<Modal title={`Chi tiết tồn kho · ${detailProduct.name}`} onClose={()=>setDetail(null)} wide><StockDetail key={detailProduct.code} product={detailProduct} rows={products.filter(item=>item.code===detailProduct.code)} lots={lots} receipts={receipts} issues={issues} transfers={transfers} onOpenDocument={document=>{setDetail(null);onOpenDocument(document)}}/></Modal>}</>
}

function LotsTab({lots,products,receipts,onReceipt,canEdit,onOpenStock}:{lots:Lot[];products:Product[];receipts:Receipt[];onReceipt:()=>void;canEdit:boolean;onOpenStock:(id:string)=>void}){
 const [subtab,setSubtab]=useState<'lots'|'serial'>('lots'),[query,setQuery]=useState(''),[lotId,setLotId]=useState<string|null>(null)
 const current=lots.find(v=>v.id===lotId),currentProduct=products.find(v=>v.id===current?.productId)
 const filtered=lots.filter(lot=>{const product=products.find(v=>v.id===lot.productId);return (lot.number+' '+(product?.code??'')+' '+(product?.name??'')).toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))})
 const serials=receipts.filter(v=>v.status==='completed').flatMap(receipt=>(receipt.lines??[]).flatMap(line=>line.serials.map(serial=>({id:receipt.id+'-'+line.id+'-'+serial,serial,name:line.productName,receipt:receipt.number}))))
 return <><section className="card management-table-card"><div className="card-header"><div><div className="section-kicker">LÔ VÀ HẠN DÙNG ĐƯỢC KHAI BÁO</div><h2>Lô hàng hóa</h2></div>{canEdit&&<button className="primary" onClick={onReceipt}><Plus size={16}/>Nhập kho</button>}</div>
 <div className="management-subtabs"><button className={subtab==='lots'?'active':''} onClick={()=>setSubtab('lots')}>Lô hàng</button><button className={subtab==='serial'?'active':''} onClick={()=>setSubtab('serial')}>Serial</button></div>
 {subtab==='lots'?<><div className="management-toolbar"><label className="grow">Tìm lô hàng<input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Mã lô, mã hoặc tên hàng…"/></label></div><div className="table-scroll" tabIndex={0} role="region" aria-label="Danh sách lô có thể cuộn"><table><thead><tr><th>Số lô</th><th>Hàng hóa</th><th>Kho</th><th>Hạn sử dụng</th><th>Tồn theo lô</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{filtered.map(lot=>{const product=products.find(v=>v.id===lot.productId);return <tr key={lot.id}><td>{lot.number}</td><td>{product?.name??'Chưa liên kết mặt hàng'}<small>{product?.code}</small></td><td>{lot.warehouse}</td><td>{lot.expiresAt||'Chưa ghi nhận'}</td><td>{number.format(lot.remaining)} {product?.unit}</td><td><Badge tone={lot.status}>{lot.remaining<=0?'Hết hàng':lot.status==='expired'?'Hết hạn':lot.status==='expiring'?'Sắp hết hạn':'Còn hạn'}</Badge></td><td><button className="text-button" onClick={()=>setLotId(lot.id)} aria-label={'Xem lô '+lot.number}>Chi tiết</button></td></tr>})}</tbody></table></div></>:serials.length?<div className="serial-grid">{serials.map(item=><article key={item.id}><QrCode size={20}/><div><strong>{item.serial}</strong><span>{item.name} · {item.receipt}</span></div></article>)}</div>:<div className="empty-state"><h3>Chưa có serial trong phiếu nhập hoàn thành</h3><p>Không tự tạo serial hoặc QR minh họa khi chưa có dữ liệu liên kết.</p></div>}
 </section>{current&&currentProduct&&<Modal title={'Chi tiết lô · '+current.number} onClose={()=>setLotId(null)}><div className="management-detail-grid"><div><span>Mặt hàng</span><strong>{currentProduct.name}</strong></div><div><span>Kho</span><strong>{current.warehouse}</strong></div><div><span>Tồn theo lô</span><strong>{number.format(current.remaining)} {currentProduct.unit}</strong></div><div><span>Ngày sản xuất</span><strong>{current.manufacturedAt||'Chưa ghi nhận'}</strong></div><div><span>Hạn sử dụng</span><strong>{current.expiresAt||'Chưa ghi nhận'}</strong></div></div><button className="primary" onClick={()=>{onOpenStock(currentProduct.id);setLotId(null)}}>Xem tồn kho và lịch sử mặt hàng</button></Modal>}</>
}

function TraceTab({lots,products}:{lots:Lot[];products:Product[]}){const [query,setQuery]=useState('');const result=lots.find(lot=>{const product=products.find(item=>item.id===lot.productId)!;return query&&`${lot.number} ${product.code} ${product.name}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))});const product=result?products.find(item=>item.id===result.productId):null;return <section className="card trace-search"><div className="section-kicker">TRA CỨU THEO LÔ · KHÔNG CHỨA PII</div><h2>Truy xuất nguồn gốc</h2><p>Nhập số lô, mã hàng hoặc tên hàng để xem chuỗi thông tin DEMO.</p><label><Search/><input aria-label="Tìm lô truy xuất" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Ví dụ: DEMO-LO-001 hoặc HH00008"/></label>{query&&!result&&<div className="empty-state"><Search/><h3>Không tìm thấy lô phù hợp</h3><p>Kiểm tra lại số lô hoặc mã hàng.</p></div>}{result&&product&&<div className="trace-result"><header><div><Badge tone={result.status}>{result.status==='active'?'Còn sử dụng':result.status==='expiring'?'Sắp hết hạn':'Đã hết hạn'}</Badge><h3>{product.name}</h3><p>{product.code} · {result.number}</p></div><QrCode size={52}/></header><div className="trace-timeline"><p><Check/>Lô đã được ghi nhận trong sổ kho DEMO</p><p><Truck/>Nhập {result.warehouse} · {new Date(`${result.manufacturedAt}T12:00:00`).toLocaleDateString('vi-VN')}</p><p><Warehouse/>Còn tồn {number.format(result.remaining)} {product.unit}</p><p><Clock3/>Hạn sử dụng {new Date(`${result.expiresAt}T12:00:00`).toLocaleDateString('vi-VN')}</p></div><p className="demo-note">Chuỗi truy xuất minh họa, không công khai hóa đơn, chứng từ nội bộ hoặc dữ liệu cá nhân.</p></div>}</section>}


function seedBook():StockBook{
 const legacyImported=['demo-warehouse-products','demo-warehouse-lots','demo-warehouse-receipts','demo-warehouse-issues','demo-warehouse-transfers','demo-inventory-movements'].some(key=>localStorage.getItem(key)!==null)
 return {version:0,products:stored('demo-warehouse-products',productSeeds),lots:stored('demo-warehouse-lots',lotSeeds),receipts:stored('demo-warehouse-receipts',receiptSeeds),issues:stored('demo-warehouse-issues',issueSeeds),transfers:stored('demo-warehouse-transfers',transferSeeds),audit:[],legacyImported}
}
function normalizeBook(book:StockBook):StockBook{
 const today=localToday();const deadline=new Date(today+'T12:00:00');deadline.setDate(deadline.getDate()+expiryWarningDays());const soon=deadline.toLocaleDateString('sv-SE')
 const lots=book.lots.map(lot=>({...lot,status:lot.expiresAt&&lot.expiresAt<today?'expired' as const:lot.expiresAt&&lot.expiresAt<=soon?'expiring' as const:'active' as const}))
 const products=book.products.map(product=>{const balance=warehouseBalances([product],lots).find(v=>v.warehouse===product.warehouse)!;return {...product,status:balance.available<=0?'out':balance.available<product.minimum?'low':balance.expired>0?'expired':lots.some(v=>v.productId===product.id&&v.status==='expiring')?'expiring':'valid'}})
 return {...book,lots,products}
}
function readBook():StockBook{
 const raw=localStorage.getItem(STOCK_BOOK_KEY);if(raw===null)return normalizeBook(seedBook())
 let parsed:unknown;try{parsed=JSON.parse(raw)}catch{throw new Error('Sổ kho đã lưu không phải JSON hợp lệ. Không tự reset dữ liệu.')}
 if(!parsed||typeof parsed!=='object')throw new Error('Sổ kho không hợp lệ. Dữ liệu được giữ nguyên; cần kiểm tra bản lưu.')
 const value=parsed as StockBook
 if(!Number.isInteger(value.version)||!['products','lots','receipts','issues','transfers','audit'].every(key=>Array.isArray((value as unknown as Record<string,unknown>)[key])))throw new Error('Cấu trúc sổ kho không hợp lệ. Không tự reset dữ liệu.')
 return normalizeBook(value)
}
export default function WarehouseManagement({role,school}:{role:ViewRole;school:School}){
 const [initial]=useState(()=>{try{return {book:readBook(),error:''}}catch(caught){return {book:{version:0,products:[],lots:[],receipts:[],issues:[],transfers:[],audit:[]} as StockBook,error:caught instanceof Error?caught.message:'Không đọc được sổ kho.'}}})
 const [book,setBook]=useState(initial.book);const [error,setError]=useState(initial.error)
 const [tab,setTab]=useState<Tab>('overview');const [focus,setFocus]=useState<MovementDocument|null>(null);const [lotStockId,setLotStockId]=useState('')
 const {products,lots,receipts,issues,transfers}=book
 const lotStockProduct=products.find(v=>v.id===lotStockId)
 const canRead=['school_board','central_kitchen','school_kitchen','culture_social_office'].includes(role)
 const canEdit=role==='central_kitchen'||role==='school_kitchen'||role==='school_board'
 const actorName=role==='school_board'?'Ban Giám hiệu DEMO':role==='central_kitchen'?'Bếp trung tâm DEMO':'Bếp tại trường DEMO'
 const refresh=()=>{try{setBook(readBook());setError('')}catch(caught){setError(caught instanceof Error?caught.message:'Không đọc được sổ kho.')}}
 useDemoStorageRefresh([STOCK_BOOK_KEY],refresh)
 useEffect(()=>{if(focus)requestAnimationFrame(()=>document.getElementById('warehouse-document-'+focus.id)?.scrollIntoView({block:'center'}))},[focus,tab])
 const goTo=(next:Tab)=>{setFocus(null);setTab(next)}
 const openDocument=(document:MovementDocument)=>{setFocus(document);setTab(document.type==='receipt'?'receipts':document.type==='issue'?'issues':'transfers')}
 const commit=(operation:(fresh:StockBook)=>StockBook):StockBook=>{
  if(!canEdit)throw new Error('Không có quyền ghi sổ kho.')
  const fresh=readBook();if(fresh.version!==book.version){setBook(fresh);throw new Error('Sổ kho vừa thay đổi ở tab khác. Kiểm tra lại dữ liệu và gửi lại.')}
  const next=operation(fresh)
  try{setDemoStorageItem(STOCK_BOOK_KEY,JSON.stringify(next))}catch{throw new Error('Không thể lưu sổ kho: bộ nhớ đầy hoặc bị chặn. Phiếu và số dư chưa thay đổi.')}
  setBook(normalizeBook(next));setError('');return next
 }
 const options=()=>({now:new Date().toISOString(),newId:()=>crypto.randomUUID()})
 const commitTransfer=(voucher:TransferVoucher,status:'draft'|'completed'):TransferEntryResult=>{
  try{const next=commit(fresh=>postTransfer(fresh,{...voucher,status,creator:actorName},options()));return {ok:true,voucher:next.transfers.find(v=>v.id===voucher.id)!}}
  catch(caught){return {ok:false,problems:[{code:'STORAGE_FAILED',message:caught instanceof Error?caught.message:'Không lưu được phiếu chuyển kho.',lineIds:[]}]}}
 }
 if(!canRead)return <section className="card management-access-denied"><AlertCircle/><h2>Không có quyền truy cập</h2></section>
 if(error&&!products.length)return <section className="card error-panel" role="alert"><h2>Chưa mở được sổ kho</h2><p>{error}</p><button className="outline" onClick={refresh}>Thử lại</button></section>
 return <div className="management-page warehouse-management"><header className="management-page-header"><div><div className="section-kicker">MỘT SỔ KHO · DỮ LIỆU MINH HỌA</div><h2>Quản lý kho</h2><p>{tabDescriptions[tab]} Đang xem: {school.name} · Danh mục kho DEMO dùng chung.</p></div><div className="management-header-actions"><button className="outline" onClick={refresh}><RefreshCw size={16}/>Làm mới</button>{canEdit&&<button className="primary" onClick={()=>goTo('issues')}><ArrowUpFromLine size={16}/>Xuất kho</button>}</div></header>
 <nav className="management-tabs" aria-label="Phân hệ quản lý kho">{tabs.map(item=><button key={item.id} className={tab===item.id?'active':''} aria-current={tab===item.id?'page':undefined} onClick={()=>goTo(item.id)}><item.icon size={16}/>{item.label}</button>)}</nav>
 {!canEdit&&<div className="management-readonly"><AlertCircle size={17}/>Chế độ chỉ đọc; không tạo, sửa hoặc hoàn thành phiếu kho.</div>}
 {book.legacyImported&&<p className="demo-note">Số dư DEMO cũ được giữ làm số dư chuyển tiếp; không cộng/trừ lại phiếu lịch sử. Dữ liệu module Xuất nhập tồn cũ vẫn được giữ trong trình duyệt để đối soát, chưa tự gộp do khác mã hàng/kho.</p>}
 {error&&<p className="error-panel" role="alert">{error}</p>}
 {tab==='overview'&&<Overview products={products} lots={lots} receipts={receipts} issues={issues} onTab={goTo}/>}
 {tab==='stock'&&<Stock products={products} lots={lots} receipts={receipts} issues={issues} transfers={transfers} onOpenDocument={openDocument}/>}
 {tab==='receipts'&&<WarehouseReceiptEntry items={receipts} products={products} lots={lots} warehouses={warehouses} canEdit={canEdit} focusId={focus?.type==='receipt'?focus.id:undefined} onCommitted={receipt=>{commit(fresh=>postReceipt(fresh,{...receipt,creator:actorName},options()))}}/>}
 {tab==='issues'&&<WarehouseIssueEntry items={issues} products={products} lots={lots} warehouses={warehouses} canEdit={canEdit} actorName={actorName} focusId={focus?.type==='issue'?focus.id:undefined} onCommit={issue=>{commit(fresh=>postIssue(fresh,{...issue,creator:actorName},options()))}}/>}
 {tab==='transfers'&&<WarehouseTransferEntry vouchers={transfers} products={products} lots={lots} warehouses={warehouses} canEdit={canEdit} actorName={actorName} focusId={focus?.type==='transfer'?focus.id:undefined} onSaveDraft={voucher=>commitTransfer(voucher,'draft')} onComplete={voucher=>commitTransfer(voucher,'completed')}/>}
 {tab==='lots'&&<LotsTab lots={lots} products={products} receipts={receipts} onReceipt={()=>goTo('receipts')} canEdit={canEdit} onOpenStock={setLotStockId}/>}
 {tab==='trace'&&<TraceTab lots={lots} products={products}/>}
 {lotStockProduct&&<Modal title={'Chi tiết tồn kho · '+lotStockProduct.name} onClose={()=>setLotStockId('')} wide><StockDetail product={lotStockProduct} rows={products.filter(v=>v.code===lotStockProduct.code)} lots={lots} receipts={receipts} issues={issues} transfers={transfers} onOpenDocument={document=>{setLotStockId('');openDocument(document)}}/></Modal>}
 </div>
}
