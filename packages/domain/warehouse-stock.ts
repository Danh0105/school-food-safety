import { warehouseBalances, sortLots } from './stock-detail'
import type { StockRow, StockLot } from './stock-detail'
import { completeTransfer } from './warehouse-transfer'
import type { TransferVoucher } from './warehouse-transfer'
import { baseQuantity, configuredUnits, lineAmountVnd } from './warehouse-receipt'

export const STOCK_BOOK_KEY='demo-warehouse-stock-book-v2'
export type StockProduct=StockRow&{name:string;category:string;status:string}
export type LedgerLot=StockLot&{manufacturedAt:string;expiresAt:string}
export type ReceiptLine={id:string;productId:string;productCode:string;productName:string;lotNumber:string;manufacturedAt:string;expiresAt:string;quantity:number;unit:string;conversionFactor:number;baseQuantity:number;unitPrice:number;amount:number;serials:string[]}
export type StockReceipt={id:string;number:string;date:string;supplier:string;supplierId?:string;warehouse:string;total:number;payment:'paid'|'unpaid';status:'draft'|'completed';creator:string;kind?:string;description?:string;reference?:string;purchaseInvoiceId?:string;invoiceNumber?:string;fileName?:string;idempotencyKey?:string;lines?:ReceiptLine[];productId?:string;quantity?:number;unitPrice?:number;lotNumber?:string;version?:number;completedAt?:string}
export type StockAllocation={lotId:string|null;lotNumber:string|null;quantity:number}
export type StockIssue={id:string;number:string;date:string;description:string;total:number;receiver:string;salesDocument:boolean;kind:string;branch:string;productId:string;quantity:number;unitPrice:number;status:'draft'|'completed';creator?:string;lotNumber?:string;allocations?:StockAllocation[];idempotencyKey?:string;version?:number;completedAt?:string}
export type StockAudit={id:string;at:string;actor:string;action:'receipt'|'issue'|'transfer';documentId:string;status:'draft'|'completed'}
export type StockBook={version:number;products:StockProduct[];lots:LedgerLot[];receipts:StockReceipt[];issues:StockIssue[];transfers:TransferVoucher[];audit:StockAudit[];legacyImported?:boolean}
type Options={now:string;newId:()=>string}
const round=(value:number)=>Math.round(value*1e6)/1e6
const positive=(n:number)=>Number.isFinite(n)&&n>0
function fail(message:string):never{throw new Error(message)}
const upsert=<T extends {id:string}>(items:T[],item:T)=>items.some(v=>v.id===item.id)?items.map(v=>v.id===item.id?item:v):[item,...items]
export function nextStockNumber(items:readonly {number:string}[],prefix:string){return prefix+String(1+items.reduce((max,v)=>Math.max(max,Number(v.number.match(new RegExp('^'+prefix+'(\\d+)$'))?.[1]??0)),0)).padStart(6,'0')}
function guard<T extends {id:string;status:string;version?:number}>(items:T[],candidate:T){
 const old=items.find(v=>v.id===candidate.id)
 if(old?.status==='completed')fail('Phiếu đã hoàn thành; không thể ghi sổ hoặc chỉnh sửa lần nữa.')
 if(old&&(old.version??0)!==(candidate.version??0))fail('Phiếu đã thay đổi ở tab khác. Hãy mở lại bản mới nhất.')
 return old
}
function finish(book:StockBook,action:StockAudit['action'],document:{id:string;status:'draft'|'completed';creator?:string},options:Options):StockBook{
 return {...book,version:book.version+1,audit:[...book.audit,{id:options.newId(),at:options.now,actor:document.creator??'Tài khoản DEMO',action,documentId:document.id,status:document.status}]}
}
function validHeader(date:string,warehouse:string){if(!warehouse||!date||!Number.isFinite(Date.parse(date)))fail('Chọn kho và thời điểm hợp lệ.')}

/** Nhập đúng kho, quy đổi về đơn vị tồn và ghi cả chứng từ + lô + số dư trong một snapshot. */
export function postReceipt(book:StockBook,input:StockReceipt,options:Options):StockBook{
 const old=guard(book.receipts,input)
 if(book.receipts.some(v=>v.id!==input.id&&v.idempotencyKey&&v.idempotencyKey===input.idempotencyKey))fail('Yêu cầu nhập kho đã được ghi nhận.')
 validHeader(input.date,input.warehouse)
 if(!input.lines?.length)fail('Phiếu nhập phải có ít nhất một dòng hàng.')
 const products=book.products.map(v=>({...v})),lots=book.lots.map(v=>({...v}))
 const seen=new Set<string>()
 const lines=input.lines.map(line=>{
  const source=products.find(v=>v.id===line.productId)??fail('Mặt hàng nhập không còn tồn tại.')
  const factor=configuredUnits(source).find(v=>v.code===line.unit)?.factor
  const quantity=factor?baseQuantity(String(line.quantity),factor):null
  const amount=lineAmountVnd(String(line.quantity),String(line.unitPrice))
  if(quantity===null||amount===null||!positive(quantity)||!Number.isInteger(line.unitPrice)||line.unitPrice<0)fail('Số lượng, đơn vị quy đổi hoặc đơn giá nhập không hợp lệ.')
  if(input.kind==='RAW_MATERIALS'&&(!line.lotNumber||!line.manufacturedAt||!line.expiresAt))fail('Nguyên liệu phải có mã lô, ngày sản xuất và hạn dùng.')
  if(line.expiresAt&&(!line.manufacturedAt||line.expiresAt<line.manufacturedAt))fail('Ngày hết hạn phải sau hoặc bằng ngày sản xuất.')
  const key=line.lotNumber.trim().toLocaleLowerCase('vi')
  if(key&&seen.has(key))fail('Trùng số lô trong phiếu nhập.');if(key)seen.add(key)
  let target=products.find(v=>v.code===source.code&&v.warehouse===input.warehouse)
  if(!target){target={...source,id:options.newId(),warehouse:input.warehouse,quantity:0,reserved:0};products.push(target)}
  const existing=lots.find(v=>v.number.toLocaleLowerCase('vi')===key&&v.warehouse===input.warehouse)
  if(existing&&(existing.productId!==target.id||existing.manufacturedAt!==line.manufacturedAt||existing.expiresAt!==line.expiresAt))fail('Mã lô tại kho nhập đã tồn tại với mặt hàng hoặc hạn dùng khác.')
  if(input.status==='completed'){
   target.unitCost=round((target.quantity*target.unitCost+amount)/(target.quantity+quantity))
   target.quantity=round(target.quantity+quantity)
   if(key){if(existing)existing.remaining=round(existing.remaining+quantity);else lots.push({id:options.newId(),number:line.lotNumber.trim(),productId:target.id,warehouse:input.warehouse,manufacturedAt:line.manufacturedAt,expiresAt:line.expiresAt,remaining:quantity,status:line.expiresAt&&line.expiresAt<options.now.slice(0,10)?'expired':'active'})}
  }
  return {...line,productId:target.id,productCode:target.code,productName:target.name,baseQuantity:quantity,conversionFactor:factor!,amount}
 })
 const receipt:StockReceipt={...input,number:old?.number??nextStockNumber(book.receipts,'NK'),lines,total:lines.reduce((sum,v)=>sum+v.amount,0),productId:lines[0]!.productId,quantity:lines[0]!.baseQuantity,version:(old?.version??0)+1,completedAt:input.status==='completed'?options.now:undefined}
 // Bản nháp không được tạo thêm dòng tồn/kho hoặc thay mã dòng hàng trước khi chốt.
 if(input.status==='draft')receipt.lines=input.lines
 return finish({...book,products:input.status==='completed'?products:book.products,lots:input.status==='completed'?lots:book.lots,receipts:upsert(book.receipts,receipt)},'receipt',receipt,options)
}

/** FEFO theo lô còn sử dụng được, trừ giữ chỗ; không dùng tồn hết hạn để xuất chế biến. */
export function postIssue(book:StockBook,input:StockIssue,options:Options):StockBook{
 const old=guard(book.issues,input);validHeader(input.date,input.branch)
 if(book.issues.some(v=>v.id!==input.id&&v.idempotencyKey&&v.idempotencyKey===input.idempotencyKey))fail('Yêu cầu xuất kho đã được ghi nhận.')
 if(!positive(input.quantity))fail('Số lượng xuất phải là số hữu hạn lớn hơn 0.')
 const products=book.products.map(v=>({...v})),lots=book.lots.map(v=>({...v}))
 const row=products.find(v=>v.id===input.productId&&v.warehouse===input.branch)??fail('Mặt hàng không thuộc kho xuất đã chọn.')
 if(!input.receiver.trim()||!input.description.trim())fail('Nhập người nhận và mục đích xuất kho.')
 const allocations:StockAllocation[]=[]
 if(input.status==='completed'){
  const balance=warehouseBalances([row],lots).find(v=>v.warehouse===row.warehouse)!
  if(balance.lotsExceedBook)fail('Số dư theo lô lớn hơn sổ kho. Cần đối soát trước khi xuất.')
  const eligible=sortLots(lots.filter(v=>v.productId===row.id&&v.warehouse===row.warehouse&&v.status!=='expired'&&(!v.expiresAt||v.expiresAt>=options.now.slice(0,10))))
  const eligibleQuantity=eligible.reduce((sum,v)=>sum+Math.max(0,v.remaining),0)
  const available=Math.max(0,eligibleQuantity+balance.untracked-row.reserved)
  if(input.quantity>available+1e-9)fail(`Số lượng xuất vượt tồn khả dụng (${available.toLocaleString('vi-VN')} ${row.unit}).`)
  let remaining=input.quantity
  const selected=input.lotNumber?eligible.filter(v=>v.number===input.lotNumber):eligible
  if(input.lotNumber&&!selected.length)fail('Lô được chọn không còn sử dụng được tại kho xuất.')
  for(const lot of selected){const used=Math.min(remaining,Math.max(0,lot.remaining));if(used>0){lot.remaining=round(lot.remaining-used);remaining=round(remaining-used);allocations.push({lotId:lot.id,lotNumber:lot.number,quantity:used})}if(remaining<=0)break}
  if(remaining>0){if(input.lotNumber||remaining>balance.untracked+1e-9)fail('Số lượng xuất vượt tồn của lô đã chọn.');allocations.push({lotId:null,lotNumber:null,quantity:remaining})}
  row.quantity=round(row.quantity-input.quantity)
 }
 const issue:StockIssue={...input,number:old?.number??nextStockNumber(book.issues,'XK'),unitPrice:row.unitCost,total:Math.round(input.quantity*row.unitCost),allocations:input.status==='completed'?allocations:undefined,version:(old?.version??0)+1,completedAt:input.status==='completed'?options.now:undefined}
 return finish({...book,products:input.status==='completed'?products:book.products,lots:input.status==='completed'?lots:book.lots,issues:upsert(book.issues,issue)},'issue',issue,options)
}

export function postTransfer(book:StockBook,input:TransferVoucher,options:Options):StockBook{
 const old=guard(book.transfers,input);validHeader(input.date,input.from)
 const voucher={...input,number:old?.number??nextStockNumber(book.transfers,'CK'),status:'draft' as const}
 if(input.status==='draft')return finish({...book,transfers:upsert(book.transfers,{...voucher,version:(old?.version??0)+1})},'transfer',voucher,options)
 const posted=completeTransfer(book,voucher,options)
 return finish({...book,products:posted.products,lots:posted.lots as LedgerLot[],transfers:upsert(book.transfers,posted.voucher)},'transfer',posted.voucher,options)
}
