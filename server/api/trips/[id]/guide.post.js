import { usePrisma } from '../../../utils/prisma.js';
import { toRecord } from '../../../utils/trips.js';
import { askDeepSeek } from '../../../utils/deepseek.js';
import { parseJson } from '../../../utils/requirements.js';
import { sanitizeGuide, missingGuideSections } from '../../../utils/guide-sanitize.js';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, message: '缺少旅行 ID' });

  const prisma = usePrisma(event);
  const row = await prisma.trip.findUnique({ where: { id } });
  if (!row) throw createError({ statusCode: 404, message: '未找到该旅行' });

  const trip = row.trip || {};
  const savedDays = Array.isArray(row.days) ? row.days : [];
  const itineraryText = savedDays.length
    ? savedDays
        .map(
          (day, i) =>
            `第${i + 1}天「${day.title || '行程'}」：${(day.activities || []).map((a) => `${a.name}（${a.location || '市区'}，${a.duration || '灵活安排'}）`).join('、') || '自由活动'}`
        )
        .join('\n')
    : '暂无具体行程，请按该目的地经典玩法为每天给出建议。';

  const system =
    '你是中文旅行攻略作者。请只输出一个合法 JSON 对象，绝对不要 Markdown，包含且仅包含以下字段：overview（城市速览，60-150 字）、food（美食推荐，60-150 字，含 2-3 个代表美食）、transport（交通指南，60-150 字，含市内交通建议）、culture（文化礼仪，60-150 字）、tips（避坑提示，60-150 字，含 2-3 条实用建议）、dayPlans（数组，长度与旅行天数一致，每项结构为 {"day":1,"title":"当天主题","plan":"当天详细游览方案"}）。dayPlans 的 plan 为 150-400 字，必须具体写清当天先去哪里、怎么去（如乘地铁某号线到某站约多少分钟）、再去哪里、两地之间怎么去（步行/公交/地铁及大约时间）、晚上安排什么。day 从 1 开始连续递增，dayPlans 内容必须基于用户给出的每日行程活动安排。内容真实、实用、面向中国游客。所有字符串值内部禁止出现英文双引号，需要引用时请使用中文引号「」或《》。';
  const context = `旅行信息：${JSON.stringify({ destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate, travelers: trip.travelers, budget: trip.budget, preferences: trip.preferences })}。已规划的每日行程如下：\n${itineraryText}\n请为该目的地撰写一份出发前攻略，dayPlans 必须覆盖每一天。只返回 JSON。`;

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: context }
  ];

  let guide = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    let content;
    try {
      content = await askDeepSeek(event, messages, { json: true, maxTokens: 8192, timeout: 90000 });
    } catch (error) {
      if (attempt === 1) throw error;
      console.warn('AI 攻略生成失败，第', attempt + 1, '次:', error?.message);
      messages.push({ role: 'user', content: '刚才的调用被中断了。请重新输出完整 JSON。' });
      continue;
    }
    try {
      const parsed = parseJson(content);
      const cleaned = sanitizeGuide(parsed);
      const missing = missingGuideSections(cleaned);
      if (!missing.length) {
        guide = cleaned;
        break;
      }
      console.warn('AI 攻略字段缺失，第', attempt + 1, '次:', missing.join('、'));
      if (attempt === 0) {
        messages.push({
          role: 'user',
          content: `刚才的输出缺少字段：${missing.join('、')}。请只输出包含且仅包含 overview、food、transport、culture、tips、dayPlans 六个字段的合法 JSON，dayPlans 必须逐天覆盖行程。不要 Markdown，所有字符串值内部禁止使用英文双引号。`
        });
      } else if (cleaned.overview) {
        guide = cleaned;
      }
    } catch (error) {
      console.warn('AI 攻略 JSON 解析失败，第', attempt + 1, '次:', error?.message);
      if (attempt === 0)
        messages.push({
          role: 'user',
          content:
            '刚才的输出不是合法 JSON。请只输出完整闭合的合法 JSON，不要 Markdown，所有字符串值内部禁止使用英文双引号。'
        });
    }
  }
  if (!guide) {
    throw createError({ statusCode: 502, message: 'AI 攻略生成失败，请稍后重试' });
  }

  const updated = await prisma.trip.update({
    where: { id },
    data: { trip: { ...trip, guide: { ...guide, generatedAt: new Date().toISOString() } } }
  });
  return toRecord(updated);
});
