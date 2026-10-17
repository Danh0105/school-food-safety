import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
test('parent journey, school/date changes and private demo feedback',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'Bữa ăn của con, an tâm của bạn.'})).toBeVisible()
 await page.getByRole('combobox',{name:'Chọn trường'}).selectOption('binh-an');await expect(page.locator('.stat-value').first()).toContainText('216');await expect(page.getByText('Nấu tại trường',{exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Góp ý thực đơn',exact:false}).click();await page.getByRole('textbox',{name:'Nội dung'}).fill('Mong nhà trường bổ sung thêm các món rau củ theo mùa.');await page.getByRole('button',{name:'Gửi ý kiến',exact:true}).click();await expect(page.getByText('Đã lưu vào trình duyệt DEMO, chưa gửi đến nhà trường.')).toBeVisible();await page.getByRole('button',{name:'Hoàn tất'}).click()
 await page.getByRole('link',{name:'Phản ánh & góp ý',exact:true}).click();await expect(page.getByText('Mong nhà trường bổ sung thêm các món rau củ theo mùa.')).toBeVisible();await page.reload();await expect(page.getByText('Mong nhà trường bổ sung thêm các món rau củ theo mùa.')).toBeVisible()
})
test('responsive pages have no horizontal overflow',async({page})=>{
 for(const width of [375,390,430,768,1024,1440]){await page.setViewportSize({width,height:1000});await page.goto('/');await expect(page.locator('.stat-value').first()).toContainText('485');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`docs/screenshots/home-${width}.png`,fullPage:true})}
})
test('tabs, mobile drawer, date and dark mode',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:'Mở menu'}).click();await page.getByRole('link',{name:'Bữa ăn học đường',exact:true}).click();await expect(page.getByRole('button',{name:'Thứ 2 12'})).toBeVisible();await page.getByRole('button',{name:'Thứ 2 12'}).click();await expect(page.getByRole('button',{name:'Thứ 2 12'})).toHaveClass('chosen')
 await page.getByRole('link',{name:'Nguồn gốc',exact:true}).click();await expect(page.getByRole('heading',{name:'Nguồn nguyên liệu'})).toBeVisible();await page.getByRole('link',{name:'Giám sát',exact:true}).click();await expect(page.getByRole('heading',{name:'Hồ sơ giám sát công khai'})).toBeVisible();await page.getByRole('button',{name:'Bật giao diện tối'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.screenshot({path:'docs/screenshots/dark-mobile.png',fullPage:true})
})
test('basic accessibility audit',async({page})=>{
 await page.goto('/');await expect(page.locator('.stat-value').first()).toContainText('485');const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([])
})

test('mobile app tabs, centered account popup and safe bottom spacing',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');const tabs=page.getByRole('navigation',{name:'Điều hướng chính trên điện thoại'});await expect(tabs).toBeVisible();await expect(tabs.getByRole('link')).toHaveCount(4);await tabs.getByRole('link',{name:'Bữa ăn',exact:true}).click();await expect(page).toHaveURL(/bua-an/);await expect(tabs.getByRole('link',{name:'Bữa ăn',exact:true})).toHaveAttribute('aria-current','page');await tabs.getByRole('link',{name:'Truy xuất',exact:true}).click();await expect(page.getByRole('heading',{name:'Nguồn nguyên liệu'})).toBeVisible();await tabs.getByRole('button',{name:'Tài khoản'}).click();const sheet=page.getByRole('dialog',{name:'Khám phá không gian làm việc'});await expect(sheet).toBeVisible();await expect.poll(async()=>{const b=await sheet.boundingBox();return Math.abs(b!.x+b!.width/2-195)}).toBeLessThan(2);await expect.poll(async()=>{const b=await sheet.boundingBox();return Math.abs(b!.y+b!.height/2-422)}).toBeLessThan(2);await page.keyboard.press('Escape');await tabs.getByRole('link',{name:'Trang chủ'}).click();await expect(page.locator('.stat-value').first()).toContainText('485');await expect(page.locator('.meal-photo')).toBeVisible();await page.screenshot({path:'docs/screenshots/mobile-app-390.png',fullPage:false});await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));const footer=await page.locator('.page-footer').boundingBox();const bar=await tabs.boundingBox();expect(footer!.y+footer!.height).toBeLessThanOrEqual(bar!.y)
})

test('ingredient lot popup is centered on desktop and mobile',async({page})=>{
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/nguon-goc');await page.locator('.source-list button').first().click();const popup=page.getByRole('dialog',{name:'Thông tin lô nguyên liệu DEMO'});await expect(popup).toBeVisible();await expect.poll(async()=>{const rect=await popup.boundingBox();return Math.abs(rect!.x+rect!.width/2-width/2)}).toBeLessThan(2);await expect.poll(async()=>{const rect=await popup.boundingBox();return Math.abs(rect!.y+rect!.height/2-450)}).toBeLessThan(2);await page.screenshot({path:`docs/screenshots/ingredient-popup-${width}.png`});await popup.getByRole('button',{name:'Đóng',exact:true}).click();await expect(popup).toHaveCount(0)
 }
})
