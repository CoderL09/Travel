import { describe, it, expect } from 'vitest';
import {
  normalizePeriod,
  sanitizeTags,
  sanitizeActivity,
  sanitizeBudgetPlan,
  sanitizeItinerary
} from '../../server/utils/itinerary-sanitize.js';

describe('normalizePeriod 时段归一化', () => {
  it('自然表达映射到上午/下午/晚上', () => {
    expect(normalizePeriod('清晨')).toBe('上午');
    expect(normalizePeriod('早晨')).toBe('上午');
    expect(normalizePeriod('中午')).toBe('下午');
    expect(normalizePeriod('傍晚')).toBe('晚上');
    expect(normalizePeriod('黄昏')).toBe('晚上');
    expect(normalizePeriod('夜晚')).toBe('晚上');
    expect(normalizePeriod('全天')).toBe('上午');
    expect(normalizePeriod('白天')).toBe('上午');
  });

  it('标准值保持不变', () => {
    expect(normalizePeriod('上午')).toBe('上午');
    expect(normalizePeriod('下午')).toBe('下午');
    expect(normalizePeriod('晚上')).toBe('晚上');
  });

  it('未知或非字符串值兜底为上午', () => {
    expect(normalizePeriod('随便写写')).toBe('上午');
    expect(normalizePeriod(123)).toBe('上午');
    expect(normalizePeriod(null)).toBe('上午');
    expect(normalizePeriod('')).toBe('上午');
  });
});

describe('sanitizeActivity 活动字段修复', () => {
  it('数字 cost 转为字符串', () => {
    const activity = sanitizeActivity({ name: '某景点', cost: 80 });
    expect(activity.cost).toBe('约80元');
  });

  it('字符串 tags 包装为数组', () => {
    const activity = sanitizeActivity({ name: '某景点', tags: '免费' });
    expect(activity.tags).toEqual(['免费']);
  });

  it('缺少名称的活动被丢弃', () => {
    expect(sanitizeActivity({ time: '09:00-10:00' })).toBeNull();
    expect(sanitizeActivity(null)).toBeNull();
    expect(sanitizeActivity('字符串')).toBeNull();
  });

  it('缺失字段使用空串兜底', () => {
    const activity = sanitizeActivity({ name: '某景点' });
    expect(activity.time).toBe('');
    expect(activity.description).toBe('');
    expect(activity.location).toBe('');
    expect(activity.duration).toBe('');
    expect(activity.period).toBe('上午');
    expect(activity.tips).toBeUndefined();
  });
});

describe('sanitizeTags', () => {
  it('超过 4 个的标签被裁剪', () => {
    expect(sanitizeTags(['a', 'b', 'c', 'd', 'e', 'f'])).toEqual(['a', 'b', 'c', 'd']);
  });

  it('过滤空值并截断超长标签', () => {
    expect(sanitizeTags(['好标签', null, '   ', '这个标签实在是太长了需要截断处理一下'])).toEqual([
      '好标签',
      '这个标签实在是太长了'
    ]);
  });

  it('非法输入返回 undefined', () => {
    expect(sanitizeTags(42)).toBeUndefined();
    expect(sanitizeTags([])).toBeUndefined();
    expect(sanitizeTags(undefined)).toBeUndefined();
  });
});

describe('sanitizeBudgetPlan', () => {
  it('总和为 100 时保留', () => {
    expect(sanitizeBudgetPlan({ 交通: 30, 住宿: 25, 餐饮: 20, 门票: 15, 购物: 10 })).toEqual({
      交通: 30,
      住宿: 25,
      餐饮: 20,
      门票: 15,
      购物: 10
    });
  });

  it('总和偏差过大时丢弃', () => {
    expect(sanitizeBudgetPlan({ 交通: 10 })).toBeUndefined();
    expect(sanitizeBudgetPlan({ 交通: 50, 住宿: 50, 餐饮: 20 })).toBeUndefined();
  });

  it('单项占比 100 时保留', () => {
    expect(sanitizeBudgetPlan({ 交通: 100 })).toEqual({ 交通: 100 });
  });

  it('空对象或非法输入返回 undefined', () => {
    expect(sanitizeBudgetPlan({})).toBeUndefined();
    expect(sanitizeBudgetPlan(null)).toBeUndefined();
    expect(sanitizeBudgetPlan('文本')).toBeUndefined();
  });
});

describe('sanitizeItinerary 行程整体修复', () => {
  it('天数超过请求天数时裁剪', () => {
    const parsed = {
      destination: '东京',
      days: [1, 2, 3, 4, 5].map((day) => ({
        title: `第${day}天`,
        activities: [{ name: '景点', time: '09:00-10:00', period: '上午' }]
      }))
    };
    const result = sanitizeItinerary(parsed, 3, '东京');
    expect(result.days.length).toBe(3);
  });

  it('天数不足时保留并重编号', () => {
    const parsed = {
      days: [{ title: '第一天', activities: [{ name: '景点', time: '09:00-10:00' }] }]
    };
    const result = sanitizeItinerary(parsed, 5, '默认目的地');
    expect(result.days.length).toBe(1);
    expect(result.destination).toBe('默认目的地');
  });

  it('无活动的一天使用占位活动', () => {
    const parsed = { days: [{ title: '空闲的一天', activities: [] }] };
    const result = sanitizeItinerary(parsed, 1, '东京');
    expect(result.days[0].activities.length).toBe(1);
    expect(result.days[0].activities[0].name).toBe('自由活动');
  });

  it('完全不可用时返回 null', () => {
    expect(sanitizeItinerary(null, 3, '东京')).toBeNull();
    expect(sanitizeItinerary({}, 3, '东京')).toBeNull();
    expect(sanitizeItinerary({ days: [] }, 3, '东京')).toBeNull();
    expect(sanitizeItinerary({ days: '不是数组' }, 3, '东京')).toBeNull();
  });

  it('可选字段被清理', () => {
    const parsed = {
      days: [{ title: '第一天', activities: [{ name: '景点', time: '09:00-10:00' }] }],
      packingList: ['证件', null, '充电器', 123, ''],
      guide: 42,
      weatherHint: '注意保暖'
    };
    const result = sanitizeItinerary(parsed, 1, '东京');
    expect(result.packingList).toEqual(['证件', '充电器', '123']);
    expect(result.guide).toBeUndefined();
    expect(result.weatherHint).toBe('注意保暖');
  });
});
