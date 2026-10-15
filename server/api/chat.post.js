import { askDeepSeek, validateMessages } from '../utils/deepseek.js';
import { extractRequirements, mergeTrip } from '../utils/requirements.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const messages = validateMessages(body?.messages);
  const reply = await askDeepSeek(
    event,
    [
      {
        role: 'system',
        content:
          '你是 Nexus Travel AI 的中文旅行顾问。简洁、友好地帮助用户制定旅行计划。优先确认目的地、天数、预算、人数、旅行偏好。当用户提出出行月份、天数、预算、人数、目的地或偏好变化时，先简要确认并告知：这些信息会实时同步到右侧旅行概览，点击“生成行程”后应用到行程面板。不要编造实时营业时间、票价或预订信息。用户可以点击“生成行程”把讨论转化为每日活动卡片。'
      },
      ...messages
    ],
    { maxTokens: 1600 }
  );

  const trip = body?.trip;
  let updatedTrip = null;
  if (
    trip &&
    typeof trip === 'object' &&
    typeof trip.startDate === 'string' &&
    typeof trip.endDate === 'string' &&
    Array.isArray(trip.preferences)
  ) {
    try {
      const requirement = await extractRequirements(event, messages);
      if (Object.keys(requirement).length) updatedTrip = mergeTrip(trip, requirement);
    } catch (error) {
      console.warn('对话行程信息抽取失败：', error?.message);
    }
  }
  return { reply, trip: updatedTrip };
});
