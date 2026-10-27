export type GradeLevel = 'KINDERGARTEN' | 'PRIMARY' | 'SECONDARY' | 'HIGH_SCHOOL'
export type BoardingMealType = 'BREAKFAST' | 'LUNCH' | 'SNACK'

export type BoardingDish = {
  id: string
  schoolId: string
  gradeLevel: GradeLevel
  serviceDate: string
  mealType: BoardingMealType
  name: string
  ingredients: string[]
  description: string
  priority: number
  expectedQuantity: number
  createdAt: string
  updatedAt: string
  demo: true
}

export type DishTemplate = Pick<BoardingDish, 'name' | 'ingredients' | 'description'> & { id: string }

export const BOARDING_MENU_STORAGE_KEY = 'demo-boarding-menu-v1'

export const gradeOptions: { value: GradeLevel; label: string }[] = [
  { value: 'KINDERGARTEN', label: 'Mầm non' },
  { value: 'PRIMARY', label: 'Tiểu học' },
  { value: 'SECONDARY', label: 'THCS' },
  { value: 'HIGH_SCHOOL', label: 'THPT' },
]

export const mealTypeOptions: { value: BoardingMealType; label: string }[] = [
  { value: 'BREAKFAST', label: 'Ăn sáng' },
  { value: 'LUNCH', label: 'Ăn trưa' },
  { value: 'SNACK', label: 'Ăn xế' },
]

export const dishTemplates: DishTemplate[] = [
  { id: 'chao-ga', name: 'Cháo gà rau củ', ingredients: ['Gạo tẻ', 'Thịt gà', 'Cà rốt', 'Hành lá'], description: 'Cháo nấu mềm cùng thịt gà và rau củ theo mùa.' },
  { id: 'bun-bo', name: 'Bún bò rau xanh', ingredients: ['Bún tươi', 'Thịt bò', 'Rau xanh', 'Nước dùng'], description: 'Bún bò dùng kèm rau xanh, khẩu phần theo khối lớp.' },
  { id: 'com-ga', name: 'Cơm gà kho gừng', ingredients: ['Cơm trắng', 'Thịt gà', 'Gừng', 'Rau luộc'], description: 'Cơm trắng, gà kho gừng và rau luộc trong bữa trưa.' },
  { id: 'ca-sot', name: 'Cá sốt cà chua', ingredients: ['Cá phi lê', 'Cà chua', 'Hành', 'Gia vị'], description: 'Cá phi lê sốt cà chua, dùng cùng cơm và canh trong ngày.' },
  { id: 'sua-trai-cay', name: 'Sữa chua và trái cây', ingredients: ['Sữa chua', 'Trái cây theo mùa'], description: 'Bữa xế nhẹ với sữa chua và trái cây theo mùa.' },
]

const pad = (value: number) => String(value).padStart(2, '0')
export const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
export const parseIsoDate = (value: string) => new Date(`${value}T12:00:00`)
export const addDays = (value: string, amount: number) => {
  const date = parseIsoDate(value)
  date.setDate(date.getDate() + amount)
  return toIsoDate(date)
}
export const mondayOfWeek = (value: string) => {
  const date = parseIsoDate(value)
  const weekday = date.getDay() || 7
  date.setDate(date.getDate() - weekday + 1)
  return toIsoDate(date)
}
export const weekFromMonday = (monday: string) => Array.from({ length: 7 }, (_, index) => addDays(monday, index))

const seedMenu = (): BoardingDish[] => {
  const monday = '2026-10-12'
  const dates = weekFromMonday(monday)
  const now = '2026-10-12T08:00:00+07:00'
  const lunchNames = ['Thịt heo kho trứng', 'Cá sốt cà chua', 'Gà kho gừng', 'Bò xào rau củ', 'Cá thu kho thơm', 'Mì xào gà', 'Cơm chiên rau củ']
  const items: BoardingDish[] = []
  dates.forEach((serviceDate, index) => {
    items.push({ id: `demo-lunch-${index}`, schoolId: 'an-phu', gradeLevel: 'PRIMARY', serviceDate, mealType: 'LUNCH', name: lunchNames[index]!, ingredients: ['Cơm trắng', lunchNames[index]!, 'Canh rau củ'], description: 'Thực đơn bữa trưa minh họa theo kế hoạch tuần.', priority: 1, expectedQuantity: 485, createdAt: now, updatedAt: now, demo: true })
    if (index < 5) items.push({ id: `demo-breakfast-${index}`, schoolId: 'an-phu', gradeLevel: 'PRIMARY', serviceDate, mealType: 'BREAKFAST', name: index % 2 ? 'Bún thịt rau xanh' : 'Cháo gà rau củ', ingredients: index % 2 ? ['Bún tươi', 'Thịt heo', 'Rau xanh'] : ['Gạo tẻ', 'Thịt gà', 'Cà rốt'], description: 'Bữa sáng minh họa, định lượng chưa được xác minh.', priority: 1, expectedQuantity: 470, createdAt: now, updatedAt: now, demo: true })
    if (index < 4) items.push({ id: `demo-snack-${index}`, schoolId: 'an-phu', gradeLevel: 'PRIMARY', serviceDate, mealType: 'SNACK', name: index % 2 ? 'Bánh mềm và sữa' : 'Sữa chua và trái cây', ingredients: index % 2 ? ['Bánh mềm', 'Sữa'] : ['Sữa chua', 'Trái cây theo mùa'], description: 'Bữa xế minh họa theo kế hoạch nhà trường.', priority: 1, expectedQuantity: 465, createdAt: now, updatedAt: now, demo: true })
  })
  return items
}

const isBoardingDish = (value: unknown): value is BoardingDish => {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string'
    && typeof item.schoolId === 'string'
    && gradeOptions.some(option => option.value === item.gradeLevel)
    && typeof item.serviceDate === 'string'
    && mealTypeOptions.some(option => option.value === item.mealType)
    && typeof item.name === 'string'
    && Array.isArray(item.ingredients)
    && item.ingredients.every(ingredient => typeof ingredient === 'string')
    && typeof item.description === 'string'
    && typeof item.priority === 'number'
    && Number.isInteger(item.priority)
    && item.priority >= 0
    && typeof item.expectedQuantity === 'number'
    && Number.isInteger(item.expectedQuantity)
    && item.expectedQuantity >= 0
    && typeof item.createdAt === 'string'
    && typeof item.updatedAt === 'string'
    && item.demo === true
}

export const boardingMenuRepository = {
  load(): BoardingDish[] {
    const raw = localStorage.getItem(BOARDING_MENU_STORAGE_KEY)
    if (!raw) return seedMenu()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every(isBoardingDish)) throw new Error('Dữ liệu thực đơn DEMO trên trình duyệt không đúng định dạng.')
    return parsed
  },
  save(items: BoardingDish[]) {
    localStorage.setItem(BOARDING_MENU_STORAGE_KEY, JSON.stringify(items))
  },
  seed: seedMenu,
}
