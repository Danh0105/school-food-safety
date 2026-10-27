export type Supplier = {
  id:string
  code:string
  name:string
  contact:string
  phone:string
  email:string
  address:string
  taxCode:string
  note:string
  debt:number
  totalPurchase:number
  status:'active'|'inactive'
}

export const supplierSeeds:Supplier[] = [
  {id:'supplier-demo-trace',code:'DEMO-TRACE-20261019-4a3ce246',name:'DEMO - Nhà cung cấp nguyên liệu',contact:'Nguyễn Minh An',phone:'090 100 2001',email:'demo.nguyenlieu@example.vn',address:'Phường Bình Hưng Hoà, TP.HCM',taxCode:'DEMO-031001001',note:'Nhà cung cấp minh họa cho chuỗi truy xuất.',debt:810000,totalPurchase:810000,status:'active'},
  {id:'supplier-kido',code:'NCC000007',name:'Kido Hàng Hóa',contact:'Trần Thu Hà',phone:'090 100 2007',email:'hanghoa@example.vn',address:'Quận Tân Phú, TP.HCM',taxCode:'DEMO-031001007',note:'Dữ liệu minh họa.',debt:470000,totalPurchase:671800,status:'active'},
  {id:'supplier-farm',code:'NCC000008',name:'Nông trại Xanh',contact:'Lê Hoàng Nam',phone:'090 100 2008',email:'nongtraixanh@example.vn',address:'Đà Lạt, Lâm Đồng',taxCode:'DEMO-580100008',note:'Rau củ theo mùa.',debt:0,totalPurchase:1245000,status:'active'},
  {id:'supplier-rice',code:'NCC000009',name:'HTX Nông nghiệp An Phú',contact:'Phạm Thanh Hương',phone:'090 100 2009',email:'htxanphu@example.vn',address:'Đồng bằng sông Cửu Long',taxCode:'DEMO-150100009',note:'Gạo và nông sản khô.',debt:0,totalPurchase:2130000,status:'active'},
  {id:'supplier-meat',code:'NCC000010',name:'Thực phẩm An Tâm',contact:'Võ Đức Minh',phone:'090 100 2010',email:'antam@example.vn',address:'Huyện Hóc Môn, TP.HCM',taxCode:'DEMO-031001010',note:'Thực phẩm tươi sống DEMO.',debt:0,totalPurchase:1980000,status:'active'},
  {id:'supplier-water',code:'NCC000011',name:'Nước uống Học Đường',contact:'Đỗ Ngọc Mai',phone:'090 100 2011',email:'nuocuong@example.vn',address:'Quận Bình Tân, TP.HCM',taxCode:'DEMO-031001011',note:'Nước uống đóng chai.',debt:0,totalPurchase:540000,status:'inactive'},
]

const storageKey='demo-suppliers-v1'

export function readSuppliers():Supplier[]{
  try{
    const parsed:unknown=JSON.parse(localStorage.getItem(storageKey)??'null')
    if(!Array.isArray(parsed)) return supplierSeeds
    const valid=parsed.filter((item):item is Supplier=>typeof item==='object'&&item!==null&&typeof (item as Supplier).id==='string'&&typeof (item as Supplier).code==='string'&&typeof (item as Supplier).name==='string')
    return valid.length?valid:supplierSeeds
  }catch{return supplierSeeds}
}

export function saveSuppliers(items:Supplier[]){localStorage.setItem(storageKey,JSON.stringify(items))}
