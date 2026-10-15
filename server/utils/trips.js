export function toRecord(row) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    trip: row.trip,
    days: row.days,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
