import { askDeepSeek } from './deepseek.js'

export function parseJson(text) {
  let clean = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(clean)
  } catch {
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1))
    throw new Error('无法提取 JSON')
  }
}

const PREFERENCE_KEYWORDS = ['美食', '购物', '文化', '自然', '亲子', '历史', '海滩', '温泉', '滑雪', '夜生活', '拍照', '博物馆', '艺术', '户外', '徒步', '古镇', '海岛', '乐园', '酒吧', '咖啡', '演出', '展览', '夜景', '轻松', '悠闲']

const CHINESE_NUM = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 }

function latestMatch(userMessages, patterns) {
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const text = userMessages[i]
    for (const pattern of patterns) {
      const re = new RegExp(pattern.source, 'g')
      const matches = [...text.matchAll(re)]
      if (matches.length) return matches[matches.length - 1]
    }
  }
  return null
}

function regexExtract(messages) {
  const userMessages = messages.filter(m => m.role === 'user' && typeof m.content === 'string').map(m => m.content)
  const clean = {}

  let match = latestMatch(userMessages, [
    /(?:去|到|在)([\u4e00-\u9fa5]{2,10}?)(?:玩|旅游|旅行|度假|游|逛|看看)/,
    /([\u4e00-\u9fa5]{2,10})\s*(\d{1,2})\s*日游/,
    /(?:安排|规划|制定)\s*([\u4e00-\u9fa5]{2,10})/
  ])
  if (match?.[1]) {
    const destination = match[1].replace(/^(?:请|帮我|麻烦|想要|想|打算|计划|安排|规划|制定|订)+/, '').replace(/[，。、\s]/g, '').trim()
    if (destination) clean.destination = destination.slice(0, 100)
  }

  let num = null
  match = latestMatch(userMessages, [
    /(\d{1,2})\s*天/,
    /([\u4e00-\u9fa5]{2,10})\s*(\d{1,2})\s*日游/,
    /([一二两三四五六七八九十]{1,3})日游/,
    /([一二两三四五六七八九十]{1,3})\s*天/
  ])
  if (match) {
    if (match[2]) num = Number(match[2])
    else if (match[1] && CHINESE_NUM[match[1]]) num = CHINESE_NUM[match[1]]
    else num = Number(match[1])
  }
  if (num >= 1 && num <= 14) clean.durationDays = num

  match = latestMatch(userMessages, [
    /预算\s*([0-9]+(?:\.[0-9]+)?)\s*(万)?/,
    /([0-9]+(?:\.[0-9]+)?)\s*(万)(?:元|块)?(?![0-9])/
  ])
  if (match) {
    const value = Number(match[1])
    if (value > 0) clean.budget = match[2] ? value * 10000 : value
  }

  match = latestMatch(userMessages, [/(\d{1,2})\s*个人?/])
  if (match) {
    const value = Number(match[1])
    if (value >= 1 && value <= 30) clean.travelers = value
  }

  match = latestMatch(userMessages, [/(\d{1,2})\s*月/, /([一二三四五六七八九十]{1,3})月/])
  if (match) {
    const numericValue = Number(match[1])
    const value = Number.isFinite(numericValue) && numericValue >= 1 && numericValue <= 12 ? numericValue : CHINESE_NUM[match[1]]
    if (value >= 1 && value <= 12) clean.month = value
  }

  const userText = userMessages.join(' ')
  const preferences = PREFERENCE_KEYWORDS.filter(keyword => userText.includes(keyword))
  if (preferences.length) clean.preferences = preferences.slice(0, 15)

  return clean
}

async function llmExtract(event, messages) {
  const system = '你是行程需求抽取器。从用户的旅行对话中提取最新需求，只输出一个 JSON 对象，结构为 {"destination":null,"month":null,"year":null,"durationDays":null,"budget":null,"travelers":null,"preferences":null}。未提到的字段填 null。规则：destination 必须是用户消息中明确提到的目的地名称，用户从未提到目的地就填 null，严禁编造目的地；month 仅在用户提到出行月份时输出 1-12 的整数，未提到就填 null；year 为四位年份整数，仅在用户提到年份时输出，未提到就填 null；durationDays 为天数整数（如"三天"=3，未提到就填 null）；budget 为人民币金额数字（如"预算10000"=10000、"5000元"=5000，注意"万"需换算成数字，未提到就填 null）；travelers 为出行人数整数（未提到就填 null）；preferences 为中文偏好标签数组（如["美食","文化"]，未提到就填 null）。用户最新要求覆盖旧要求，没有新信息就填 null。所有字符串值内部禁止出现英文双引号。绝对不要输出 JSON 以外的内容。'
  const content = await askDeepSeek(event, [{ role: 'system', content: system }, ...messages], { json: true, maxTokens: 500, timeout: 30000 })
  const parsed = parseJson(content)
  const clean = {}
  const mentionedByUser = (text) => {
    if (!text) return false
    return messages.some(m => {
      if (m.role !== 'user' || typeof m.content !== 'string') return false
      if (m.content.includes(text)) return true
      return text.length > 2 && (m.content.includes(text.slice(0, 2)) || m.content.includes(text.slice(-2)))
    })
  }
  const numeric = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
    return null
  }
  if (typeof parsed.destination === 'string' && parsed.destination.trim() && mentionedByUser(parsed.destination.trim())) {
    clean.destination = parsed.destination.trim().slice(0, 100)
  }
  const mentionedMonth = messages.some(m => m.role === 'user' && typeof m.content === 'string' &&
    (/[一二三四五六七八九十]+月/.test(m.content) || /\b(1[0-2]|[1-9])\s*月/.test(m.content)))
  if (mentionedMonth && Number.isInteger(parsed.month) && parsed.month >= 1 && parsed.month <= 12) clean.month = parsed.month
  if (mentionedMonth && Number.isInteger(parsed.year) && parsed.year >= 2000 && parsed.year <= 2100) clean.year = parsed.year
  const durationDays = numeric(parsed.durationDays)
  if (Number.isInteger(durationDays) && durationDays >= 1 && durationDays <= 14) clean.durationDays = durationDays
  const budget = numeric(parsed.budget)
  if (Number.isFinite(budget) && budget > 0) clean.budget = budget
  const travelers = numeric(parsed.travelers)
  if (Number.isInteger(travelers) && travelers >= 1 && travelers <= 30) clean.travelers = travelers
  if (Array.isArray(parsed.preferences)) {
    clean.preferences = parsed.preferences.filter(p => typeof p === 'string' && p.trim()).map(p => p.trim().slice(0, 40)).slice(0, 15)
  }
  return clean
}

export async function extractRequirements(event, messages) {
  const regexResult = regexExtract(messages)
  if (regexResult.destination) return regexResult
  try {
    const llmResult = await llmExtract(event, messages)
    const merged = { ...regexResult }
    for (const key of Object.keys(llmResult)) {
      if (key === 'preferences') {
        const list = [...(merged.preferences || []), ...(llmResult.preferences || [])]
        const unique = [...new Set(list)]
        if (unique.length) merged.preferences = unique.slice(0, 15)
      } else if (merged[key] === undefined) {
        merged[key] = llmResult[key]
      }
    }
    return merged
  } catch (error) {
    console.warn('需求抽取失败，使用当前旅行信息生成：', error?.message)
    return regexResult
  }
}

const pad = (n) => String(n).padStart(2, '0')
const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const daysInMonth = (year, month) => new Date(year, month, 0).getDate()

export function mergeTrip(trip, req) {
  const next = {
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    travelers: trip.travelers,
    budget: trip.budget,
    preferences: [...trip.preferences],
    image: trip.image
  }
  if (typeof req.destination === 'string' && req.destination.trim()) next.destination = req.destination.trim()
  if (Number.isFinite(req.budget)) next.budget = req.budget
  if (Number.isInteger(req.travelers)) next.travelers = req.travelers
  if (Array.isArray(req.preferences) && req.preferences.length) next.preferences = req.preferences

  const start = new Date(`${trip.startDate}T12:00:00`)
  const end = new Date(`${trip.endDate}T12:00:00`)
  let duration = Math.round((end - start) / 86400000) + 1
  if (Number.isInteger(req.durationDays)) duration = req.durationDays

  let newStart = start
  if (Number.isInteger(req.month)) {
    const now = new Date()
    let year = Number.isInteger(req.year) ? req.year : now.getFullYear()
    if (!Number.isInteger(req.year) && req.month < now.getMonth() + 1) year += 1
    const day = Math.min(start.getDate(), daysInMonth(year, req.month))
    newStart = new Date(year, req.month - 1, day, 12, 0, 0)
  }
  const newEnd = new Date(newStart.getTime())
  newEnd.setDate(newEnd.getDate() + Math.min(duration, 14) - 1)

  next.startDate = formatDate(newStart)
  next.endDate = formatDate(newEnd)
  return next
}
