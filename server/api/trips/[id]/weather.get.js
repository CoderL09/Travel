import { usePrisma } from '../../../utils/prisma.js';
import { destinationCandidates } from '../../../utils/geo.js';

const pad = (n) => String(n).padStart(2, '0');

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateRange(startText, endText) {
  const start = new Date(`${startText}T12:00:00Z`);
  const end = new Date(`${endText}T12:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  const days = [];
  const cursor = new Date(start.getTime());
  while (cursor <= end) {
    days.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function mergeDaily(target, data) {
  if (!data?.daily) return;
  const time = data.daily.time || [];
  for (let i = 0; i < time.length; i++) {
    target[time[i]] = {
      date: time[i],
      code: data.daily.weather_code?.[i] ?? null,
      tempMax: data.daily.temperature_2m_max?.[i],
      tempMin: data.daily.temperature_2m_min?.[i],
      rainProb: data.daily.precipitation_probability_max?.[i] ?? null,
      rainSum: data.daily.precipitation_sum?.[i] ?? null
    };
  }
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, message: '缺少旅行 ID' });

  const prisma = usePrisma(event);
  const row = await prisma.trip.findUnique({ where: { id } });
  if (!row) throw createError({ statusCode: 404, message: '未找到该旅行' });

  const trip = row.trip || {};
  const destination = typeof trip.destination === 'string' ? trip.destination.trim() : '';
  const startText = String(trip.startDate || '');
  const endText = String(trip.endDate || '');
  if (!destination || !startText || !endText) {
    throw createError({ statusCode: 400, message: '该旅行缺少目的地或日期信息' });
  }

  const forceRefresh = getQuery(event).refresh === '1';
  const cached = trip.weatherData;
  const cacheFresh =
    !forceRefresh &&
    cached &&
    typeof cached === 'object' &&
    Array.isArray(cached.daily) &&
    cached.daily.length &&
    cached.daily.every((day) => Object.prototype.hasOwnProperty.call(day, 'rainSum')) &&
    cached.generatedAt &&
    Date.now() - new Date(cached.generatedAt).getTime() < 6 * 3600 * 1000;
  if (cacheFresh) {
    return { ...cached, cached: true };
  }

  let place = null;
  let lastGeocodeError = '';
  for (const candidate of destinationCandidates(destination)) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const geo = await $fetch('https://nominatim.openstreetmap.org/search', {
          query: { q: candidate, format: 'json', limit: 1, 'accept-language': 'zh' },
          headers: { 'User-Agent': 'NexusTravelAI/1.0 (travel planner demo)' },
          retry: false
        });
        if (Array.isArray(geo) && geo.length) {
          place = geo[0];
          break;
        }
        lastGeocodeError = `「${candidate}」无匹配结果`;
        break;
      } catch (error) {
        lastGeocodeError = `「${candidate}」地理编码失败（${error?.statusCode || error?.status || error?.message}）`;
        if (attempt === 0 && [403, 429].includes(error?.statusCode)) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        break;
      }
    }
    if (place) break;
  }

  const latitude = Number(place?.lat);
  const longitude = Number(place?.lon);
  if (!place || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw createError({
      statusCode: 502,
      message: `无法定位「${destination}」：${lastGeocodeError || '请修改旅行目的地或稍后重试'}`
    });
  }

  const range = dateRange(startText, endText);
  const todayText = formatDate(new Date());
  const past = range.filter((d) => d < todayText);
  const future = range.filter((d) => d >= todayText);
  const forecastEnd = new Date();
  forecastEnd.setDate(forecastEnd.getDate() + 15);
  const forecastEndText = formatDate(forecastEnd);
  const nearFuture = future.filter((d) => d <= forecastEndText);
  const farFuture = future.filter((d) => d > forecastEndText);

  const dailyMap = {};
  const baseQuery = {
    latitude,
    longitude,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto'
  };

  if (nearFuture.length) {
    const data = await $fetch('https://api.open-meteo.com/v1/forecast', {
      query: {
        ...baseQuery,
        start_date: nearFuture[0],
        end_date: nearFuture[nearFuture.length - 1]
      },
      retry: false
    });
    mergeDaily(dailyMap, data);
  }
  if (past.length) {
    const data = await $fetch('https://archive-api.open-meteo.com/v1/archive', {
      query: { ...baseQuery, start_date: past[0], end_date: past[past.length - 1] },
      retry: false
    });
    mergeDaily(dailyMap, data);
  }
  if (farFuture.length) {
    const data = await $fetch('https://climate-api.open-meteo.com/v1/climate', {
      query: {
        latitude,
        longitude,
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
        timezone: 'auto',
        start_date: farFuture[0],
        end_date: farFuture[farFuture.length - 1]
      },
      retry: false
    });
    mergeDaily(dailyMap, data);
  }

  const daily = range.map((date) => dailyMap[date]).filter(Boolean);
  if (!daily.length) {
    throw createError({ statusCode: 502, message: '暂无该日期范围的天气数据' });
  }

  const weatherData = {
    destination:
      String(place.display_name || destination)
        .split(/[,;]/)[0]
        .trim() || destination,
    daily,
    generatedAt: new Date().toISOString()
  };
  await prisma.trip.update({
    where: { id },
    data: { trip: { ...trip, weatherData } }
  });
  return { ...weatherData, cached: false };
});
