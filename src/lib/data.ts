export type School = { id: string; name: string; address: string; mode: 'ON_SITE' | 'CENTRAL_KITCHEN' }
export type MealEvent = { status: string; label: string; time: string; actor: string; confirmed: boolean }
export type DayData = { servings: number; suppliers: number; dishes: string[]; events: MealEvent[]; kitchen: string; photo: string; updatedAt: string }
export type Feedback = { id: string; schoolId: string; kind: string; content: string; status: string; createdAt: string }
export const demo = true
export const schools: School[] = [
  { id: 'an-phu', name: 'Tiểu học An Phú', address: 'Phường An Phú · Thành phố Hồ Chí Minh', mode: 'CENTRAL_KITCHEN' },
  { id: 'binh-an', name: 'Mầm non Bình An', address: 'Phường An Phú · Thành phố Hồ Chí Minh', mode: 'ON_SITE' },
  { id: 'an-khanh', name: 'THCS An Khánh', address: 'Phường An Phú · Thành phố Hồ Chí Minh', mode: 'ON_SITE' },
]
export const foodPhoto = '/meal-demo.jpg'
const dishes = [ ['Cơm trắng', 'Gà kho gừng', 'Canh bí đỏ thịt bằm', 'Rau cải xào', 'Thanh long'], ['Cơm trắng', 'Thịt heo kho trứng', 'Canh rau ngót', 'Bông cải luộc', 'Chuối chín'], ['Cơm trắng', 'Cá sốt cà chua', 'Canh củ quả', 'Rau muống xào', 'Dưa hấu'] ]
const pause = () => new Promise(resolve => setTimeout(resolve, 280))
function readFeedback(): Feedback[] {
  try { const value: unknown = JSON.parse(localStorage.getItem("demo-feedback") ?? "[]"); return Array.isArray(value) ? value.filter((item): item is Feedback => typeof item === "object" && item !== null && typeof item.id === "string" && typeof item.content === "string" && typeof item.createdAt === "string") : [] } catch { return [] }
}
export const demoData = {
  reply: (id:string):string => {try{return (JSON.parse(localStorage.getItem('demo-replies')??'{}') as Record<string,string>)[id]??''}catch{return ''}},
  schools: async (): Promise<School[]> => (await pause(), schools),
  day: async (school: School, date: string): Promise<DayData> => {
    await pause()
    const stored = JSON.parse(localStorage.getItem('demo-admin-meals') ?? '[]') as {schoolId:string;date:string;servings:number;dishes:string[];events:{status:string;time:string;confirmed:boolean}[]}[]
    const saved = stored.find(m => m.schoolId===school.id && m.date===date)
    const central = school.mode === 'CENTRAL_KITCHEN'
    return { servings: saved?.servings ?? (school.id === 'an-phu' ? 485 : school.id === 'binh-an' ? 216 : 360), suppliers: 4, dishes: saved?.dishes ?? dishes[new Date(`${date}T12:00:00`).getDay() % 3]!, kitchen: central ? 'Bếp trung tâm An Tâm' : 'Bếp ăn nhà trường', photo: foodPhoto, updatedAt: '10:45', events: saved ? saved.events.map(e=>({status:e.status,label:({DISPATCHED:'Xuất bếp',ARRIVED:'Đến trường',PLATED:'Ra món',READY:'Sẵn sàng phục vụ'} as Record<string,string>)[e.status] ?? e.status,time:e.time,actor:'Người thao tác DEMO',confirmed:e.confirmed})) : [
      ...(central ? [{ status: 'DISPATCHED', label: 'Xuất bếp', time: '09:30', actor: 'Bếp trung tâm An Tâm', confirmed: true }, { status: 'ARRIVED', label: 'Đến trường', time: '10:00', actor: 'Nhân viên tiếp nhận', confirmed: true }] : []),
      { status: 'PLATED', label: 'Ra món', time: '10:20', actor: 'Nhân viên bếp', confirmed: true }, { status: 'READY', label: 'Sẵn sàng phục vụ', time: '10:45', actor: 'Nhân viên bếp', confirmed: false },
    ] }
  },
  feedback: async (): Promise<Feedback[]> => readFeedback(),
  sendFeedback: async (input: Omit<Feedback, 'id' | 'status' | 'createdAt'>): Promise<Feedback> => {
    await pause(); const item = { ...input, id: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, status: 'received', createdAt: new Date().toISOString() }
    const all = await demoData.feedback(); localStorage.setItem('demo-feedback', JSON.stringify([item, ...all])); return item
  },
}
