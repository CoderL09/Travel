function buildMockReply(messages) {
  const joined = messages.map((m) => m.content).join(' ');
  if (joined.includes('旅行规划师')) {
    const match = joined.match(/恰好 (\d{1,2}) 项/);
    const dayCount = Math.min(Math.max(match ? Number(match[1]) : 3, 1), 14);
    const days = [];
    for (let i = 0; i < dayCount; i++) {
      days.push({
        day: i + 1,
        title: `第${i + 1}天：经典城市探索`,
        activities: [
          {
            period: '上午',
            time: '09:00-11:30',
            name: `第${i + 1}天上午景点`,
            description: '经典地标游览。',
            location: '市中心',
            duration: '2.5小时',
            tips: '建议早到避人流。',
            transport: '地铁直达。',
            cost: '约60元',
            tags: ['经典', '必去']
          },
          {
            period: '下午',
            time: '13:00-16:00',
            name: `第${i + 1}天下午街区`,
            description: '街区漫步与购物。',
            location: '商业区',
            duration: '3小时',
            cost: '约100元',
            tags: ['购物']
          },
          {
            period: '晚上',
            time: '18:00-20:00',
            name: `第${i + 1}天夜市美食`,
            description: '品尝当地美食。',
            location: '美食街',
            duration: '2小时',
            cost: '约80元',
            tags: ['美食']
          }
        ]
      });
    }
    const destination = (joined.match(/目的地：「(.+?)」/) || [])[1] || '大阪';
    return JSON.stringify({
      destination,
      days,
      guide: '这里是目的地攻略概览，涵盖主要景点与玩法。',
      packingList: ['证件', '充电器', '常用药'],
      weatherHint: '出行前请查看天气预报，注意添减衣物。',
      budgetPlan: { 交通: 30, 住宿: 25, 餐饮: 20, 门票: 15, 购物: 10 }
    });
  }
  if (joined.includes('行程需求抽取器')) {
    return JSON.stringify({
      destination: '大阪',
      month: null,
      year: null,
      durationDays: 3,
      budget: 5000,
      travelers: 2,
      preferences: ['美食']
    });
  }
  if (joined.includes('旅行攻略作者')) {
    return JSON.stringify({
      overview: '城市速览内容：这里是一座充满魅力的城市，值得慢慢探索。',
      food: '美食推荐：必尝本地特色小吃与经典料理。',
      transport: '交通指南：市内地铁与公交网络发达，出行便捷。',
      culture: '文化礼仪：入乡随俗，注意公共场所礼仪。',
      tips: '避坑提示：提前购票、避开高峰时段。',
      dayPlans: [
        {
          day: 1,
          title: '第一天：初识城市',
          plan: '上午先去老城区（乘地铁1号线约20分钟），下午步行10分钟到博物馆，晚上逛夜市。'
        },
        {
          day: 2,
          title: '第二天：深入探索',
          plan: '上午去海滨（公交约30分钟），下午打车15分钟到购物区，晚上看夜景。'
        },
        {
          day: 3,
          title: '第三天：休闲返程',
          plan: '上午在公园散步，中午乘地铁到车站，预留时间购买伴手礼。'
        }
      ]
    });
  }
  return '好的，我已记录你的需求。点击“生成行程”即可查看每日安排。';
}

export async function askDeepSeek(
  event,
  messages,
  { json = false, maxTokens = 5000, timeout = 90000 } = {}
) {
  const config = useRuntimeConfig(event);
  if (process.env.AI_MOCK === '1') return buildMockReply(messages);
  if (!config.deepseekApiKey) {
    throw createError({ statusCode: 500, message: '请先配置 NUXT_DEEPSEEK_API_KEY' });
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('DeepSeek 请求超时')), timeout);
    try {
      const result = await $fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.deepseekApiKey}` },
        body: {
          model: 'deepseek-chat',
          stream: false,
          ...(json ? { response_format: { type: 'json_object' } } : {}),
          max_tokens: maxTokens,
          messages
        },
        signal: controller.signal,
        retry: false
      });
      if (result.choices?.[0]?.finish_reason === 'length') throw new Error('模型输出超出长度限制');
      const content = result.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) throw new Error('模型返回空内容');
      return content;
    } catch (error) {
      if (controller.signal.aborted) {
        throw createError({
          statusCode: 504,
          message: 'AI 服务繁忙，响应超时，请稍等 1-2 分钟后重试'
        });
      }
      console.error('DeepSeek API error:', error?.statusCode || error?.status, error?.message);
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      throw createError({ statusCode: 502, message: 'DeepSeek 调用失败，请检查密钥、额度和网络' });
    } finally {
      clearTimeout(timer);
    }
  }
}
export function validateMessages(messages) {
  if (
    !Array.isArray(messages) ||
    messages.length < 1 ||
    messages.length > 24 ||
    messages.some(
      (m) =>
        !m ||
        !['user', 'assistant'].includes(m.role) ||
        typeof m.content !== 'string' ||
        !m.content.trim() ||
        m.content.length > 3000
    )
  ) {
    throw createError({ statusCode: 400, message: '对话消息格式错误或过长' });
  }
  return messages.map((m) => ({ role: m.role, content: m.content }));
}
