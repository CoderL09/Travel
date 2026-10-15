import { usePrisma } from '../../../utils/prisma.js';

const escapeText = (value) =>
  String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');

const pad = (n) => String(n).padStart(2, '0');

function formatDate(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function parseTimeRange(timeText) {
  const match = String(timeText || '').match(/(\d{1,2}):(\d{2})\s*[-–—~]+\s*(\d{1,2}):(\d{2})/);
  if (match) {
    return {
      start: `${pad(match[1])}${match[2]}00`,
      end: `${pad(match[3])}${match[4]}00`
    };
  }
  return { start: '090000', end: '110000' };
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, message: '缺少旅行 ID' });

  const prisma = usePrisma(event);
  const row = await prisma.trip.findUnique({ where: { id } });
  if (!row) throw createError({ statusCode: 404, message: '未找到该旅行' });

  const trip = row.trip || {};
  const days = Array.isArray(row.days) ? row.days : [];

  const startText = String(trip.startDate || '');
  const base = /^\d{4}-\d{2}-\d{2}$/.test(startText)
    ? new Date(`${startText}T12:00:00`)
    : new Date();
  const stamp = new Date();
  const stampText = `${formatDate(stamp)}T${pad(stamp.getHours())}${pad(stamp.getMinutes())}00Z`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nexus Travel AI//Travel Planner//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (let i = 0; i < days.length; i++) {
    const day = days[i] || {};
    const dayDate = new Date(base.getTime());
    dayDate.setDate(base.getDate() + i);
    const dateText = formatDate(dayDate);
    const activities = Array.isArray(day.activities) ? day.activities : [];

    for (let j = 0; j < activities.length; j++) {
      const activity = activities[j] || {};
      const time = parseTimeRange(activity.time);
      lines.push(
        'BEGIN:VEVENT',
        `UID:${id}-${i}-${j}@nexus-travel-ai`,
        `DTSTAMP:${stampText}`,
        `DTSTART:${dateText}T${time.start}`,
        `DTEND:${dateText}T${time.end}`,
        `SUMMARY:${escapeText(`${day.title || '行程'} · ${activity.name || '活动'}`)}`,
        `LOCATION:${escapeText(activity.location || '')}`,
        `DESCRIPTION:${escapeText(activity.description || '')}`,
        'END:VEVENT'
      );
    }
  }

  lines.push('END:VCALENDAR');

  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8');
  setHeader(event, 'Content-Disposition', `attachment; filename="trip-${id}.ics"`);
  return lines.join('\r\n');
});
