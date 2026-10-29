import { setDemoStorageItem } from './demoStorage'
import { useUI } from './store'
import { inventoryItems } from './inventory'

export type GradeLevel = 'KINDERGARTEN' | 'PRIMARY' | 'SECONDARY' | 'HIGH_SCHOOL'
export type BoardingMealType = 'BREAKFAST' | 'LUNCH' | 'SNACK'
export type MealServiceMode = 'ON_SITE' | 'CENTRAL_KITCHEN'
export type BoardingMenuStatus = 'DRAFT' | 'SUBMITTED'

export type KitchenProfile = {
  id: string
  code: string
  name: string
  type: MealServiceMode
  managerName: string
  capacity: number
  assignedSchoolIds: string[]
  active: boolean
  updatedAt: string
  demo: true
}

/** Định lượng dự kiến và khai báo nguồn gốc của từng nguyên liệu. Chưa phải hồ sơ xác nhận. */
export type DishIngredientRecord = {
  /** Mã nguyên liệu/lô thực sự đã chọn trong kho DEMO; không suy đoán từ tên. */
  inventoryItemId?: string
  name: string
  amountPerServing: number | null
  unit: 'g' | 'ml'
  supplier: string
  lotCode: string
  origin: string
}

/** Nhật ký do đơn vị khai báo; không phải kết luận ATTP từ cơ quan chức năng. */
export type DishSafetyMonitoring = {
  threeStep: 'NOT_RECORDED' | 'REPORTED'
  retainedSample: 'NOT_RECORDED' | 'REPORTED'
  supervisor: string
  recordedAt: string
  note: string
}

export type BoardingDish = {
  id: string
  schoolId: string
  gradeLevel: GradeLevel
  serviceDate: string
  mealType: BoardingMealType
  name: string
  /** Món BGH đặt làm mặc định cho học sinh chưa chọn; chỉ một món trong mỗi bữa/ngày. */
  isDefault?: boolean
  imageUrl?: string
  ingredients: string[]
  /** Khối lượng một khẩu phần theo kế hoạch (g), null khi chưa có thông tin. */
  portionWeightGrams?: number | null
  /** Đánh dấu đã áp dụng bộ định lượng DEMO v1; không tự điền lại giá trị BGH cố ý để trống. */
  demoPortionSampleVersion?: 1
  ingredientRecords?: DishIngredientRecord[]
  safetyMonitoring?: DishSafetyMonitoring
  description: string
  priority: number
  expectedQuantity: number
  serviceMode: MealServiceMode
  preparationKitchenId: string
  status: BoardingMenuStatus
  version: number
  createdAt: string
  updatedAt: string
  demo: true
}

export type DishTemplate = Pick<BoardingDish, 'name' | 'ingredients' | 'description'> & { id: string }

/** Món do bếp đề xuất để BGH đưa vào lịch, không tự sửa thực đơn công khai. */
export type KitchenDishProposal = {
  id: string
  schoolId: string
  kitchenId: string
  createdBy: 'central_kitchen' | 'school_kitchen'
  mealType: BoardingMealType
  gradeLevel: GradeLevel
  name: string
  description: string
  imageUrl?: string
  expectedQuantity: number
  portionWeightGrams: number
  priority: number
  ingredientRecords: DishIngredientRecord[]
  safetyMonitoring: DishSafetyMonitoring
  createdAt: string
  updatedAt: string
  demo: true
}
export const KITCHEN_DISH_PROPOSALS_KEY = 'demo-kitchen-dish-proposals-v1'

export const BOARDING_MENU_STORAGE_KEY = 'demo-boarding-menu-v3'
export const KITCHEN_DIRECTORY_STORAGE_KEY = 'demo-kitchen-directory-v1'

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

export const serviceModeOptions: { value: MealServiceMode; label: string; description: string }[] = [
  { value: 'CENTRAL_KITCHEN', label: 'Bếp trung tâm', description: 'Chế biến tại bếp trung tâm và giao đến trường.' },
  { value: 'ON_SITE', label: 'Bếp tại trường', description: 'Chế biến, ra món và phục vụ ngay tại trường.' },
]

const seedKitchens = (): KitchenProfile[] => [
  { id: 'kitchen-an-tam', code: 'BTT-001', name: 'Bếp trung tâm An Tâm', type: 'CENTRAL_KITCHEN', managerName: 'Nguyễn Minh Anh', capacity: 1800, assignedSchoolIds: ['an-phu', 'binh-an', 'an-khanh'], active: true, updatedAt: '2026-10-17T07:30:00+07:00', demo: true },
  { id: 'kitchen-binh-an', code: 'BTT-BA-01', name: 'Bếp tại trường Mầm non Bình An', type: 'ON_SITE', managerName: 'Trần Thị Hương', capacity: 350, assignedSchoolIds: ['binh-an'], active: true, updatedAt: '2026-10-17T07:30:00+07:00', demo: true },
  { id: 'kitchen-an-khanh', code: 'BTT-AK-01', name: 'Bếp tại trường THCS An Khánh', type: 'ON_SITE', managerName: 'Lê Quốc Bảo', capacity: 520, assignedSchoolIds: ['an-khanh'], active: true, updatedAt: '2026-10-17T07:30:00+07:00', demo: true },
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

/** Khối lớp mặc định theo trường DEMO (không dựa vào vai trò đang xem). */
export const gradeForSchool = (schoolId: string): GradeLevel =>
  schoolId === 'binh-an' ? 'KINDERGARTEN' : schoolId === 'an-khanh' ? 'SECONDARY' : 'PRIMARY'

/**
 * Một nguồn dữ liệu DEMO dùng chung cho tất cả không gian làm việc.
 * Chỉ tạo dữ liệu mẫu khi chưa có bản lưu; tuyệt đối không tự bổ sung món vào thực đơn đã sửa/xóa.
 */
const seedMenu = (): BoardingDish[] => {
  const now = '2026-10-12T08:00:00+07:00'
  const weeks = Array.from(new Set(['2026-10-12', mondayOfWeek(toIsoDate(new Date()))]))
  const lunchNames = ['Thịt heo kho trứng', 'Cá sốt cà chua', 'Gà kho gừng', 'Bò xào rau củ', 'Cá thu kho thơm', 'Mì xào gà', 'Cơm chiên rau củ']
  const lunchAlternatives = ['Đậu hũ sốt nấm', 'Trứng hấp thịt rau củ', 'Cá viên sốt rau củ', 'Gà áp chảo sốt nhẹ', 'Thịt viên kho củ quả', 'Bún gà rau xanh', 'Nui xào bò rau củ']
  const schoolSamples = [
    { id: 'an-phu', grade: 'PRIMARY' as const, mode: 'CENTRAL_KITCHEN' as const, kitchen: 'kitchen-an-tam', servings: 485 },
    { id: 'binh-an', grade: 'KINDERGARTEN' as const, mode: 'ON_SITE' as const, kitchen: 'kitchen-binh-an', servings: 216 },
    { id: 'an-khanh', grade: 'SECONDARY' as const, mode: 'ON_SITE' as const, kitchen: 'kitchen-an-khanh', servings: 360 },
  ]
  const items: BoardingDish[] = []
  for (const school of schoolSamples) {
    for (const monday of weeks) {
      weekFromMonday(monday).forEach((serviceDate, index) => {
        const workflow = { serviceMode: school.mode, preparationKitchenId: school.kitchen, status: 'DRAFT' as const, version: 1 }
        const common = { schoolId: school.id, gradeLevel: school.grade, serviceDate, ...workflow, createdAt: now, updatedAt: now, demo: true as const }
        items.push({ ...common, id: `demo-${school.id}-${serviceDate}-lunch`, mealType: 'LUNCH', name: lunchNames[index]!, isDefault: true, ingredients: ['Cơm trắng', lunchNames[index]!, 'Canh rau củ'], description: 'Thực đơn bữa trưa minh họa theo kế hoạch tuần.', priority: 1, expectedQuantity: school.servings })
        items.push({ ...common, id: `demo-${school.id}-${serviceDate}-lunch-alt`, mealType: 'LUNCH', name: lunchAlternatives[index]!, ingredients: ['Cơm trắng', lunchAlternatives[index]!, 'Canh rau củ'], description: 'Phương án món bữa trưa minh họa để phụ huynh lựa chọn.', priority: 2, expectedQuantity: school.servings })
        items.push({ ...common, id: `demo-${school.id}-${serviceDate}-breakfast`, mealType: 'BREAKFAST', name: index % 2 ? 'Bún thịt rau xanh' : 'Cháo gà rau củ', isDefault: true, ingredients: index % 2 ? ['Bún tươi', 'Thịt heo', 'Rau xanh'] : ['Gạo tẻ', 'Thịt gà', 'Cà rốt'], description: 'Bữa sáng minh họa, định lượng chưa được xác minh.', priority: 1, expectedQuantity: school.servings })
        items.push({ ...common, id: `demo-${school.id}-${serviceDate}-breakfast-alt`, mealType: 'BREAKFAST', name: index % 2 ? 'Cháo thịt bằm bí đỏ' : 'Bánh mì trứng rau', ingredients: index % 2 ? ['Gạo tẻ', 'Thịt heo', 'Bí đỏ'] : ['Bánh mì', 'Trứng', 'Rau xanh'], description: 'Phương án bữa sáng minh họa để phụ huynh lựa chọn.', priority: 2, expectedQuantity: school.servings })
        items.push({ ...common, id: `demo-${school.id}-${serviceDate}-snack`, mealType: 'SNACK', name: index % 2 ? 'Bánh mềm và sữa' : 'Sữa chua và trái cây', isDefault: true, ingredients: index % 2 ? ['Bánh mềm', 'Sữa'] : ['Sữa chua', 'Trái cây theo mùa'], description: 'Bữa xế minh họa theo kế hoạch nhà trường.', priority: 1, expectedQuantity: school.servings })
        items.push({ ...common, id: `demo-${school.id}-${serviceDate}-snack-alt`, mealType: 'SNACK', name: index % 2 ? 'Chè đậu xanh ít ngọt' : 'Bánh chuối và sữa', ingredients: index % 2 ? ['Đậu xanh', 'Sữa'] : ['Bánh chuối', 'Sữa'], description: 'Phương án bữa xế minh họa để phụ huynh lựa chọn.', priority: 2, expectedQuantity: school.servings })
      })
    }
  }
  // Nhà cung cấp và mã lô DEMO được tạo để minh họa luồng thông tin, không phải bằng chứng kiểm định.
  return items.map(item => ({
    ...item,
    portionWeightGrams: demoWeightByMeal[item.mealType],
    demoPortionSampleVersion: 1,
    ingredientRecords: item.ingredients.map((name, index) => ({
      name,
      amountPerServing: demoIngredientAmount(name, item.mealType, index).amount,
      unit: demoIngredientAmount(name, item.mealType, index).unit,
      supplier: index === 0 ? 'Nhà cung cấp lương thực (DEMO)' : 'Nhà cung cấp thực phẩm (DEMO)',
      lotCode: `DEMO-${item.schoolId.toUpperCase()}-${item.serviceDate.replace(/-/g, '')}-${index + 1}`,
      origin: 'Nguồn nguyên liệu minh họa · Chưa đối chiếu chứng từ',
    })),
    safetyMonitoring: {
      // Ngày đã qua có nhật ký tự khai báo DEMO; ngày tương lai chỉ có kế hoạch.
      // REPORTED là khai báo nội bộ, KHÔNG đồng nghĩa kết quả kiểm thực/lưu mẫu hợp lệ.
      threeStep: item.serviceDate <= toIsoDate(new Date()) ? 'REPORTED' as const : 'NOT_RECORDED' as const,
      retainedSample: item.serviceDate <= toIsoDate(new Date()) ? 'REPORTED' as const : 'NOT_RECORDED' as const,
      supervisor: 'Nhân viên phụ trách (DEMO)',
      recordedAt: item.serviceDate <= toIsoDate(new Date()) ? `${item.serviceDate}T10:40:00+07:00` : '',
      note: 'Mô phỏng nhật ký tự khai báo DEMO; chưa có phiếu kiểm thực, dữ liệu lưu mẫu hoặc chứng từ thực tế được xác minh.',
    },
  }))
}

/**
 * Bộ định lượng THAM KHẢO cho giao diện DEMO; không phải định mức dinh dưỡng đã phê duyệt.
 * Dùng để bổ sung các bản thực đơn v2 cũ còn trống định lượng, ở bất kỳ vai trò xem nào.
 * Không suy luận từ giấy tờ kiểm thực hoặc dùng để xác nhận ATTP.
 */
const demoWeightByMeal: Record<BoardingMealType, number> = { BREAKFAST: 280, LUNCH: 320, SNACK: 150 }

const normalizeIngredientName = (name: string) => name.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('vi').trim()

const demoIngredientAmounts: Record<string, { amount: number; unit?: 'g' | 'ml' }> = {
  'gao te': { amount: 65 },
  'thit ga': { amount: 55 },
  'ca rot': { amount: 40 },
  'hanh la': { amount: 5 },
  'bun tuoi': { amount: 170 },
  'thit heo': { amount: 60 },
  'thit bo': { amount: 65 },
  'rau xanh': { amount: 35 },
  'nuoc dung': { amount: 120, unit: 'ml' },
  'com trang': { amount: 150 },
  'canh rau cu': { amount: 70 },
  'canh rau ngot': { amount: 70 },
  'canh cu qua': { amount: 70 },
  'thit heo kho trung': { amount: 100 },
  'ca sot ca chua': { amount: 100 },
  'ga kho gung': { amount: 100 },
  'bo xao rau cu': { amount: 100 },
  'ca thu kho thom': { amount: 100 },
  'mi xao ga': { amount: 165 },
  'com chien rau cu': { amount: 165 },
  'ca phi le': { amount: 90 },
  'ca chua': { amount: 40 },
  'hanh': { amount: 8 },
  'gung': { amount: 5 },
  'gia vi': { amount: 5 },
  'rau luoc': { amount: 65 },
  'sua chua': { amount: 90 },
  'trai cay theo mua': { amount: 60 },
  'banh mem': { amount: 65 },
  'sua': { amount: 120, unit: 'ml' },
}

const demoIngredientAmount = (name: string, mealType: BoardingMealType, index: number): { amount: number; unit: 'g' | 'ml' } => {
  const normalized = normalizeIngredientName(name)
  const known = demoIngredientAmounts[normalized]
  if (known) return { amount: known.amount, unit: known.unit ?? 'g' }
  // Nguyên liệu không có trong danh mục mẫu: điền số giả định, vẫn gắn DEMO.
  // Các món mới được BGH nhập và lưu sau lần cập nhật không bị tự điền lại.
  const guesses: Record<BoardingMealType, number[]> = {
    BREAKFAST: [100, 55, 35, 10], LUNCH: [150, 100, 70, 20], SNACK: [90, 60, 25],
  }
  const amounts = guesses[mealType]
  const isLiquid = normalized.includes('nuoc') || normalized === 'sua' || normalized.includes('sot')
  return { amount: amounts[Math.min(index, amounts.length - 1)]!, unit: isLiquid ? 'ml' : 'g' }
}

/** Hoàn thiện dữ liệu v2 cũ tại lúc đọc, không ghi localStorage từ vai trò chỉ xem. */
const withDemoPortionSamples = (dish: BoardingDish): BoardingDish => {
  if (dish.demoPortionSampleVersion === 1) return dish
  const existing = dish.ingredientRecords ?? []
  const needsPortion = dish.portionWeightGrams == null
  const needsIngredient = dish.ingredients.some(name => {
    const record = existing.find(item => normalizeIngredientName(item.name) === normalizeIngredientName(name))
    return record?.amountPerServing == null
  })
  if (!needsPortion && !needsIngredient) return dish
  const records: DishIngredientRecord[] = dish.ingredients.map((name, index) => {
    const record = existing.find(item => normalizeIngredientName(item.name) === normalizeIngredientName(name))
    const sample = demoIngredientAmount(name, dish.mealType, index)
    return {
      name,
      amountPerServing: record?.amountPerServing ?? sample.amount,
      unit: record?.unit ?? sample.unit,
      supplier: record?.supplier ?? '',
      lotCode: record?.lotCode ?? '',
      origin: record?.origin ?? '',
    }
  })
  // Không loại bỏ các dòng định lượng bổ sung thủ công dù chưa trùng tên với thành phần.
  const extraRecords = existing.filter(record => !dish.ingredients.some(name => normalizeIngredientName(name) === normalizeIngredientName(record.name)))
  return {
    ...dish,
    portionWeightGrams: dish.portionWeightGrams ?? demoWeightByMeal[dish.mealType],
    ingredientRecords: [...records, ...extraRecords],
    demoPortionSampleVersion: 1,
  }
}

const isIngredientRecord = (value: unknown): value is DishIngredientRecord => {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.name === 'string'
    && (item.inventoryItemId === undefined || typeof item.inventoryItemId === 'string')
    && (item.amountPerServing === null || (typeof item.amountPerServing === 'number' && Number.isFinite(item.amountPerServing) && item.amountPerServing > 0))
    && (item.unit === 'g' || item.unit === 'ml')
    && typeof item.supplier === 'string'
    && typeof item.lotCode === 'string'
    && typeof item.origin === 'string'
}

const isSafetyMonitoring = (value: unknown): value is DishSafetyMonitoring => {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (item.threeStep === 'NOT_RECORDED' || item.threeStep === 'REPORTED')
    && (item.retainedSample === 'NOT_RECORDED' || item.retainedSample === 'REPORTED')
    && typeof item.supervisor === 'string'
    && typeof item.recordedAt === 'string'
    && typeof item.note === 'string'
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
    && (item.isDefault === undefined || typeof item.isDefault === 'boolean')
    && (item.imageUrl === undefined || (typeof item.imageUrl === 'string' && (item.imageUrl === '' || /^data:image\/jpeg;base64,/.test(item.imageUrl))))
    && Array.isArray(item.ingredients)
    && item.ingredients.every(ingredient => typeof ingredient === 'string')
    && (item.portionWeightGrams === undefined || item.portionWeightGrams === null || (typeof item.portionWeightGrams === 'number' && Number.isFinite(item.portionWeightGrams) && item.portionWeightGrams > 0))
    && (item.demoPortionSampleVersion === undefined || item.demoPortionSampleVersion === 1)
    && (item.ingredientRecords === undefined || (Array.isArray(item.ingredientRecords) && item.ingredientRecords.every(isIngredientRecord)))
    && (item.safetyMonitoring === undefined || isSafetyMonitoring(item.safetyMonitoring))
    && typeof item.description === 'string'
    && typeof item.priority === 'number'
    && Number.isInteger(item.priority)
    && item.priority >= 0
    && typeof item.expectedQuantity === 'number'
    && Number.isInteger(item.expectedQuantity)
    && item.expectedQuantity >= 0
    && serviceModeOptions.some(option => option.value === item.serviceMode)
    && typeof item.preparationKitchenId === 'string'
    && (item.status === 'DRAFT' || item.status === 'SUBMITTED')
    && typeof item.version === 'number'
    && Number.isInteger(item.version)
    && item.version > 0
    && typeof item.createdAt === 'string'
    && typeof item.updatedAt === 'string'
    && item.demo === true
}

const migrateDish = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return value
  const item = value as Record<string, unknown>
  const centralKitchen = item.schoolId === 'an-phu'
  return {
    ...item,
    serviceMode: item.serviceMode ?? (centralKitchen ? 'CENTRAL_KITCHEN' : 'ON_SITE'),
    preparationKitchenId: item.preparationKitchenId ?? (centralKitchen ? 'kitchen-an-tam' : `kitchen-${String(item.schoolId)}`),
    status: item.status ?? 'DRAFT',
    version: item.version ?? 1,
  }
}

const isKitchenProfile = (value: unknown): value is KitchenProfile => {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string'
    && typeof item.code === 'string'
    && typeof item.name === 'string'
    && serviceModeOptions.some(option => option.value === item.type)
    && typeof item.managerName === 'string'
    && typeof item.capacity === 'number'
    && Number.isInteger(item.capacity)
    && item.capacity > 0
    && Array.isArray(item.assignedSchoolIds)
    && item.assignedSchoolIds.every(schoolId => typeof schoolId === 'string')
    && typeof item.active === 'boolean'
    && typeof item.updatedAt === 'string'
    && item.demo === true
}

// Lưu trên localStorage chỉ dành cho bản demo; backend production phải xác thực và phân quyền độc lập.
const requireSchoolBoard = () => { if (useUI.getState().role !== 'school_board') throw new Error('Chỉ Ban Giám hiệu được cập nhật thực đơn.') }

/** Một lựa chọn riêng cho mỗi học sinh/ngày/bữa. Dữ liệu chỉ mô phỏng trên thiết bị này. */
export type ParentMealChoice = {
  studentCode: string
  schoolId: string
  gradeLevel: GradeLevel
  serviceDate: string
  mealType: BoardingMealType
  dishId: string
  updatedAt: string
}
export const PARENT_MEAL_CHOICES_KEY = 'demo-parent-meal-choices-v1'
export const PARENT_MEAL_CHOICES_EVENT = 'demo-parent-meal-choices-updated'

/** Ngày/bữa chỉ có một mặc định; thực đơn cũ chưa đánh dấu sẽ lấy món có ưu tiên thấp nhất. */
export const defaultMealDish = (dishes: BoardingDish[]): BoardingDish | undefined =>
  dishes.find(dish => dish.isDefault) ?? [...dishes].sort((a, b) => a.priority - b.priority)[0]

/** Bữa trưa có tối đa 5 món để học sinh chọn một; giữ giới hạn 3 ở sáng/xế. */
export const maxDishesPerMeal = (mealType: BoardingMealType) => mealType === 'LUNCH' ? 5 : 3

export const parentMealChoiceRepository = {
  load(): ParentMealChoice[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(PARENT_MEAL_CHOICES_KEY) ?? '[]')
      return Array.isArray(parsed) ? parsed.filter((item): item is ParentMealChoice =>
        !!item && typeof item === 'object' && typeof item.studentCode === 'string'
        && typeof item.schoolId === 'string' && typeof item.serviceDate === 'string'
        && typeof item.dishId === 'string' && typeof item.updatedAt === 'string'
        && gradeOptions.some(option => option.value === item.gradeLevel)
        && mealTypeOptions.some(option => option.value === item.mealType)) : []
    } catch { return [] }
  },
  /** Trả về lựa chọn hợp lệ, hoặc món mặc định nếu học sinh chưa chọn/món cũ bị gỡ. */
  resolve(dishes: BoardingDish[], scope: Omit<ParentMealChoice, 'dishId' | 'updatedAt'>) {
    const valid = dishes.filter(dish => dish.schoolId === scope.schoolId
      && dish.gradeLevel === scope.gradeLevel && dish.serviceDate === scope.serviceDate
      && dish.mealType === scope.mealType)
    const saved = this.load().find(item => item.studentCode === scope.studentCode
      && item.schoolId === scope.schoolId && item.gradeLevel === scope.gradeLevel
      && item.serviceDate === scope.serviceDate && item.mealType === scope.mealType)
    const explicit = valid.find(dish => dish.id === saved?.dishId)
    return { dish: explicit ?? defaultMealDish(valid), explicit: !!explicit, replaced: !!saved && !explicit }
  },
  select(scope: Omit<ParentMealChoice, 'dishId' | 'updatedAt'>, dishId: string) {
    if (useUI.getState().role !== 'parent') throw new Error('Chỉ phụ huynh được chọn món cho học sinh.')
    if (!scope.studentCode.trim() || scope.studentCode.length > 60) throw new Error('Nhập mã học sinh (tối đa 60 ký tự).')
    const dish = boardingMenuRepository.load().find(item => item.id === dishId)
    if (!dish || dish.schoolId !== scope.schoolId || dish.gradeLevel !== scope.gradeLevel
      || dish.serviceDate !== scope.serviceDate || dish.mealType !== scope.mealType)
      throw new Error('Món không còn trong thực đơn của học sinh ở ngày đã chọn.')
    const record: ParentMealChoice = { ...scope, studentCode: scope.studentCode.trim(), dishId, updatedAt: new Date().toISOString() }
    const next = this.load().filter(item => !(item.studentCode === record.studentCode
      && item.schoolId === record.schoolId && item.gradeLevel === record.gradeLevel
      && item.serviceDate === record.serviceDate && item.mealType === record.mealType))
    setDemoStorageItem(PARENT_MEAL_CHOICES_KEY, JSON.stringify([...next, record]))
    window.dispatchEvent(new Event(PARENT_MEAL_CHOICES_EVENT))
  },
}

export const boardingMenuRepository = {
  load(): BoardingDish[] {
    const raw = localStorage.getItem(BOARDING_MENU_STORAGE_KEY)
    const legacyRaw = localStorage.getItem('demo-boarding-menu-v2') ?? localStorage.getItem('demo-boarding-menu-v1')
    if (!raw && !legacyRaw) return seedMenu().map(withDemoPortionSamples)
    const parsed: unknown = JSON.parse(raw ?? legacyRaw!)
    const migratedValue = Array.isArray(parsed) ? parsed.map(migrateDish) : parsed
    const migrated = !raw && Array.isArray(migratedValue)
      ? [...migratedValue, ...seedMenu().filter(seed => seed.mealType !== 'LUNCH' && !migratedValue.some(item => isBoardingDish(item) && item.id === seed.id))]
      : migratedValue
    if (!Array.isArray(migrated) || !migrated.every(isBoardingDish)) throw new Error('Dữ liệu thực đơn DEMO trên trình duyệt không đúng định dạng.')
    // Bản DEMO cũ có thể chỉ chứa tuần 12/10. Mở rộng mẫu cho tuần hiện tại
    // khi chưa hề có thực đơn tuần này, nhưng KHÔNG bổ sung vào tuần đã được BGH sửa/xóa.
    if (migrated.length > 0) {
      const currentWeek = mondayOfWeek(toIsoDate(new Date()))
      const lastDate = migrated.reduce((latest, dish) => dish.serviceDate > latest ? dish.serviceDate : latest, '')
      if (lastDate < currentWeek) {
        return [...migrated, ...seedMenu().filter(dish => dish.serviceDate >= currentWeek)].map(withDemoPortionSamples)
      }
    }
    return migrated.map(withDemoPortionSamples)
  },
  save(items: BoardingDish[]) {
    requireSchoolBoard()
    if (!items.every(isBoardingDish)) throw new Error('Dữ liệu thực đơn không hợp lệ.')
    const groups = new Map<string, BoardingDish[]>()
    for (const dish of items) {
      const key = [dish.schoolId, dish.gradeLevel, dish.serviceDate, dish.mealType].join(':')
      groups.set(key, [...(groups.get(key) ?? []), dish])
    }
    for (const group of groups.values()) {
      if (group.length > maxDishesPerMeal(group[0]!.mealType)) throw new Error('Vượt quá số món cho phép trong một ngày/bữa.')
      if (group.filter(dish => dish.isDefault).length > 1) throw new Error('Mỗi bữa/ngày chỉ được chọn một món mặc định.')
    }
    setDemoStorageItem(BOARDING_MENU_STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event('demo-boarding-menu-updated'))
  },
  seed: seedMenu,
}

export const kitchenDirectoryRepository = {
  load(): KitchenProfile[] {
    const raw = localStorage.getItem(KITCHEN_DIRECTORY_STORAGE_KEY)
    if (!raw) return seedKitchens()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every(isKitchenProfile)) throw new Error('Danh mục bếp DEMO trên trình duyệt không đúng định dạng.')
    return parsed
  },
  save(items: KitchenProfile[]) {
    requireSchoolBoard()
    if (!items.every(isKitchenProfile)) throw new Error('Danh mục bếp không hợp lệ.')
    setDemoStorageItem(KITCHEN_DIRECTORY_STORAGE_KEY, JSON.stringify(items))
  },
  seed: seedKitchens,
}

/** Dữ liệu món bếp đề xuất tách biệt thực đơn BGH. Không nâng vai trò bếp thành người lập lịch. */
const isKitchenDishProposal = (value: unknown): value is KitchenDishProposal => {
  if (!value || typeof value !== 'object') return false
  const p = value as Record<string, unknown>
  return typeof p.id === 'string' && typeof p.schoolId === 'string' && typeof p.kitchenId === 'string'
    && (p.createdBy === 'central_kitchen' || p.createdBy === 'school_kitchen')
    && mealTypeOptions.some(v => v.value === p.mealType) && gradeOptions.some(v => v.value === p.gradeLevel)
    && typeof p.name === 'string' && p.name.trim().length > 0 && typeof p.description === 'string'
    && (p.imageUrl === undefined || (typeof p.imageUrl === 'string' && (p.imageUrl === '' || /^data:image\/jpeg;base64,/.test(p.imageUrl))))
    && typeof p.expectedQuantity === 'number' && Number.isInteger(p.expectedQuantity) && p.expectedQuantity > 0
    && typeof p.priority === 'number' && Number.isInteger(p.priority) && p.priority >= 0
    && typeof p.portionWeightGrams === 'number' && Number.isFinite(p.portionWeightGrams) && p.portionWeightGrams > 0
    && Array.isArray(p.ingredientRecords) && p.ingredientRecords.length > 0
    && p.ingredientRecords.every(row => isIngredientRecord(row) && !!row.inventoryItemId && row.amountPerServing !== null)
    && isSafetyMonitoring(p.safetyMonitoring) && typeof p.createdAt === 'string'
    && typeof p.updatedAt === 'string' && p.demo === true
}
export const kitchenDishProposalsRepository = {
  load(): KitchenDishProposal[] {
    const raw = localStorage.getItem(KITCHEN_DISH_PROPOSALS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every(isKitchenDishProposal)) throw new Error('Danh sách món đề xuất không đúng định dạng.')
    return parsed
  },
  save(proposal: KitchenDishProposal): void {
    const { role, schoolId } = useUI.getState()
    if (role !== 'central_kitchen' && role !== 'school_kitchen') throw new Error('Chỉ tài khoản bếp được đề xuất món.')
    if (schoolId !== proposal.schoolId || role !== proposal.createdBy) throw new Error('Không được đề xuất món ngoài phạm vi bếp.')
    if (!isKitchenDishProposal(proposal)) throw new Error('Thiếu dữ liệu bắt buộc của món.')
    // Kiểm tra mã kho và mã lô ngay lúc lưu, không tin dữ liệu do UI gửi lên.
    const kitchen = kitchenDirectoryRepository.load().find(item => item.id === proposal.kitchenId && item.active && item.assignedSchoolIds.includes(schoolId))
    if (!kitchen || kitchen.type !== (role === 'central_kitchen' ? 'CENTRAL_KITCHEN' : 'ON_SITE')) throw new Error('Không được tạo món cho bếp ngoài phạm vi.')
    const stock = inventoryItems.filter(item => item.schoolId === schoolId && item.kitchenId === proposal.kitchenId)
    const today = toIsoDate(new Date())
    if (proposal.ingredientRecords.some(record => !stock.some(item => item.id === record.inventoryItemId && item.ingredientName === record.name && item.lotCode === record.lotCode && item.expiresAt >= today))) {
      throw new Error('Nguyên liệu phải chọn từ lô kho của bếp được phân công.')
    }
    const next = this.load().filter(item => item.id !== proposal.id)
    setDemoStorageItem(KITCHEN_DISH_PROPOSALS_KEY, JSON.stringify([...next, proposal]))
    window.dispatchEvent(new Event('demo-kitchen-dishes-updated'))
  },
}
