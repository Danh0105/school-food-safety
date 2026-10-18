import { create } from 'zustand'
export type ViewRole = 'parent'|'school_board'|'central_kitchen'|'school_kitchen'|'culture_social_office'
type UI = { schoolId: string; date: string; role:ViewRole; setRole:(role:ViewRole)=>void; setSchool: (id: string) => void; setDate: (date: string) => void }
export const useUI = create<UI>(set => ({ schoolId: 'an-phu', date: '2026-10-17', role:'parent',setRole:role=>set({role}),setSchool: schoolId => set({schoolId}), setDate: date => set({date}) }))
