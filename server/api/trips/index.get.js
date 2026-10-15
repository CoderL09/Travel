import { usePrisma } from '../../utils/prisma.js';
import { toRecord } from '../../utils/trips.js';

export default defineEventHandler(async (event) => {
  const prisma = usePrisma(event);
  const rows = await prisma.trip.findMany({ orderBy: { updatedAt: 'desc' } });
  return rows.map(toRecord);
});
