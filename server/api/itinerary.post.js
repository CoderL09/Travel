import { askDeepSeek, validateMessages } from '../utils/deepseek.js';
import { parseJson, extractRequirements, mergeTrip } from '../utils/requirements.js';
import { sanitizeItinerary } from '../utils/itinerary-sanitize.js';

function validateTrip(trip) {
  if (
    !trip ||
    typeof trip.destination !== 'string' ||
    trip.destination.length > 100 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(trip.startDate || '') ||
    !/^\d{4}-\d{2}-\d{2}$/.test(trip.endDate || '') ||
    !Number.isInteger(trip.travelers) ||
    trip.travelers < 1 ||
    trip.travelers > 30 ||
    typeof trip.budget !== 'number' ||
    !Number.isFinite(trip.budget) ||
    trip.budget < 0 ||
    !Array.isArray(trip.preferences) ||
    trip.preferences.length > 15 ||
    trip.preferences.some((p) => typeof p !== 'string' || p.length > 40)
  ) {
    throw createError({ statusCode: 400, message: '旅行信息格式错误，请先编辑旅行概览' });
  }
  const start = Date.parse(`${trip.startDate}T12:00:00Z`);
  const end = Date.parse(`${trip.endDate}T12:00:00Z`);
  const dayCount = Math.round((end - start) / 86400000) + 1;
  if (!Number.isFinite(dayCount) || dayCount < 1 || dayCount > 14) {
    throw createError({ statusCode: 400, message: '行程日期应为 1 到 14 天' });
  }
  return dayCount;
}

const FALLBACK_MESSAGE = '请根据当前旅行信息安排合理的行程。';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const messages = validateMessages(body?.messages);
  const trip = body?.trip;
  if (!trip || typeof trip !== 'object') {
    throw createError({ statusCode: 400, message: '旅行信息格式错误，请先编辑旅行概览' });
  }

  const hasRealConversation = messages.some((m) => m.content !== FALLBACK_MESSAGE);
  const requirement = hasRealConversation ? await extractRequirements(event, messages) : {};
  const merged = mergeTrip(trip, requirement);
  const dayCount = validateTrip(merged);

  const system = `你是中文旅行规划师。本次行程目的地：「${merged.destination}」。请只输出合法 JSON 对象，绝对不要 Markdown。必须包含字段 destination（字符串，必须严格等于「${merged.destination}」）和 days（数组，最好恰好 ${dayCount} 项）。days 每项结构为 {"day":1,"title":"当天主题","activities":[{"period":"上午","time":"09:00-11:00","name":"景点名","description":"简短介绍","location":"区域","duration":"2小时","tips":"游玩贴士","transport":"交通建议","cost":"人均参考花费","tags":["免费","网红"]}]}。day 从 1 开始连续递增。每天安排 1 到 3 个活动，所有活动必须位于「${merged.destination}」。period 建议使用上午、下午、晚上之一，也可以用清晨、中午、傍晚、全天等自然表达。cost 可以是字符串（如"约80元"）或数字。tips、transport、cost、tags 为可选字段，tags 可以是字符串数组或单个字符串。除上述字段外，还可输出顶层可选字段：guide（目的地攻略概览，不超过 100 字）、packingList（打包清单，3 到 8 个字符串）、weatherHint（季节天气与穿衣提示，不超过 60 字）、budgetPlan（对象，键为交通、住宿、餐饮、门票、购物，值为百分比整数且总和 100）。内容全部中文，活动真实合理。JSON 内容应简洁，每个描述不超过 35 个汉字。所有字符串值内部禁止出现英文双引号，需要引用时请使用中文引号「」或《》。不要编造实时价格或营业时间。请确保 JSON 完整闭合。`;
  const tripContext = `旅行信息：${JSON.stringify({ destination: merged.destination, startDate: merged.startDate, endDate: merged.endDate, travelers: merged.travelers, budget: merged.budget, preferences: merged.preferences })}。结合对话中的最新要求生成完整行程。只返回 JSON。`;
  const requestMessages = [
    { role: 'system', content: system },
    ...messages,
    { role: 'user', content: tripContext }
  ];

  const destinationKey = merged.destination.replace(/[，。、\s]/g, '').slice(0, 2);
  const destinationMatches = (text) => {
    const value = String(text || '').replace(/[，。、\s]/g, '');
    if (!value) return false;
    return (
      value.includes(destinationKey) ||
      (value.length >= 2 && destinationKey.includes(value.slice(0, 2)))
    );
  };

  let result;
  let destinationFixed = true;
  for (let attempt = 0; attempt < 2; attempt++) {
    let content;
    try {
      content = await askDeepSeek(event, requestMessages, {
        json: true,
        maxTokens: 8192,
        timeout: 60000
      });
    } catch (error) {
      if (attempt === 1) throw error;
      console.warn('AI 行程生成调用失败，第 1 次:', error?.message);
      requestMessages.push({
        role: 'user',
        content: '刚才的调用被中断了。请重新输出完整、简洁、合法的 JSON，不要解释，不要 Markdown。'
      });
      continue;
    }
    try {
      const parsed = parseJson(content);
      const sanitized = sanitizeItinerary(parsed, dayCount, merged.destination);
      if (!sanitized) {
        console.warn('AI 行程缺少 days 数组，第', attempt + 1, '次');
        requestMessages.push({
          role: 'user',
          content: `刚才的 JSON 缺少 days 数组或 days 为空。请重新输出恰好 ${dayCount} 天的完整、简洁、合法 JSON，不要解释，不要 Markdown。注意：所有字符串值内部禁止出现未转义的英文双引号，需要引用时请使用中文引号「」或《》。`
        });
        continue;
      }
      if (!destinationMatches(sanitized.destination)) {
        console.warn('AI 行程目的地不一致，第', attempt + 1, '次:', sanitized.destination);
        if (attempt === 0) {
          requestMessages.push({
            role: 'user',
            content: `目的地错了。本次行程目的地必须是「${merged.destination}」，请重新输出目的地为「${merged.destination}」的完整行程，所有活动都必须位于「${merged.destination}」。只输出合法 JSON。`
          });
          continue;
        }
        destinationFixed = false;
      }
      result = sanitized;
      break;
    } catch (error) {
      console.warn(
        'AI JSON 解析失败，第',
        attempt + 1,
        '次:',
        error.message,
        '返回长度:',
        content.length
      );
      requestMessages.push({
        role: 'user',
        content: `刚才的 JSON 无法解析（${error.message}）。请只输出完整闭合的合法 JSON，不要解释，不要 Markdown，所有字符串值内部禁止出现英文双引号。`
      });
    }
  }
  if (!result) {
    throw createError({ statusCode: 502, message: 'AI 行程格式仍不正确，请稍后重新生成' });
  }
  if (!destinationFixed) {
    console.warn('AI 行程目的地经两次尝试仍不一致，使用旅行信息中的目的地');
  }

  return {
    destination: merged.destination,
    days: result.days.map((day, i) => ({
      title: day.title,
      activities: day.activities.map((a, j) => ({
        id: `ai-${i}-${j}-${Date.now()}`,
        period: a.period,
        time: a.time,
        name: a.name,
        description: a.description,
        location: a.location,
        duration: a.duration,
        tips: a.tips,
        transport: a.transport,
        cost: a.cost,
        tags: a.tags
      }))
    })),
    trip: {
      destination: merged.destination,
      startDate: merged.startDate,
      endDate: merged.endDate,
      travelers: merged.travelers,
      budget: merged.budget,
      preferences: merged.preferences,
      image: merged.image,
      guide: result.guide,
      weatherHint: result.weatherHint,
      packingList: result.packingList,
      budgetPlan: result.budgetPlan
    }
  };
});
