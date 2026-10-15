import { test, expect } from '@playwright/test';
import { renameSync, existsSync, rmSync, mkdirSync, readdirSync } from 'node:fs';

test.skip(!process.env.RECORD_DEMO, '仅执行 npm run demo:video 时录制');

test('录制功能演示视频', async ({ browser }) => {
  const videoDir = 'docs/demo';
  rmSync(videoDir, { recursive: true, force: true });
  mkdirSync(videoDir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: videoDir, size: { width: 1280, height: 800 } }
  });
  const page = await context.newPage();
  const pause = (ms) => page.waitForTimeout(ms);

  try {
    await page.goto('/');
    await pause(1800);

    await page.goto('/plan');
    await pause(1200);

    const input = page.locator('.chat-form input');
    await input.type('我想去大阪玩3天，预算5000，2个人', { delay: 70 });
    await pause(600);
    await input.press('Enter');
    await expect(page.locator('.message-row.assistant').last()).toContainText('生成行程');
    await pause(1200);

    await page.getByRole('button', { name: /确认需求，生成行程/ }).click();
    await expect(page.locator('.message-row.assistant').last()).toContainText('已生成 3 天行程');
    await pause(1800);

    const tabs = page.locator('.day-tabs button');
    await tabs.nth(1).click();
    await pause(1200);
    await tabs.nth(2).click();
    await pause(1500);

    await page.getByRole('button', { name: '♡ 保存行程' }).click();
    await expect(page.locator('.toast')).toContainText('已保存到我的旅行');
    await pause(1600);

    await page.goto('/trips');
    await expect(page.locator('.trip-card', { hasText: '大阪' }).first()).toBeVisible();
    await pause(1500);

    await page
      .locator('.trip-card', { hasText: '大阪' })
      .first()
      .getByRole('link', { name: /查看行程/ })
      .click();
    await expect(page.locator('.detail-hero h1')).toContainText('大阪');
    await pause(1500);

    await page.locator('.activity-card .check').first().click();
    await pause(1500);

    await page.getByRole('button', { name: /生成 AI 目的地攻略/ }).click();
    await expect(page.locator('.day-plans')).toBeVisible();
    await page.locator('.day-plans').scrollIntoViewIfNeeded();
    await pause(4000);

    await page.goto('/trips');
    const card = page.locator('.trip-card', { hasText: '大阪' }).first();
    await card.getByRole('link', { name: /查看行程/ }).click();
    await page.waitForURL(/\/trips\//);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /删除这份旅行/ }).click();
    await page.waitForURL('**/trips');
  } finally {
    await context.close();
  }

  const webm = readdirSync(videoDir).find((f) => f.endsWith('.webm'));
  if (!webm) throw new Error('未找到录制的视频文件');
  renameSync(`${videoDir}/${webm}`, `${videoDir}/demo.webm`);
  expect(existsSync(`${videoDir}/demo.webm`)).toBe(true);
});
