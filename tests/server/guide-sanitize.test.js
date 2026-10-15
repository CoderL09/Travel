import { describe, it, expect } from 'vitest';
import {
  sanitizeGuide,
  sanitizeDayPlans,
  missingGuideSections,
  GUIDE_SECTIONS
} from '../../server/utils/guide-sanitize.js';

describe('sanitizeGuide 攻略字段净化', () => {
  it('字符串字段保留并截断', () => {
    const guide = sanitizeGuide({ overview: '  城市速览内容  '.padEnd(300, '长') });
    expect(guide.overview).toBe('城市速览内容  '.padEnd(180, '长'));
  });

  it('非字符串字段强转，缺失字段置空', () => {
    const guide = sanitizeGuide({ overview: 42, food: null });
    expect(guide.overview).toBe('42');
    expect(guide.food).toBe('');
    expect(guide.transport).toBe('');
    expect(guide.culture).toBe('');
    expect(guide.tips).toBe('');
  });

  it('dayPlans 合法时保留并重编号', () => {
    const guide = sanitizeGuide({
      overview: '城市速览',
      dayPlans: [{ day: 3, title: '错误天数', plan: '详细方案' }, { plan: '  第二条方案  ' }]
    });
    expect(guide.dayPlans.length).toBe(2);
    expect(guide.dayPlans[0].day).toBe(1);
    expect(guide.dayPlans[0].title).toBe('错误天数');
    expect(guide.dayPlans[1].day).toBe(2);
    expect(guide.dayPlans[1].plan).toBe('第二条方案');
  });

  it('dayPlans 空计划被过滤', () => {
    const guide = sanitizeGuide({
      overview: '城市速览',
      dayPlans: [{ title: '没有内容', plan: '   ' }]
    });
    expect(guide.dayPlans).toBeUndefined();
  });
});

describe('sanitizeDayPlans', () => {
  it('plan 超过 600 字被截断', () => {
    const plans = sanitizeDayPlans([{ title: '第一天', plan: '长'.repeat(700) }]);
    expect(plans[0].plan.length).toBe(600);
  });

  it('title 超过 60 字被截断，缺省用第N天', () => {
    const plans = sanitizeDayPlans([{ plan: '方案' }, { title: '主题'.repeat(50), plan: '方案' }]);
    expect(plans[0].title).toBe('第1天');
    expect(plans[1].title.length).toBe(60);
  });
});

describe('missingGuideSections 缺失检测', () => {
  it('全部齐全时无缺失', () => {
    const guide = sanitizeGuide({
      overview: '速览',
      food: '美食',
      transport: '交通',
      culture: '礼仪',
      tips: '提示',
      dayPlans: [{ plan: '方案' }]
    });
    expect(missingGuideSections(guide)).toEqual([]);
  });

  it('列出缺失板块与每日行程', () => {
    const guide = sanitizeGuide({ overview: '速览' });
    const missing = missingGuideSections(guide);
    expect(missing).toContain('美食推荐');
    expect(missing).toContain('每日行程详解');
    expect(GUIDE_SECTIONS.length).toBe(5);
  });
});
