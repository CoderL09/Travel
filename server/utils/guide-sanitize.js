export const GUIDE_SECTIONS = [
  { key: 'overview', label: '城市速览' },
  { key: 'food', label: '美食推荐' },
  { key: 'transport', label: '交通指南' },
  { key: 'culture', label: '文化礼仪' },
  { key: 'tips', label: '避坑提示' }
];

export function sanitizeDayPlans(value) {
  if (!Array.isArray(value) || !value.length) return undefined;
  const plans = value
    .map((item, i) => ({
      day: i + 1,
      title:
        typeof item?.title === 'string' && item.title.trim()
          ? item.title.trim().slice(0, 60)
          : `第${i + 1}天`,
      plan: typeof item?.plan === 'string' && item.plan.trim() ? item.plan.trim().slice(0, 600) : ''
    }))
    .filter((item) => item.plan);
  return plans.length ? plans : undefined;
}

export function sanitizeGuide(data) {
  const guide = {};
  for (const section of GUIDE_SECTIONS) {
    const value = data?.[section.key];
    if (typeof value === 'string') guide[section.key] = value.trim().slice(0, 180);
    else if (value !== undefined && value !== null)
      guide[section.key] = String(value).trim().slice(0, 180);
    else guide[section.key] = '';
  }
  const dayPlans = sanitizeDayPlans(data?.dayPlans);
  if (dayPlans) guide.dayPlans = dayPlans;
  return guide;
}

export function missingGuideSections(guide) {
  const missing = GUIDE_SECTIONS.filter((section) => !guide[section.key]).map(
    (section) => section.label
  );
  if (!guide.dayPlans) missing.push('每日行程详解');
  return missing;
}
