import { usePrisma } from '../../utils/prisma.js';
import { toRecord } from '../../utils/trips.js';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, message: '缺少旅行 ID' });
  const prisma = usePrisma(event);
  const row = await prisma.trip.findUnique({ where: { id } });
  if (!row) throw createError({ statusCode: 404, message: '未找到该旅行' });
  return toRecord(row);
});
