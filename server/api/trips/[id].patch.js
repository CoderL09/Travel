import { usePrisma } from '../../utils/prisma.js'
import { toRecord, parseDateOnly } from '../../utils/trips.js'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: '缺少旅行 ID' })

  const body = await readBody(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: '更新数据格式错误' })
  }

  const payload = JSON.stringify(body)
  if (payload.length > 4 * 1024 * 1024) {
    throw createError({ statusCode: 400, message: '更新数据过大' })
  }

  const prisma = usePrisma(event)
  const row = await prisma.trip.findUnique({ where: { id } })
  if (!row) throw createError({ statusCode: 404, message: '未找到该旅行' })

  const data = {}
  if (typeof body.title === 'string' && body.title.trim()) {
    data.title = body.title.trim().slice(0, 255)
  }
  if (typeof body.status === 'string' && body.status.trim()) {
    data.status = body.status.trim().slice(0, 20)
  }
  if (body.trip !== undefined) {
    if (!body.trip || typeof body.trip !== 'object' || Array.isArray(body.trip)) {
      throw createError({ statusCode: 400, message: '旅行信息格式错误' })
    }
    data.trip = body.trip
    if (typeof body.trip.destination === 'string') {
      data.destination = body.trip.destination.slice(0, 100)
    }
    data.startDate = parseDateOnly(body.trip.startDate)
    data.endDate = parseDateOnly(body.trip.endDate)
  }
  if (body.days !== undefined) {
    if (!Array.isArray(body.days)) {
      throw createError({ statusCode: 400, message: '行程天数格式错误' })
    }
    data.days = body.days
  }
  if (!Object.keys(data).length) {
    throw createError({ statusCode: 400, message: '没有可更新的内容' })
  }

  const updated = await prisma.trip.update({ where: { id }, data })
  return toRecord(updated)
})
