const WEATHER_META = {
  0: { icon: '☀️', label: '晴' },
  1: { icon: '🌤️', label: '大致晴朗' },
  2: { icon: '⛅', label: '多云' },
  3: { icon: '☁️', label: '阴' },
  45: { icon: '🌫️', label: '雾' },
  48: { icon: '🌫️', label: '雾凇' },
  51: { icon: '🌦️', label: '小毛毛雨' },
  53: { icon: '🌦️', label: '毛毛雨' },
  55: { icon: '🌧️', label: '强毛毛雨' },
  56: { icon: '🌧️', label: '冻毛毛雨' },
  57: { icon: '🌧️', label: '强冻毛毛雨' },
  61: { icon: '🌦️', label: '小雨' },
  63: { icon: '🌧️', label: '中雨' },
  65: { icon: '🌧️', label: '大雨' },
  66: { icon: '🌧️', label: '冻雨' },
  67: { icon: '🌧️', label: '强冻雨' },
  71: { icon: '🌨️', label: '小雪' },
  73: { icon: '🌨️', label: '中雪' },
  75: { icon: '❄️', label: '大雪' },
  77: { icon: '❄️', label: '雪粒' },
  80: { icon: '🌦️', label: '阵雨' },
  81: { icon: '🌧️', label: '强阵雨' },
  82: { icon: '⛈️', label: '强雷雨' },
  85: { icon: '🌨️', label: '阵雪' },
  86: { icon: '🌨️', label: '强阵雪' },
  95: { icon: '⛈️', label: '雷雨' },
  96: { icon: '⛈️', label: '雷雨伴冰雹' },
  99: { icon: '⛈️', label: '强雷雨伴冰雹' }
};

export function weatherFor(code) {
  if (code === null || code === undefined) return { icon: '📅', label: '气候常态' };
  return WEATHER_META[code] || { icon: '🌡️', label: '未知' };
}

export function isClimateDay(day) {
  return day && (day.code === null || day.code === undefined);
}

export function weatherDayLabel(day) {
  if (!day || isClimateDay(day)) {
    if (Number.isFinite(day?.rainSum) && day.rainSum > 0.5) return { icon: '☔', label: '常有雨' };
    if (Number.isFinite(day?.rainSum)) return { icon: '🌤️', label: '基本无雨' };
    return { icon: '📅', label: '气候常态' };
  }
  return weatherFor(day.code);
}

export function formatWeatherDate(dateText) {
  const match = String(dateText || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateText;
  return `${Number(match[2])}月${Number(match[3])}日`;
}
