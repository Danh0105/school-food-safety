import { describe,it,expect } from 'vitest'
import {assertTransition,canMonitorMeal,canReadFeedback,canReadInventory,canRecordInventory,canRespond,canUpdateMealMenu} from './policy'
import type {Actor,Service} from './policy'
const board:Actor={id:'b',role:'school_board',schoolId:'s',kitchenId:null,wardId:'w'}
const kitchen:Actor={id:'k',role:'central_kitchen',schoolId:null,kitchenId:'k',wardId:'w'}
const schoolKitchen:Actor={id:'sk',role:'school_kitchen',schoolId:'s',kitchenId:'k',wardId:'w'}
const onsite:Service={id:'m',schoolId:'s',kitchenId:null,mode:'ON_SITE',status:'PREPARING',version:1}
describe('Meal state machine',()=>{
 it('rejects READY before PLATED',()=>expect(()=>assertTransition(onsite,'READY',board,['p'],1)).toThrow('INVALID_TRANSITION'))
 it('allows ON_SITE plating then ready',()=>{expect(()=>assertTransition(onsite,'PLATED',board,['p'],1)).not.toThrow();expect(()=>assertTransition({...onsite,status:'PLATED',version:2},'READY',board,['q'],2)).not.toThrow()})
 it('allows the assigned on-site kitchen to report plating',()=>{expect(()=>assertTransition(onsite,'PLATED',schoolKitchen,['p'],1)).not.toThrow();expect(()=>assertTransition(onsite,'PLATED',{...schoolKitchen,schoolId:'other'},['p'],1)).toThrow('FORBIDDEN')})
 it('requires distinct photos in request',()=>{expect(()=>assertTransition(onsite,'PLATED',board,[],1)).toThrow('PHOTOS_REQUIRED');expect(()=>assertTransition(onsite,'PLATED',board,['p','p'],1)).toThrow('PHOTOS_REQUIRED')})
 it('blocks cross school and stale versions',()=>{expect(()=>assertTransition(onsite,'PLATED',{...board,schoolId:'other'},['p'],1)).toThrow('FORBIDDEN');expect(()=>assertTransition(onsite,'PLATED',board,['p'],0)).toThrow('VERSION_CONFLICT')})
 it('only assigned kitchen dispatches, kitchen cannot receive',()=>{const central:Service={...onsite,kitchenId:'k',mode:'CENTRAL_KITCHEN'};expect(()=>assertTransition(central,'DISPATCHED',kitchen,['p'],1)).not.toThrow();expect(()=>assertTransition(central,'DISPATCHED',{...kitchen,kitchenId:'other'},['p'],1)).toThrow('FORBIDDEN');expect(()=>assertTransition({...central,status:'DISPATCHED'},'ARRIVED',kitchen,['p'],1)).toThrow('FORBIDDEN')})
 it('allows central kitchen sequence with scoped actors',()=>{let s:Service={...onsite,kitchenId:'k',mode:'CENTRAL_KITCHEN'};for(const next of ['DISPATCHED','ARRIVED','PLATED','READY'] as const){assertTransition(s,next,next==='DISPATCHED'?kitchen:board,[next],s.version);s={...s,status:next,version:s.version+1}}})
})
describe('Feedback permissions',()=>{
 const record={parentId:'p',schoolId:'s',wardId:'w',kitchenId:'k'}
 it('parent cannot read another parent record',()=>{expect(canReadFeedback({...board,id:'other',role:'parent'},record)).toBe(false);expect(canReadFeedback({...board,id:'p',role:'parent'},record)).toBe(true)})
 it('kitchen sees related case but cannot respond',()=>{expect(canReadFeedback(kitchen,record)).toBe(true);expect(canRespond(kitchen,'s')).toBe(false)})
 it('board and ward access limited to scope',()=>{expect(canReadFeedback({...board,schoolId:'other'},record)).toBe(false);expect(canReadFeedback({...board,role:'culture_social_office',wardId:'other'},record)).toBe(false);expect(canRespond(board,'s')).toBe(true)})
})
describe('Inventory permissions',()=>{
 const record={schoolId:'s',wardId:'w',kitchenId:'k'}
 it('only scoped school board and ward can read stock balances',()=>{
  expect(canReadInventory(board,record)).toBe(true)
  expect(canReadInventory({...board,schoolId:'other'},record)).toBe(false)
  expect(canReadInventory({...board,role:'culture_social_office'},record)).toBe(true)
  expect(canReadInventory({...board,role:'culture_social_office',wardId:'other'},record)).toBe(false)
  expect(canReadInventory(kitchen,record)).toBe(false)
  expect(canReadInventory({...board,role:'parent'},record)).toBe(false)
 })
 it('only the assigned kitchen account can record receipts and issues',()=>{
  expect(canRecordInventory(kitchen,record)).toBe(true)
  expect(canRecordInventory(schoolKitchen,record)).toBe(true)
  expect(canRecordInventory({...kitchen,kitchenId:'other'},record)).toBe(false)
  expect(canRecordInventory(board,record)).toBe(false)
  expect(canRecordInventory({...board,role:'culture_social_office'},record)).toBe(false)
 })
})

describe('Meal monitoring permissions',()=>{
 const meal={schoolId:'s',wardId:'w'}
 it('lets Phòng VH-XH monitor only schools in its ward',()=>{
  expect(canMonitorMeal({...board,role:'culture_social_office'},meal)).toBe(true)
  expect(canMonitorMeal({...board,role:'culture_social_office',wardId:'other'},meal)).toBe(false)
  expect(canMonitorMeal(board,meal)).toBe(false)
 })
 it('keeps menu and portion updates with the scoped school board',()=>{
  expect(canUpdateMealMenu(board,meal)).toBe(true)
  expect(canUpdateMealMenu({...board,schoolId:'other'},meal)).toBe(false)
  expect(canUpdateMealMenu({...board,role:'culture_social_office'},meal)).toBe(false)
  expect(canUpdateMealMenu(kitchen,meal)).toBe(false)
 })
})
