export const PERIOD_RULES = [
  ['清晨', '上午'],
  ['早晨', '上午'],
  ['早上', '上午'],
  ['上午', '上午'],
  ['正午', '下午'],
  ['中午', '下午'],
  ['午后', '下午'],
  ['下午', '下午'],
  ['傍晚', '晚上'],
  ['黄昏', '晚上'],
  ['夜晚', '晚上'],
  ['夜间', '晚上'],
  ['晚上', '晚上'],
  ['全天', '上午'],
  ['白天', '上午'],
  ['夜里', '晚上'],
  ['夜', '晚上'],
  ['晚', '晚上']
];

export function normalizePeriod(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return '上午';
  for (const [pattern, mapped] of PERIOD_RULES) {
    if (text.includes(pattern)) return mapped;
  }
  return '上午';
}

const asString = (value, fallback = '') => {
  if (typeof value === 'string') return value.trim() || fallback;
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const cleanText = (value, max) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;

export function sanitizeTags(value) {
  if (typeof value === 'string') return value.trim() ? [value.trim().slice(0, 10)] : undefined;
  if (!Array.isArray(value)) return undefined;
  const tags = value
    .filter((t) => t !== undefined && t !== null)
    .map((t) => String(t).trim())
    .filter(Boolean)
    .map((t) => t.slice(0, 10))
    .slice(0, 4);
  return tags.length ? tags : undefined;
}

export function sanitizeActivity(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = asString(raw.name ?? raw.title);
  if (!name) return null;
  return {
    period: normalizePeriod(raw.period),
    time: asString(raw.time),
    name,
    description: asString(raw.description),
    location: asString(raw.location),
    duration: asString(raw.duration),
    tips: cleanText(raw.tips, 80),
    transport: cleanText(raw.transport, 80),
    cost: typeof raw.cost === 'number' ? `约${Math.round(raw.cost)}元` : cleanText(raw.cost, 20),
    tags: sanitizeTags(raw.tags)
  };
}

export function sanitizeBudgetPlan(plan) {
  if (!plan || typeof plan !== 'object') return undefined;
  const keys = ['交通', '住宿', '餐饮', '门票', '购物'];
  const cleaned = {};
  let total = 0;
  for (const key of keys) {
    const value = Number(plan[key]);
    if (Number.isFinite(value) && value > 0) {
      cleaned[key] = Math.round(value);
      total += Math.round(value);
    }
  }
  if (!Object.keys(cleaned).length || total < 90 || total > 110) return undefined;
  return cleaned;
}

export function sanitizeItinerary(parsed, dayCount, fallbackDestination) {
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray(parsed.days) ||
    parsed.days.length < 1
  )
    return null;
  const sourceDays = parsed.days.length > dayCount ? parsed.days.slice(0, dayCount) : parsed.days;
  const days = sourceDays.map((day, i) => {
    const activities = Array.isArray(day?.activities) ? day.activities : [];
    const cleaned = [];
    for (let j = 0; j < activities.length && cleaned.length < 5; j++) {
      const activity = sanitizeActivity(activities[j]);
      if (activity) cleaned.push(activity);
    }
    if (!cleaned.length) {
      cleaned.push({
        period: '上午',
        time: '09:00-12:00',
        name: '自由活动',
        description: '根据个人兴趣自由安排当天行程。',
        location: '',
        duration: '半天',
        tags: undefined
      });
    }
    return { title: asString(day?.title, `第${i + 1}天`), activities: cleaned };
  });
  return {
    destination: asString(parsed.destination, fallbackDestination).slice(0, 100),
    days,
    guide: cleanText(parsed.guide, 100),
    weatherHint: cleanText(parsed.weatherHint, 60),
    packingList: Array.isArray(parsed.packingList)
      ? parsed.packingList
          .filter((item) => item !== undefined && item !== null)
          .map((item) => String(item).trim())
          .filter(Boolean)
          .map((item) => item.slice(0, 30))
          .slice(0, 8)
      : undefined,
    budgetPlan: sanitizeBudgetPlan(parsed.budgetPlan)
  };
}
