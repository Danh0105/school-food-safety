import { create } from 'zustand'
export type ViewRole = 'parent'|'school_board'|'central_kitchen'|'school_receiver'|'meal_service_staff'|'school_kitchen'|'culture_social_office'
/** Giữ năm không gian DEMO; tiếp nhận và phục vụ được xác nhận tại không gian nhà trường. */
export type ActiveViewRole = Extract<ViewRole,'parent'|'school_board'|'culture_social_office'|'central_kitchen'|'school_kitchen'>
export const availableViewRoles:readonly ActiveViewRole[] = ['parent','school_board','culture_social_office','central_kitchen','school_kitchen']
export const isActiveViewRole = (value:ViewRole):value is ActiveViewRole => availableViewRoles.some(role=>role===value)
export type CentralKitchenRole = 'manager'|'head_chef'|'prep'|'cook'|'packing'|'dispatcher'|'sanitation'
export const centralKitchenRoleLabels:Record<CentralKitchenRole,string>={manager:'Quản lý bếp trung tâm',head_chef:'Bếp trưởng',prep:'Nhân viên sơ chế',cook:'Nhân viên nấu chính',packing:'Nhân viên chia suất & đóng gói',dispatcher:'Điều phối giao nhận',sanitation:'Nhân viên vệ sinh bếp'}
export const centralKitchenRouteAccess:Record<CentralKitchenRole,string[]>={manager:['/','/thuc-don','/giam-sat','/van-hanh','/nhan-su-bep','/ma-qr-suat-an','/quan-ly-kho','/nha-cung-cap','/ho-so','/phan-anh','/bao-cao'],head_chef:['/','/thuc-don','/giam-sat','/van-hanh','/nhan-su-bep','/quan-ly-kho'],prep:['/','/thuc-don','/giam-sat','/van-hanh'],cook:['/','/thuc-don','/giam-sat','/van-hanh'],packing:['/','/thuc-don','/van-hanh','/ma-qr-suat-an'],dispatcher:['/','/van-hanh','/ma-qr-suat-an','/quan-ly-kho'],sanitation:['/','/giam-sat','/ho-so']}
type UI = { schoolId: string; date: string; role:ViewRole; kitchenRole:CentralKitchenRole; setRole:(role:ViewRole)=>void; setKitchenRole:(role:CentralKitchenRole)=>void; setSchool: (id: string) => void; setDate: (date: string) => void }
type UIContext = Pick<UI,'schoolId'|'date'|'role'|'kitchenRole'>
const contextKey = 'demo-ui-context-v1'
const defaultContext:UIContext = {schoolId:'an-phu',date:'2026-10-17',role:'parent',kitchenRole:'manager'}
function readContext():UIContext {
 try {
  const raw:unknown=JSON.parse(localStorage.getItem(contextKey)??'null')
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return defaultContext
  const value=raw as Partial<UIContext>
  const validDate=typeof value.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value.date)&&Number.isFinite(Date.parse(value.date))&&new Date(value.date).toISOString().slice(0,10)===value.date
  return {schoolId:typeof value.schoolId==='string'&&value.schoolId.length>0&&value.schoolId.length<100?value.schoolId:defaultContext.schoolId,date:validDate?value.date!:defaultContext.date,role:value.role&&isActiveViewRole(value.role)?value.role:'parent',kitchenRole:value.kitchenRole&&Object.hasOwn(centralKitchenRoleLabels,value.kitchenRole)?value.kitchenRole:'manager'}
 } catch {return defaultContext}
}
export const useUI = create<UI>(set => ({...readContext(),setRole:role=>set({role:isActiveViewRole(role)?role:'parent'}),setKitchenRole:kitchenRole=>set({kitchenRole}),setSchool: schoolId => set({schoolId}), setDate: date => set({date}) }))
// Chỉ lưu lựa chọn giao diện DEMO, không lưu token hoặc coi vai trò này là quyền truy cập thật.
useUI.subscribe(({schoolId,date,role,kitchenRole})=>{
 try {localStorage.setItem(contextKey,JSON.stringify({schoolId,date,role,kitchenRole}))} catch {/* Bộ nhớ bị chặn: vẫn cho sử dụng giao diện trong phiên hiện tại. */}
})
