import { describe,it,expect } from 'vitest'
import {assertTransition,canReadFeedback,canRespond} from './policy'
import type {Actor,Service} from './policy'
const board:Actor={id:'b',role:'school_board',schoolId:'s',kitchenId:null,wardId:'w'}
const kitchen:Actor={id:'k',role:'central_kitchen',schoolId:null,kitchenId:'k',wardId:'w'}
const onsite:Service={id:'m',schoolId:'s',kitchenId:null,mode:'ON_SITE',status:'PREPARING',version:1}
describe('Meal state machine',()=>{
 it('rejects READY before PLATED',()=>expect(()=>assertTransition(onsite,'READY',board,['p'],1)).toThrow('INVALID_TRANSITION'))
 it('allows ON_SITE plating then ready',()=>{expect(()=>assertTransition(onsite,'PLATED',board,['p'],1)).not.toThrow();expect(()=>assertTransition({...onsite,status:'PLATED',version:2},'READY',board,['q'],2)).not.toThrow()})
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
