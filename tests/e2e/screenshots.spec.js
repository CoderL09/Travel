import { test, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'

mkdirSync('docs/screenshots', { recursive: true })

test('生成 README 演示截图（桌面 + 移动）', async ({ page, browser }) => {
  await page.setViewportSize({ width: 1280, height: 800 })

  await page.goto('/')
  await page.waitForTimeout(800)
  await page.screenshot({ path: 'docs/screenshots/home.png' })

  await page.goto('/plan')
  const input = page.locator('.chat-form input')
  await input.fill('我想去大阪玩3天，预算5000，2个人')
  await input.press('Enter')
  await expect(page.locator('.message-row.assistant').last()).toContainText('生成行程')
  await page.getByRole('button', { name: /确认需求，生成行程/ }).click()
  await expect(page.locator('.message-row.assistant').last()).toContainText('已生成 3 天行程')
  await page.screenshot({ path: 'docs/screenshots/plan.png' })

  await page.getByRole('button', { name: '♡ 保存行程' }).click()
  await expect(page.locator('.toast')).toContainText('已保存到我的旅行')

  await page.goto('/trips')
  await expect(page.locator('.trip-card', { hasText: '大阪' }).first()).toBeVisible()
  await page.screenshot({ path: 'docs/screenshots/trips.png' })

  await page.locator('.trip-card', { hasText: '大阪' }).first().getByRole('link', { name: /查看行程/ }).click()
  await expect(page.locator('.detail-hero h1')).toContainText('大阪')
  await page.getByRole('button', { name: /生成 AI 目的地攻略/ }).click()
  await expect(page.locator('.day-plans')).toBeVisible()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'docs/screenshots/trip-detail.png' })

  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const mobilePage = await mobile.newPage()
  await mobilePage.goto('/')
  await mobilePage.waitForTimeout(600)
  await mobilePage.screenshot({ path: 'docs/screenshots/mobile-home.png' })
  await mobilePage.goto('/plan')
  await mobilePage.waitForTimeout(600)
  await mobilePage.screenshot({ path: 'docs/screenshots/mobile-plan.png' })
  await mobile.close()

  await page.goto('/trips')
  const card = page.locator('.trip-card', { hasText: '大阪' }).first()
  await card.getByRole('link', { name: /查看行程/ }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: /删除这份旅行/ }).click()
  await page.waitForURL('**/trips')
})
