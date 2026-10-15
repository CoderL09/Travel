import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let savedTripHref = null;

test('主流程：首页 → 聊天 → 生成行程 → 保存 → 详情 → 攻略 → 导出', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /开始规划旅行/ })).toBeVisible();

  await page.goto('/plan');
  await expect(page.getByRole('heading', { name: /探索世界/ })).toBeVisible();

  const input = page.locator('.chat-form input');
  await input.fill('我想去大阪玩3天，预算5000，2个人');
  await input.press('Enter');
  await expect(page.locator('.message-row.assistant').last()).toContainText('生成行程');

  await page.getByRole('button', { name: /确认需求，生成行程/ }).click();
  await expect(page.locator('.message-row.assistant').last()).toContainText('已生成 3 天行程');

  const dayTabs = page.locator('.day-tabs button');
  await expect(dayTabs).toHaveCount(3);
  await expect(page.locator('.itinerary .topline h2')).toHaveText('大阪');

  await page.getByRole('button', { name: '♡ 保存行程' }).click();
  await expect(page.locator('.toast')).toContainText('已保存到我的旅行');

  await page.goto('/trips');
  const card = page.locator('.trip-card', { hasText: '大阪' }).first();
  await expect(card).toBeVisible();
  savedTripHref = await card.getByRole('link', { name: /查看行程/ }).getAttribute('href');
  expect(savedTripHref).toMatch(/^\/trips\//);

  await card.getByRole('link', { name: /查看行程/ }).click();
  await expect(page.locator('.detail-hero h1')).toContainText('大阪');

  await page.getByRole('button', { name: /生成 AI 目的地攻略/ }).click();
  await expect(page.locator('.day-plans')).toBeVisible();
  await expect(page.locator('.day-plans .day-plan')).toHaveCount(3);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: /导出日历/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.ics$/);
});

test('清理：删除测试旅行', async ({ page }) => {
  expect(savedTripHref).toBeTruthy();
  await page.goto(savedTripHref);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /删除这份旅行/ }).click();
  await page.waitForURL('**/trips');
  await expect(page.locator('.trip-card', { hasText: '大阪' })).toHaveCount(0);
});
