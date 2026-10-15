import { usePrisma } from '../../utils/prisma.js';
import { toRecord, parseDateOnly } from '../../utils/trips.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 255) : '';
  const trip = body?.trip;
  const days = body?.days;
  if (!title || !trip || typeof trip !== 'object' || !Array.isArray(days)) {
    throw createError({ statusCode: 400, message: '保存数据格式错误' });
  }
  const payload = JSON.stringify(body);
  if (payload.length > 4 * 1024 * 1024) {
    throw createError({ statusCode: 400, message: '保存数据过大' });
  }
  const destination = typeof trip.destination === 'string' ? trip.destination.slice(0, 100) : '';

  const prisma = usePrisma(event);
  const record = await prisma.trip.create({
    data: {
      title,
      status:
        typeof body.status === 'string' && body.status.trim()
          ? body.status.trim().slice(0, 20)
          : 'saved',
      destination,
      startDate: parseDateOnly(trip.startDate),
      endDate: parseDateOnly(trip.endDate),
      trip,
      days
    }
  });
  return toRecord(record);
});
