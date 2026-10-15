import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { regexExtract, mergeTrip } from '../../server/utils/requirements.js';

const baseTrip = {
  destination: '东京，日本',
  startDate: '2026-11-10',
  endDate: '2026-11-14',
  travelers: 2,
  budget: 10000,
  preferences: ['美食', '购物', '文化'],
  image: '/images/4.jpg'
};

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-15T00:00:00Z'));
});

afterAll(() => {
  vi.useRealTimers();
});

describe('regexExtract 最新要求优先', () => {
  it('后一条消息的天数覆盖先前的天数', () => {
    const result = regexExtract([
      { role: 'user', content: '我想去大阪玩3天，预算5000，2个人' },
      { role: 'assistant', content: '好的。' },
      { role: 'user', content: '改成玩6天吧' }
    ]);
    expect(result.destination).toBe('大阪');
    expect(result.durationDays).toBe(6);
    expect(result.budget).toBe(5000);
    expect(result.travelers).toBe(2);
  });

  it('后一条消息的目的地和天数覆盖先前', () => {
    const result = regexExtract([
      { role: 'user', content: '去大阪玩3天' },
      { role: 'user', content: '帮我安排东京 5 日游' }
    ]);
    expect(result.destination).toBe('东京');
    expect(result.durationDays).toBe(5);
  });

  it('同一条消息内取最后一个数字（不要3天，要5天）', () => {
    const result = regexExtract([{ role: 'user', content: '不要3天，要5天，预算改成2万' }]);
    expect(result.durationDays).toBe(5);
    expect(result.budget).toBe(20000);
  });

  it('最新消息未提天数时沿用最近一次', () => {
    const result = regexExtract([
      { role: 'user', content: '去北海道玩7天' },
      { role: 'user', content: '主要想泡温泉' }
    ]);
    expect(result.destination).toBe('北海道');
    expect(result.durationDays).toBe(7);
    expect(result.preferences).toContain('温泉');
  });

  it('支持中文数字、万单位与动词剥离', () => {
    const result = regexExtract([{ role: 'user', content: '安排京都五日游，预算1万，3个人' }]);
    expect(result.destination).toBe('京都');
    expect(result.durationDays).toBe(5);
    expect(result.budget).toBe(10000);
    expect(result.travelers).toBe(3);
  });

  it('支持中文月份', () => {
    const result = regexExtract([{ role: 'user', content: '十一月份出发，预算8000元' }]);
    expect(result.month).toBe(11);
    expect(result.budget).toBe(8000);
  });

  it('无任何信息时返回空对象', () => {
    const result = regexExtract([{ role: 'user', content: '行程轻松一点' }]);
    expect(result.preferences).toContain('轻松');
    expect(result.destination).toBeUndefined();
    expect(result.durationDays).toBeUndefined();
  });
});

describe('mergeTrip 合并旅行信息', () => {
  it('应用天数、预算与人数', () => {
    const merged = mergeTrip(baseTrip, { durationDays: 3, budget: 5000, travelers: 4 });
    expect(merged.startDate).toBe('2026-11-10');
    expect(merged.endDate).toBe('2026-11-12');
    expect(merged.budget).toBe(5000);
    expect(merged.travelers).toBe(4);
  });

  it('应用目的地，日期保持不变', () => {
    const merged = mergeTrip(baseTrip, { destination: '大阪' });
    expect(merged.destination).toBe('大阪');
    expect(merged.startDate).toBe('2026-11-10');
    expect(merged.endDate).toBe('2026-11-14');
  });

  it('月份晚于当前月时顺延到明年', () => {
    const merged = mergeTrip(baseTrip, { month: 3 });
    expect(merged.startDate).toBe('2027-03-10');
    expect(merged.endDate).toBe('2027-03-14');
  });

  it('无需求时返回原始行程', () => {
    const merged = mergeTrip(baseTrip, {});
    expect(merged).toMatchObject({
      destination: baseTrip.destination,
      startDate: baseTrip.startDate,
      endDate: baseTrip.endDate,
      budget: baseTrip.budget,
      travelers: baseTrip.travelers
    });
  });
});
