export type Role = 'parent' | 'school_board' | 'central_kitchen' | 'school_kitchen' | 'culture_social_office' | 'inspector' | 'supplier' | 'system_admin'
export type Actor = { id:string; role:Role; schoolId:string|null; kitchenId:string|null; wardId:string|null }
export type ServiceMode = 'ON_SITE'|'CENTRAL_KITCHEN'
export type Status = 'PREPARING'|'DISPATCHED'|'ARRIVED'|'PLATED'|'READY'
export type Service = { id:string; schoolId:string; kitchenId:string|null; mode:ServiceMode; status:Status; version:number }
const flows: Record<ServiceMode,readonly Status[]> = {ON_SITE:['PREPARING','PLATED','READY'],CENTRAL_KITCHEN:['PREPARING','DISPATCHED','ARRIVED','PLATED','READY']}
export function assertTransition(service:Service,next:Status,actor:Actor,photos:readonly string[],version:number) {
 if(version!==service.version) throw new Error('VERSION_CONFLICT')
 if(!photos.length||new Set(photos).size!==photos.length) throw new Error('PHOTOS_REQUIRED')
 const flow=flows[service.mode];if(flow[flow.indexOf(service.status)+1]!==next) throw new Error('INVALID_TRANSITION')
 if(next==='DISPATCHED') {if(actor.role!=='central_kitchen'||actor.kitchenId!==service.kitchenId) throw new Error('FORBIDDEN')}
 else if(!((actor.role==='school_board'||actor.role==='school_kitchen')&&actor.schoolId===service.schoolId)) throw new Error('FORBIDDEN')
}
export function canReadFeedback(actor:Actor,record:{parentId:string;schoolId:string;wardId:string;kitchenId:string|null}) {
 return (actor.role==='parent'&&record.parentId===actor.id)||(actor.role==='school_board'&&actor.schoolId===record.schoolId)||(actor.role==='culture_social_office'&&actor.wardId===record.wardId)||((actor.role==='central_kitchen'||actor.role==='school_kitchen')&&actor.kitchenId!==null&&actor.kitchenId===record.kitchenId)
}
export function canRespond(actor:Actor,schoolId:string){return actor.role==='school_board'&&actor.schoolId===schoolId}

export type MealMonitoringScope = { schoolId:string; wardId:string }

/** Phòng VH-XH chỉ được đọc dữ liệu bữa ăn của các trường trong địa bàn được giao. */
export function canMonitorMeal(actor:Actor,record:MealMonitoringScope) {
 return actor.role==='culture_social_office'&&actor.wardId!==null&&actor.wardId===record.wardId
}

/** Thực đơn, số suất và định lượng chỉ được cập nhật bởi BGH đúng trường. */
export function canUpdateMealMenu(actor:Actor,record:MealMonitoringScope) {
 return actor.role==='school_board'&&actor.schoolId!==null&&actor.schoolId===record.schoolId
}

export type InventoryScope = { schoolId:string; wardId:string; kitchenId:string }

/** Báo cáo xuất–nhập–tồn chỉ dành cho BGH đúng trường và Uỷ ban đúng địa bàn. */
export function canReadInventory(actor:Actor,record:InventoryScope) {
 return (actor.role==='school_board'&&actor.schoolId===record.schoolId)||(actor.role==='culture_social_office'&&actor.wardId===record.wardId)
}

/** Phiếu nhập/xuất chỉ được ghi nhận bởi tài khoản bếp được gán cho kho. */
export function canRecordInventory(actor:Actor,record:InventoryScope) {
 return (actor.role==='central_kitchen'||actor.role==='school_kitchen')&&actor.kitchenId!==null&&actor.kitchenId===record.kitchenId
}
