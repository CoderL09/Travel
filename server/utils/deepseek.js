export async function askDeepSeek(event, messages, { json = false, maxTokens = 5000, timeout = 90000 } = {}) {
  const config = useRuntimeConfig(event)
  if (!config.deepseekApiKey) {
    throw createError({ statusCode: 500, message: '请先配置 NUXT_DEEPSEEK_API_KEY' })
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(new Error('DeepSeek 请求超时')), timeout)
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
      })
      if (result.choices?.[0]?.finish_reason === 'length') throw new Error('模型输出超出长度限制')
      const content = result.choices?.[0]?.message?.content
      if (typeof content !== 'string' || !content.trim()) throw new Error('模型返回空内容')
      return content
    } catch (error) {
      if (controller.signal.aborted) {
        throw createError({ statusCode: 504, message: 'AI 服务繁忙，响应超时，请稍等 1-2 分钟后重试' })
      }
      console.error('DeepSeek API error:', error?.statusCode || error?.status, error?.message)
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }
      throw createError({ statusCode: 502, message: 'DeepSeek 调用失败，请检查密钥、额度和网络' })
    } finally {
      clearTimeout(timer)
    }
  }
}
export function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 24 ||
    messages.some(m => !m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 3000)) {
    throw createError({ statusCode: 400, message: '对话消息格式错误或过长' })
  }
  return messages.map(m => ({ role: m.role, content: m.content }))
}
