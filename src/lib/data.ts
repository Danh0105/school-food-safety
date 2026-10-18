export type School = { id: string; name: string; address: string; mode: 'ON_SITE' | 'CENTRAL_KITCHEN' }
export type MealEvent = {
  status: string
  label: string
  time: string
  actor: string
  confirmed: boolean
  /** Only photos confirmed by the school board are exposed to the parent view. */
  photos: string[]
  hasReportedPhotos: boolean
}
export type IngredientPortion = { name: string; amount: number; unit: 'g' | 'ml' }
export type NutritionEstimate = { energyKcal: number; proteinGrams: number; carbohydrateGrams: number; fatGrams: number }
export type DishDetail = {
  name: string
  servingWeightGrams: number | null
  ingredients: IngredientPortion[]
  nutrition: NutritionEstimate | null
  verification: 'estimated' | 'unverified'
}
export type PublicInspection = {
  id: string
  title: string
  recordNumber: string
  authority: string
  inspectedAt: string
  publishedAt: string
  scope: string
  summary: string
  findingCount: number
  outcome: 'follow_up_required' | 'no_follow_up'
}
export type DayData = { servings: number; suppliers: number; dishes: string[]; dishDetails: DishDetail[]; events: MealEvent[]; kitchen: string; photo: string; updatedAt: string; transportDistanceKm: number | null; transportDurationMinutes: number | null; publicInspection: PublicInspection | null }
export type KitchenDocumentStatus = 'valid' | 'expiring' | 'missing' | 'not_applicable'
export type KitchenDocumentCategory = 'legal' | 'people' | 'facility' | 'operations'
export type KitchenDocument = {
  id: string
  title: string
  category: KitchenDocumentCategory
  status: KitchenDocumentStatus
  applicability: 'required' | 'conditional' | 'recurring'
  documentNumber?: string
  issuer?: string
  issuedAt?: string
  expiresAt?: string
  updatedAt?: string
  note: string
  publicSummary: string
}
export type PublicBatchDocument = {
  type: 'DELIVERY_NOTE' | 'ORIGIN_RECORD' | 'RECEIVING_RECORD'
  title: string
  reference: string
  recordedAt: string
  status: 'demo_reported'
}
export type PublicTraceLot = {
  id: string
  ingredient: string
  supplier: string
  lotCode: string
  origin: string
  producedAt: string
  expiresAt: string
  receivedAt: string
  receivingSummary: string
  linkedDish: string
  documents: PublicBatchDocument[]
}
export type FeedbackAttachment = { id: string; name: string; mimeType: 'image/jpeg'; size: number; dataUrl: string }
export type Feedback = { id: string; schoolId: string; kind: string; content: string; status: string; createdAt: string; attachments: FeedbackAttachment[] }
export const demo = true
export const schools: School[] = [
  { id: 'an-phu', name: 'Tiểu học An Phú', address: 'Phường Bình Hưng Hoà · Thành phố Hồ Chí Minh', mode: 'CENTRAL_KITCHEN' },
  { id: 'binh-an', name: 'Mầm non Bình An', address: 'Phường Bình Hưng Hoà · Thành phố Hồ Chí Minh', mode: 'ON_SITE' },
  { id: 'an-khanh', name: 'THCS An Khánh', address: 'Phường Bình Hưng Hoà · Thành phố Hồ Chí Minh', mode: 'ON_SITE' },
]
export const foodPhoto = '/meal-demo.jpg'
export const publicTraceLots: PublicTraceLot[] = [
  {
    id:'rice-demo-01',ingredient:'Gạo thơm',supplier:'HTX Nông nghiệp An Phú',lotCode:'DEMO-GAO-1810',origin:'Vùng nguyên liệu minh họa · Đồng bằng sông Cửu Long',producedAt:'2026-09-28',expiresAt:'2027-03-28',receivedAt:'2026-10-17T06:35:00+07:00',receivingSummary:'Bao bì nguyên vẹn; số lượng giao nhận đã được ghi nhận trong phiếu DEMO.',linkedDish:'Cơm trắng',documents:[
      {type:'ORIGIN_RECORD',title:'Thông tin nguồn gốc lô',reference:'DEMO-NG-GAO-1810',recordedAt:'2026-10-16',status:'demo_reported'},
      {type:'RECEIVING_RECORD',title:'Phiếu kiểm tra tiếp nhận',reference:'DEMO-KT-1710-01',recordedAt:'2026-10-17',status:'demo_reported'},
    ],
  },
  {
    id:'chicken-demo-02',ingredient:'Thịt gà',supplier:'Thực phẩm An Tâm',lotCode:'DEMO-GA-1810',origin:'Cơ sở sơ chế minh họa · Thành phố Hồ Chí Minh',producedAt:'2026-10-17',expiresAt:'2026-10-19',receivedAt:'2026-10-17T07:05:00+07:00',receivingSummary:'Giao trong thùng bảo ôn; nhiệt độ tiếp nhận khai báo 4,2°C (DEMO).',linkedDish:'Gà kho gừng',documents:[
      {type:'DELIVERY_NOTE',title:'Phiếu giao hàng',reference:'DEMO-GH-1710-08',recordedAt:'2026-10-17',status:'demo_reported'},
      {type:'RECEIVING_RECORD',title:'Biên bản kiểm tra đầu vào',reference:'DEMO-KT-1710-02',recordedAt:'2026-10-17',status:'demo_reported'},
    ],
  },
  {
    id:'vegetable-demo-03',ingredient:'Rau củ theo mùa',supplier:'Nông trại Xanh',lotCode:'DEMO-RAU-1810',origin:'Vùng trồng minh họa · Lâm Đồng',producedAt:'2026-10-16',expiresAt:'2026-10-20',receivedAt:'2026-10-17T06:50:00+07:00',receivingSummary:'Rau củ được ghi nhận tình trạng cảm quan phù hợp tại thời điểm tiếp nhận DEMO.',linkedDish:'Canh rau củ',documents:[
      {type:'ORIGIN_RECORD',title:'Bảng kê nguồn gốc',reference:'DEMO-BK-RAU-1810',recordedAt:'2026-10-16',status:'demo_reported'},
      {type:'DELIVERY_NOTE',title:'Phiếu giao nhận',reference:'DEMO-GN-1710-11',recordedAt:'2026-10-17',status:'demo_reported'},
    ],
  },
  {
    id:'fruit-demo-04',ingredient:'Trái cây',supplier:'Nông sản Việt',lotCode:'DEMO-TC-1810',origin:'Vùng trồng minh họa · Tiền Giang',producedAt:'2026-10-15',expiresAt:'2026-10-21',receivedAt:'2026-10-17T07:20:00+07:00',receivingSummary:'Số lượng và tình trạng bên ngoài đã được đối chiếu theo phiếu giao nhận DEMO.',linkedDish:'Tráng miệng',documents:[
      {type:'ORIGIN_RECORD',title:'Thông tin vùng trồng',reference:'DEMO-VT-TC-1810',recordedAt:'2026-10-15',status:'demo_reported'},
      {type:'RECEIVING_RECORD',title:'Phiếu kiểm tra tiếp nhận',reference:'DEMO-KT-1710-04',recordedAt:'2026-10-17',status:'demo_reported'},
    ],
  },
]
const dishes = [ ['Cơm trắng', 'Gà kho gừng', 'Canh bí đỏ thịt bằm', 'Rau cải xào', 'Thanh long'], ['Cơm trắng', 'Thịt heo kho trứng', 'Canh rau ngót', 'Bông cải luộc', 'Chuối chín'], ['Cơm trắng', 'Cá sốt cà chua', 'Canh củ quả', 'Rau muống xào', 'Dưa hấu'] ]
type DishEstimate = Omit<DishDetail, 'name' | 'verification'>
const dishEstimates: Record<string, DishEstimate> = {
  'Cơm trắng': { servingWeightGrams: 150, ingredients: [{ name: 'Gạo tẻ', amount: 65, unit: 'g' }, { name: 'Nước', amount: 85, unit: 'ml' }], nutrition: { energyKcal: 195, proteinGrams: 4, carbohydrateGrams: 43, fatGrams: 0.5 } },
  'Gà kho gừng': { servingWeightGrams: 85, ingredients: [{ name: 'Thịt gà', amount: 70, unit: 'g' }, { name: 'Gừng', amount: 3, unit: 'g' }, { name: 'Nước kho và gia vị', amount: 12, unit: 'g' }], nutrition: { energyKcal: 150, proteinGrams: 17, carbohydrateGrams: 4, fatGrams: 7 } },
  'Canh bí đỏ thịt bằm': { servingWeightGrams: 180, ingredients: [{ name: 'Bí đỏ', amount: 45, unit: 'g' }, { name: 'Thịt heo bằm', amount: 15, unit: 'g' }, { name: 'Nước dùng', amount: 120, unit: 'ml' }], nutrition: { energyKcal: 55, proteinGrams: 4, carbohydrateGrams: 7, fatGrams: 2 } },
  'Rau cải xào': { servingWeightGrams: 70, ingredients: [{ name: 'Rau cải', amount: 62, unit: 'g' }, { name: 'Dầu thực vật', amount: 5, unit: 'g' }, { name: 'Tỏi và gia vị', amount: 3, unit: 'g' }], nutrition: { energyKcal: 58, proteinGrams: 2, carbohydrateGrams: 4, fatGrams: 4 } },
  'Thanh long': { servingWeightGrams: 100, ingredients: [{ name: 'Thanh long', amount: 100, unit: 'g' }], nutrition: { energyKcal: 50, proteinGrams: 1, carbohydrateGrams: 12, fatGrams: 0 } },
  'Thịt heo kho trứng': { servingWeightGrams: 100, ingredients: [{ name: 'Thịt nạc heo', amount: 60, unit: 'g' }, { name: 'Trứng', amount: 30, unit: 'g' }, { name: 'Nước kho và gia vị', amount: 10, unit: 'g' }], nutrition: { energyKcal: 205, proteinGrams: 18, carbohydrateGrams: 4, fatGrams: 13 } },
  'Canh rau ngót': { servingWeightGrams: 180, ingredients: [{ name: 'Rau ngót', amount: 40, unit: 'g' }, { name: 'Thịt heo bằm', amount: 15, unit: 'g' }, { name: 'Nước dùng', amount: 125, unit: 'ml' }], nutrition: { energyKcal: 45, proteinGrams: 4, carbohydrateGrams: 4, fatGrams: 2 } },
  'Bông cải luộc': { servingWeightGrams: 70, ingredients: [{ name: 'Bông cải', amount: 70, unit: 'g' }], nutrition: { energyKcal: 24, proteinGrams: 2, carbohydrateGrams: 4, fatGrams: 0 } },
  'Chuối chín': { servingWeightGrams: 80, ingredients: [{ name: 'Chuối', amount: 80, unit: 'g' }], nutrition: { energyKcal: 71, proteinGrams: 1, carbohydrateGrams: 18, fatGrams: 0 } },
  'Cá sốt cà chua': { servingWeightGrams: 90, ingredients: [{ name: 'Cá phi lê', amount: 65, unit: 'g' }, { name: 'Cà chua', amount: 20, unit: 'g' }, { name: 'Dầu và gia vị', amount: 5, unit: 'g' }], nutrition: { energyKcal: 135, proteinGrams: 15, carbohydrateGrams: 4, fatGrams: 6 } },
  'Canh củ quả': { servingWeightGrams: 180, ingredients: [{ name: 'Củ quả theo mùa', amount: 60, unit: 'g' }, { name: 'Nước dùng', amount: 120, unit: 'ml' }], nutrition: { energyKcal: 38, proteinGrams: 1, carbohydrateGrams: 8, fatGrams: 0 } },
  'Rau muống xào': { servingWeightGrams: 70, ingredients: [{ name: 'Rau muống', amount: 62, unit: 'g' }, { name: 'Dầu thực vật', amount: 5, unit: 'g' }, { name: 'Tỏi và gia vị', amount: 3, unit: 'g' }], nutrition: { energyKcal: 57, proteinGrams: 2, carbohydrateGrams: 4, fatGrams: 4 } },
  'Dưa hấu': { servingWeightGrams: 100, ingredients: [{ name: 'Dưa hấu', amount: 100, unit: 'g' }], nutrition: { energyKcal: 30, proteinGrams: 1, carbohydrateGrams: 8, fatGrams: 0 } },
}
const getDishDetails = (names: string[], portionOverrides: Record<string,number> = {}): DishDetail[] => names.map(name => {
  const estimate = dishEstimates[name]
  const servingWeightGrams=portionOverrides[name]??estimate?.servingWeightGrams??null
  return estimate ? { name, ...estimate, servingWeightGrams, verification: 'estimated' } : { name, servingWeightGrams, ingredients: [], nutrition: null, verification: servingWeightGrams===null?'unverified':'estimated' }
})
const pause = () => new Promise(resolve => setTimeout(resolve, 280))
const minutesBetween = (start?: string, end?: string): number | null => {
  if (!start || !end) return null
  const [startHour,startMinute]=start.split(':').map(Number)
  const [endHour,endMinute]=end.split(':').map(Number)
  if ([startHour,startMinute,endHour,endMinute].some(value=>!Number.isFinite(value))) return null
  const duration=(endHour!*60+endMinute!)-(startHour!*60+startMinute!)
  return duration >= 0 ? duration : null
}
const publicInspections: Record<string, PublicInspection> = {
  'an-phu': {
    id: 'inspection-demo-an-phu-2026-041',
    title: 'Kiểm tra điều kiện tổ chức bữa ăn bán trú',
    recordNumber: 'DEMO/KT-ATTP/2026-041',
    authority: 'Đoàn kiểm tra liên ngành phường Bình Hưng Hoà (minh họa)',
    inspectedAt: '2026-10-08',
    publishedAt: '2026-10-10T09:15:00+07:00',
    scope: 'Hồ sơ, khu vực tiếp nhận và quy trình phục vụ bữa trưa',
    summary: 'Biên bản DEMO ghi nhận 02 nội dung cần bổ sung hồ sơ. Đơn vị đã gửi phản hồi và đang chờ xác nhận kết quả khắc phục.',
    findingCount: 2,
    outcome: 'follow_up_required',
  },
  'binh-an': {
    id: 'inspection-demo-binh-an-2026-035',
    title: 'Kiểm tra định kỳ bếp ăn tại trường',
    recordNumber: 'DEMO/KT-ATTP/2026-035',
    authority: 'Đoàn kiểm tra liên ngành phường Bình Hưng Hoà (minh họa)',
    inspectedAt: '2026-09-25',
    publishedAt: '2026-09-27T14:30:00+07:00',
    scope: 'Hồ sơ bếp, khu sơ chế và nhật ký kiểm thực',
    summary: 'Biên bản DEMO ghi nhận 01 nội dung cần bổ sung trong hồ sơ nhà cung cấp. Phản hồi khắc phục đang được theo dõi.',
    findingCount: 1,
    outcome: 'follow_up_required',
  },
  'an-khanh': {
    id: 'inspection-demo-an-khanh-2026-038',
    title: 'Kiểm tra điều kiện phục vụ suất ăn bán trú',
    recordNumber: 'DEMO/KT-ATTP/2026-038',
    authority: 'Đoàn kiểm tra liên ngành phường Bình Hưng Hoà (minh họa)',
    inspectedAt: '2026-10-02',
    publishedAt: '2026-10-04T08:45:00+07:00',
    scope: 'Hồ sơ tổ chức bếp, lưu mẫu và khu vực phục vụ',
    summary: 'Biên bản DEMO không ghi nhận nội dung cần theo dõi thêm tại thời điểm kiểm tra. Kết quả này không thay cho đánh giá ở thời điểm khác.',
    findingCount: 0,
    outcome: 'no_follow_up',
  },
}
const kitchenDocuments: KitchenDocument[] = [
  { id:'business-registration', title:'Đăng ký kinh doanh / quyết định thành lập', category:'legal', status:'valid', applicability:'conditional', documentNumber:'DEMO-DKKD-2024-018', issuer:'Cơ quan đăng ký kinh doanh (minh họa)', issuedAt:'2024-08-12', updatedAt:'2026-09-30', note:'Áp dụng theo loại hình pháp lý của đơn vị vận hành bếp.', publicSummary:'Đã có hồ sơ nhận diện pháp lý của đơn vị vận hành. Thông tin chi tiết chỉ hiển thị trong phạm vi được phép công khai.' },
  { id:'food-safety-certificate', title:'Giấy chứng nhận cơ sở đủ điều kiện ATTP', category:'legal', status:'expiring', applicability:'conditional', documentNumber:'DEMO-ATTP-0248', issuer:'Cơ quan có thẩm quyền (minh họa)', issuedAt:'2024-01-15', expiresAt:'2027-01-15', updatedAt:'2026-10-10', note:'Nếu cơ sở thuộc diện miễn cấp, cần lưu căn cứ và hồ sơ chứng minh tương ứng thay cho giấy chứng nhận.', publicSummary:'Hồ sơ minh họa đang trong thời gian hiệu lực và được đánh dấu sắp đến kỳ rà soát.' },
  { id:'meal-service-contract', title:'Hợp đồng cung cấp suất ăn / quyết định tổ chức bếp', category:'legal', status:'valid', applicability:'required', documentNumber:'DEMO-HĐ-2026-09', issuer:'Nhà trường và đơn vị cung cấp (minh họa)', issuedAt:'2026-08-20', expiresAt:'2027-05-31', updatedAt:'2026-09-05', note:'Hồ sơ phải xác định rõ đơn vị chịu trách nhiệm, phạm vi phục vụ và thời hạn.', publicSummary:'Đã ghi nhận văn bản xác lập trách nhiệm tổ chức bữa ăn cho năm học hiện tại.' },
  { id:'supplier-files', title:'Hồ sơ pháp lý và hợp đồng nhà cung cấp', category:'legal', status:'missing', applicability:'required', updatedAt:'2026-10-12', note:'Cần đủ hồ sơ theo từng nhà cung cấp và nhóm nguyên liệu; chứng từ nhạy cảm không công khai.', publicSummary:'Còn thiếu hồ sơ của 1/4 nhà cung cấp trong bộ dữ liệu minh họa.' },
  { id:'health-checks', title:'Hồ sơ khám sức khỏe người trực tiếp chế biến', category:'people', status:'valid', applicability:'recurring', updatedAt:'2026-09-18', note:'Theo dõi theo từng nhân sự, thời điểm khám và thời hạn rà soát; không công khai dữ liệu sức khỏe cá nhân.', publicSummary:'Danh sách nhân sự thuộc phạm vi bếp đã được ghi nhận đầy đủ; dữ liệu sức khỏe được bảo vệ.' },
  { id:'food-safety-training', title:'Hồ sơ tập huấn kiến thức an toàn thực phẩm', category:'people', status:'valid', applicability:'recurring', updatedAt:'2026-09-22', note:'Lưu danh sách, nội dung, thời điểm tập huấn và xác nhận của đơn vị theo quy định áp dụng.', publicSummary:'Đã có hồ sơ tập huấn của nhóm nhân sự trực tiếp tham gia chế biến.' },
  { id:'water-testing', title:'Kết quả kiểm nghiệm nguồn nước sử dụng', category:'facility', status:'expiring', applicability:'recurring', documentNumber:'DEMO-NƯỚC-1026', issuer:'Đơn vị kiểm nghiệm (minh họa)', issuedAt:'2026-04-18', updatedAt:'2026-10-01', note:'Tần suất và chỉ tiêu kiểm nghiệm cần cấu hình theo nguồn nước và yêu cầu của cơ quan quản lý.', publicSummary:'Đã có kết quả minh họa; hệ thống đang nhắc lịch rà soát tiếp theo.' },
  { id:'pest-sanitation', title:'Hồ sơ vệ sinh, kiểm soát côn trùng và chất thải', category:'facility', status:'valid', applicability:'recurring', updatedAt:'2026-10-14', note:'Gồm kế hoạch, nhật ký thực hiện, hóa chất/dịch vụ sử dụng và đơn vị phụ trách khi áp dụng.', publicSummary:'Nhật ký vệ sinh và kiểm soát côn trùng đã được cập nhật trong kỳ.' },
  { id:'fire-safety', title:'Hồ sơ phòng cháy, chữa cháy và an toàn thiết bị', category:'facility', status:'not_applicable', applicability:'conditional', updatedAt:'2026-09-10', note:'Yêu cầu hồ sơ cụ thể phụ thuộc quy mô, công năng, thiết bị và phân loại cơ sở.', publicSummary:'Đang chờ đơn vị phụ trách xác định danh mục áp dụng cho khu bếp.' },
  { id:'three-step-records', title:'Sổ kiểm thực ba bước', category:'operations', status:'valid', applicability:'recurring', updatedAt:'2026-10-18', note:'Ghi nhận theo từng bữa/ca, người thực hiện, thời điểm và bằng chứng; bản đã xác nhận không được sửa đè.', publicSummary:'Nhật ký minh họa hôm nay đã ghi nhận đủ ba bước.' },
  { id:'food-sample-records', title:'Sổ lưu mẫu thức ăn và bàn giao / hủy mẫu', category:'operations', status:'valid', applicability:'recurring', updatedAt:'2026-10-18', note:'Theo dõi món, mã mẫu, lượng mẫu, thời gian lấy, điều kiện lưu, vị trí và sự kiện bàn giao/hủy.', publicSummary:'Mẫu lưu của bữa ăn minh họa hôm nay đã được ghi nhận.' },
  { id:'inspection-corrections', title:'Biên bản kiểm tra và hồ sơ khắc phục', category:'operations', status:'valid', applicability:'conditional', documentNumber:'DEMO/KT-ATTP/2026-041', issuer:'Đoàn kiểm tra liên ngành phường Bình Hưng Hoà (minh họa)', issuedAt:'2026-10-08', updatedAt:'2026-10-10', note:'Chỉ công khai kết quả đã được người/cơ quan có thẩm quyền xác nhận; bản tự khai phải hiển thị tách biệt.', publicSummary:'Đã có biên bản kiểm tra DEMO được chốt và duyệt công khai; 02 nội dung bổ sung đang được theo dõi khắc phục.' },
]
function readFeedback(): Feedback[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('demo-feedback') ?? '[]')
    if (!Array.isArray(value)) return []
    return value.flatMap(item => {
      if (typeof item !== 'object' || item === null) return []
      const candidate = item as Record<string, unknown>
      if (typeof candidate.id !== 'string' || typeof candidate.schoolId !== 'string' || typeof candidate.kind !== 'string' || typeof candidate.content !== 'string' || typeof candidate.status !== 'string' || typeof candidate.createdAt !== 'string') return []
      const attachments = Array.isArray(candidate.attachments) ? candidate.attachments.filter((attachment): attachment is FeedbackAttachment => {
        if (typeof attachment !== 'object' || attachment === null) return false
        const photo = attachment as Record<string, unknown>
        return typeof photo.id === 'string' && typeof photo.name === 'string' && photo.mimeType === 'image/jpeg' && typeof photo.size === 'number' && typeof photo.dataUrl === 'string' && photo.dataUrl.startsWith('data:image/jpeg;base64,')
      }).slice(0, 3) : []
      return [{ id: candidate.id, schoolId: candidate.schoolId, kind: candidate.kind, content: candidate.content, status: candidate.status, createdAt: candidate.createdAt, attachments }]
    })
  } catch { return [] }
}
export const demoData = {
  reply: (id:string):string => {try{return (JSON.parse(localStorage.getItem('demo-replies')??'{}') as Record<string,string>)[id]??''}catch{return ''}},
  schools: async (): Promise<School[]> => (await pause(), schools),
  day: async (school: School, date: string): Promise<DayData> => {
    await pause()
    const stored = JSON.parse(localStorage.getItem('demo-admin-meals') ?? '[]') as {schoolId:string;date:string;servings:number;dishes:string[];portions?:Record<string,number>;events:{status:string;time:string;confirmed:boolean;photos?:unknown}[]}[]
    const saved = stored.find(m => m.schoolId===school.id && m.date===date)
    const central = school.mode === 'CENTRAL_KITCHEN'
    const selectedDishes = saved?.dishes ?? dishes[new Date(`${date}T12:00:00`).getDay() % 3]!
    const events: MealEvent[] = saved ? saved.events.map(e=>{
      const reportedPhotos=Array.isArray(e.photos) ? e.photos.filter((photo):photo is string=>typeof photo==='string'&&photo.startsWith('data:image/')) : []
      return {status:e.status,label:({DISPATCHED:'Xuất bếp',ARRIVED:'Đến trường',PLATED:'Ra món',READY:'Sẵn sàng phục vụ'} as Record<string,string>)[e.status] ?? e.status,time:e.time,actor:'Người thao tác DEMO',confirmed:e.confirmed,photos:e.confirmed?reportedPhotos:[],hasReportedPhotos:reportedPhotos.length>0}
    }) : [
      ...(central ? [{ status: 'DISPATCHED', label: 'Xuất bếp', time: '09:30', actor: 'Bếp trung tâm An Tâm', confirmed: true, photos: [], hasReportedPhotos: false }, { status: 'ARRIVED', label: 'Đến trường', time: '10:00', actor: 'Nhân viên tiếp nhận', confirmed: true, photos: [], hasReportedPhotos: false }] : []),
      { status: 'PLATED', label: 'Ra món', time: '10:20', actor: 'Nhân viên bếp', confirmed: true, photos: [], hasReportedPhotos: false }, { status: 'READY', label: 'Sẵn sàng phục vụ', time: '10:45', actor: 'Nhân viên bếp', confirmed: false, photos: [], hasReportedPhotos: false },
    ]
    const dispatchedAt=events.find(event=>event.status==='DISPATCHED')?.time
    const arrivedAt=events.find(event=>event.status==='ARRIVED')?.time
    return { servings: saved?.servings ?? (school.id === 'an-phu' ? 485 : school.id === 'binh-an' ? 216 : 360), suppliers: 4, dishes: selectedDishes, dishDetails: getDishDetails(selectedDishes,saved?.portions), kitchen: central ? 'Bếp trung tâm An Tâm' : 'Bếp ăn nhà trường', photo: foodPhoto, updatedAt: '10:45', events, transportDistanceKm: central ? 12.4 : null, transportDurationMinutes: central ? minutesBetween(dispatchedAt,arrivedAt) : null, publicInspection: publicInspections[school.id] ?? null }
  },
  kitchenDocuments: async (school: School): Promise<KitchenDocument[]> => {
    await pause()
    const inspection = publicInspections[school.id]
    return kitchenDocuments.map(document => document.id !== 'inspection-corrections' ? document : inspection ? {
      ...document,
      documentNumber: inspection.recordNumber,
      issuer: inspection.authority,
      issuedAt: inspection.inspectedAt,
      updatedAt: inspection.publishedAt.slice(0, 10),
      publicSummary: inspection.findingCount > 0
        ? `Đã có biên bản kiểm tra DEMO được chốt và duyệt công khai; ${inspection.findingCount.toLocaleString('vi-VN').padStart(2, '0')} nội dung đang được theo dõi.`
        : 'Đã có biên bản kiểm tra DEMO được chốt và duyệt công khai; không có nội dung cần theo dõi thêm tại thời điểm kiểm tra.',
    } : {
      ...document,
      status: 'missing',
      documentNumber: undefined,
      issuer: undefined,
      issuedAt: undefined,
      publicSummary: 'Chưa có kết quả kiểm tra nào được duyệt công khai trong bộ dữ liệu minh họa.',
    })
  },
  feedback: async (): Promise<Feedback[]> => readFeedback(),
  sendFeedback: async (input: Omit<Feedback, 'id' | 'status' | 'createdAt'>): Promise<Feedback> => {
    await pause(); const item = { ...input, id: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, status: 'received', createdAt: new Date().toISOString() }
    const all = await demoData.feedback(); localStorage.setItem('demo-feedback', JSON.stringify([item, ...all])); return item
  },
}
