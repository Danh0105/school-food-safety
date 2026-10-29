import {
  activePortionQrs,
  assertCanIssuePortionQr,
  canReadPortionQrRegistry,
  encodeOpaqueToken,
  portionServiceKey,
} from '../../packages/domain/portion-qr'
import type { Actor } from '../../packages/domain/policy'
import type { MealType, PortionQrEvent, PortionQrRecord, PortionQrScope } from '../../packages/domain/portion-qr'

export type DemoPortionQr = PortionQrRecord & {
  schoolName: string
  kitchenName: string
  dishNames: string[]
  demo: true
}

type IssueBatch = {
  id: string
  serviceKey: string
  idempotencyKey: string
  quantity: number
  createdAt: string
}

type PortionQrDatabase = {
  records: DemoPortionQr[]
  events: PortionQrEvent[]
  batches: IssueBatch[]
}

export type PortionQrIssueInput = {
  actor: Actor
  scope: PortionQrScope
  quantity: number
  idempotencyKey: string
  schoolName: string
  kitchenName: string
  dishNames: string[]
}

const storageKey = 'demo-portion-qr-v1'
const updateEventName = 'demo-portion-qr-updated'
const emptyDatabase = (): PortionQrDatabase => ({records:[],events:[],batches:[]})

function readDatabase(): PortionQrDatabase {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    if (!value || typeof value !== 'object') return emptyDatabase()
    const database = value as Partial<PortionQrDatabase>
    return {
      records:Array.isArray(database.records) ? database.records : [],
      events:Array.isArray(database.events) ? database.events : [],
      batches:Array.isArray(database.batches) ? database.batches : [],
    }
  } catch {
    return emptyDatabase()
  }
}

function writeDatabase(database: PortionQrDatabase) {
  localStorage.setItem(storageKey,JSON.stringify(database))
  // `storage` is only emitted in other tabs. This event keeps every mounted
  // reader in the current tab (including the BGH workspace) in sync as well.
  window.dispatchEvent(new CustomEvent(updateEventName))
}

export function subscribePortionQrUpdates(listener:()=>void) {
  const onStorage=(event:StorageEvent)=>{
    if(event.key===storageKey) listener()
  }
  window.addEventListener(updateEventName,listener)
  window.addEventListener('storage',onStorage)
  return ()=>{
    window.removeEventListener(updateEventName,listener)
    window.removeEventListener('storage',onStorage)
  }
}

function opaqueToken() {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return encodeOpaqueToken(bytes)
}

const belongsToScope = (record: PortionQrRecord, scope: PortionQrScope) =>
  portionServiceKey(record) === portionServiceKey(scope)

export const portionQrDemo = {
  scopeForSchool(input:{schoolId:string;serviceDate:string;mealType?:MealType}):PortionQrScope {
    const central=input.schoolId==='an-phu'
    return {
      schoolId:input.schoolId,
      kitchenId:central?'kitchen-an-tam':`kitchen-${input.schoolId}`,
      wardId:'ward-binh-hung-hoa',
      serviceMode:central?'CENTRAL_KITCHEN':'ON_SITE',
      serviceDate:input.serviceDate,
      mealType:input.mealType??'LUNCH',
    }
  },

  actorFor(role:Actor['role'],scope:PortionQrScope):Actor {
    return {
      id:role==='central_kitchen'?'kitchen-an-tam.demo-user':`${role}.demo-user`,
      role,
      schoolId:role==='school_board'?scope.schoolId:null,
      kitchenId:role==='central_kitchen'?scope.kitchenId:null,
      wardId:scope.wardId,
    }
  },

  issue(input:PortionQrIssueInput) {
    assertCanIssuePortionQr(input.actor,input.scope,input.quantity)
    const database=readDatabase()
    const serviceKey=portionServiceKey(input.scope)
    const replay=database.batches.find(batch=>batch.serviceKey===serviceKey&&batch.idempotencyKey===input.idempotencyKey)
    if(replay) return database.records.filter(record=>record.batchId===replay.id)
    const existing=activePortionQrs(database.records.filter(record=>belongsToScope(record,input.scope)),database.events)
    if(existing.length) throw new Error('ACTIVE_BATCH_EXISTS')
    const batch:IssueBatch={id:crypto.randomUUID(),serviceKey,idempotencyKey:input.idempotencyKey,quantity:input.quantity,createdAt:new Date().toISOString()}
    const usedTokens=new Set(database.records.map(record=>record.publicToken))
    const records=Array.from({length:input.quantity},(_,index):DemoPortionQr=>{
      let publicToken=opaqueToken()
      while(usedTokens.has(publicToken)) publicToken=opaqueToken()
      usedTokens.add(publicToken)
      return {
        ...input.scope,
        id:crypto.randomUUID(),
        publicToken,
        sequence:index+1,
        batchId:batch.id,
        issuedAt:batch.createdAt,
        issuedBy:input.actor.id,
        schoolName:input.schoolName,
        kitchenName:input.kitchenName,
        dishNames:[...input.dishNames],
        demo:true,
      }
    })
    writeDatabase({...database,batches:[...database.batches,batch],records:[...database.records,...records]})
    return records
  },

  list(actor:Actor,scope:PortionQrScope) {
    if(!canReadPortionQrRegistry(actor,scope)) throw new Error('FORBIDDEN')
    const database=readDatabase()
    const scoped=database.records.filter(record=>belongsToScope(record,scope))
    const activeIds=new Set(activePortionQrs(scoped,database.events).map(record=>record.id))
    return scoped.map(record=>({...record,state:activeIds.has(record.id)?'ACTIVE' as const:'REVOKED' as const})).sort((a,b)=>a.sequence-b.sequence||a.issuedAt.localeCompare(b.issuedAt))
  },

  active(scope:PortionQrScope) {
    const database=readDatabase()
    return activePortionQrs(database.records.filter(record=>belongsToScope(record,scope)),database.events) as DemoPortionQr[]
  },

  revokeActive(actor:Actor,scope:PortionQrScope,reason:string) {
    assertCanIssuePortionQr(actor,scope,1)
    if(reason.trim().length<8) throw new Error('REVOCATION_REASON_REQUIRED')
    const database=readDatabase()
    const active=activePortionQrs(database.records.filter(record=>belongsToScope(record,scope)),database.events)
    if(!active.length) return 0
    const recordedAt=new Date().toISOString()
    const events=active.map((record):PortionQrEvent=>({id:crypto.randomUUID(),portionQrId:record.id,type:'REVOKED',reason:reason.trim(),recordedAt,actorId:actor.id}))
    writeDatabase({...database,events:[...database.events,...events]})
    return events.length
  },

  findPublic(publicToken:string) {
    const database=readDatabase()
    const record=database.records.find(item=>item.publicToken===publicToken)
    if(!record) return null
    const active=activePortionQrs([record],database.events).length===1
    return {record,state:active?'ACTIVE' as const:'REVOKED' as const}
  },
}

export function portionTraceUrl(publicToken:string) {
  return `${window.location.origin}/truy-xuat-suat/${encodeURIComponent(publicToken)}`
}
