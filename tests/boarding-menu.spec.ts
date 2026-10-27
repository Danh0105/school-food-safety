import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function openBoardingMenu(page: import('@playwright/test').Page) {
  const mobile = (page.viewportSize()?.width ?? 1440) <= 760
  await page.goto('/')
  await page.getByRole('button', { name: mobile ? 'Tài khoản' : 'Chuyển không gian làm việc' }).click()
  await page.getByRole('button', { name: 'Ban Giám hiệu' }).click()
  await page.getByRole('link', { name: mobile ? 'Thực đơn' : 'Thực đơn & bữa ăn', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Thiết lập thực đơn hằng ngày và hằng tuần' })).toBeVisible()
}

test('BGH adds, previews, edits and deletes a boarding dish', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await openBoardingMenu(page)
  await expect(page.getByText('/21 ô bữa ăn')).toBeVisible()
  const table = page.getByRole('table', { name: 'Lịch thực đơn 7 ngày và 3 bữa' })
  await expect(table.getByRole('columnheader')).toHaveCount(8)
  await expect(table.getByRole('rowheader')).toHaveCount(3)

  const firstEmptyCell = table.getByRole('cell').filter({ has: page.getByRole('button', { name: 'Thêm món ăn' }) }).first()
  await firstEmptyCell.getByRole('button', { name: 'Thêm món ăn' }).click()
  const dialog = page.getByRole('dialog', { name: 'Thêm món bán trú' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox', { name: /Tên món/ }).fill('Phở gà rau xanh')
  await dialog.getByRole('textbox', { name: 'Thành phần' }).fill('Bánh phở, thịt gà, rau xanh')
  await dialog.getByRole('textbox', { name: 'Mô tả' }).fill('Món mới hiển thị tức thời trong khung xem trước.')
  await expect(dialog.getByText('Phở gà rau xanh')).toBeVisible()
  await dialog.getByRole('button', { name: 'Lưu món' }).click()
  await expect(page.getByText('Đã thêm món vào 1 ngày áp dụng.')).toBeVisible()
  await expect(table.getByText('Phở gà rau xanh')).toBeVisible()

  await table.getByRole('button', { name: 'Chỉnh sửa Phở gà rau xanh' }).click()
  const editDialog = page.getByRole('dialog', { name: 'Chỉnh sửa món bán trú' })
  await editDialog.getByRole('textbox', { name: /Tên món/ }).fill('Phở gà nấm hương')
  await editDialog.getByRole('button', { name: 'Lưu món' }).click()
  await expect(table.getByText('Phở gà nấm hương')).toBeVisible()
  await table.getByRole('button', { name: 'Xóa Phở gà nấm hương' }).click()
  await page.getByRole('dialog', { name: 'Xác nhận xóa món' }).getByRole('button', { name: 'Xóa món' }).click()
  await expect(table.getByText('Phở gà nấm hương')).toHaveCount(0)

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations.map(violation => violation.id)).toEqual([])
  await page.screenshot({ path: 'docs/screenshots/boarding-menu-1440.png', fullPage: true })
})

test('boarding menu remains usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openBoardingMenu(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const scroll = page.getByLabel('Lịch thực đơn tuần, có thể cuộn ngang')
  await expect(scroll).toBeVisible()
  await scroll.getByRole('button', { name: 'Thêm món ăn' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Thêm món bán trú' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Xem trước bên phụ huynh')).toBeVisible()
  await page.screenshot({ path: 'docs/screenshots/boarding-menu-editor-390.png', fullPage: true })
  await dialog.getByRole('button', { name: 'Đóng' }).click()
  await page.screenshot({ path: 'docs/screenshots/boarding-menu-390.png', fullPage: true })
})
