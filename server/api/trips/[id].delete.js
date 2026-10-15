import { usePrisma } from '../../utils/prisma.js'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: '缺少旅行 ID' })
  const prisma = usePrisma(event)
  const existing = await prisma.trip.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, message: '未找到该旅行' })
  await prisma.trip.delete({ where: { id } })
  return { ok: true }
})
