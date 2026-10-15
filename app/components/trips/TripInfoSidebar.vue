<script setup>
import { computed } from 'vue';

const props = defineProps({
  trip: { type: Object, required: true },
  id: { type: String, default: '' },
  weather: { type: Object, default: null },
  weatherLoading: { type: Boolean, default: false },
  weatherError: { type: String, default: '' }
});

const emit = defineEmits(['delete', 'print', 'toggle-pack', 'refresh-weather']);

const packingList = computed(() => {
  const list = props.trip.packingList;
  return Array.isArray(list) ? list : [];
});

const packedItems = computed(() => {
  const packed = props.trip.packedItems;
  return Array.isArray(packed) ? packed : [];
});

const budgetPlan = computed(() => {
  const plan = props.trip.budgetPlan;
  if (!plan || typeof plan !== 'object') return [];
  return Object.entries(plan)
    .filter(([, value]) => Number.isFinite(Number(value)))
    .map(([key, value]) => ({ key, value: Number(value) }));
});

const weatherDaily = computed(() => {
  if (!props.weather || !Array.isArray(props.weather.daily)) return [];
  return props.weather.daily;
});

const planColors = ['#3478ff', '#5a8dff', '#7ba8ff', '#a3c2ff', '#c7d9ff'];

function isPacked(name) {
  return packedItems.value.includes(name);
}

function formatDate(date) {
  if (!date) return '待定';
  return String(date).replaceAll('-', '.');
}
</script>

<template>
  <aside class="info-sidebar">
    <section class="side-card">
      <div class="side-title">
        <h2>旅行信息</h2>
        <span class="side-rule"></span>
      </div>

      <dl class="info-list">
        <div>
          <dt>目的地</dt>
          <dd>{{ trip.destination || '未命名目的地' }}</dd>
        </div>
        <div>
          <dt>日期</dt>
          <dd>{{ formatDate(trip.startDate) }} — {{ formatDate(trip.endDate) }}</dd>
        </div>
        <div>
          <dt>出行人数</dt>
          <dd>{{ trip.travelers || 1 }} 人</dd>
        </div>
        <div v-if="trip.budget">
          <dt>总预算</dt>
          <dd>¥{{ Number(trip.budget).toLocaleString() }}</dd>
        </div>
        <div v-if="trip.preferences?.length">
          <dt>旅行偏好</dt>
          <dd class="pref-line">
            <span v-for="pref in trip.preferences" :key="pref">{{ pref }}</span>
          </dd>
        </div>
      </dl>
    </section>

    <section v-if="budgetPlan.length" class="side-card">
      <div class="side-title">
        <h2>预算分配</h2>
        <span class="side-rule"></span>
      </div>

      <div class="plan-list">
        <div v-for="(item, index) in budgetPlan" :key="item.key" class="plan-row">
          <div class="plan-head">
            <span>{{ item.key }}</span>
            <span>{{ item.value }}%</span>
          </div>
          <div class="plan-bar">
            <i
              :style="{
                width: item.value + '%',
                background: planColors[index % planColors.length]
              }"
            ></i>
          </div>
        </div>
      </div>
    </section>

    <section v-if="trip.weatherHint" class="side-card">
      <div class="side-title">
        <h2>天气提示</h2>
        <span class="side-rule"></span>
      </div>
      <p class="hint-text">◌ {{ trip.weatherHint }}</p>
    </section>

    <section class="side-card">
      <div class="side-title">
        <h2>天气预报</h2>
        <span class="side-rule"></span>
        <button
          type="button"
          class="weather-refresh"
          :disabled="weatherLoading"
          aria-label="刷新天气预报"
          @click="emit('refresh-weather')"
        >
          ↻
        </button>
      </div>

      <div v-if="weatherLoading" class="weather-state">正在获取天气…</div>
      <div v-else-if="weatherError" class="weather-state error">{{ weatherError }}</div>
      <div v-else-if="weatherDaily.length" class="weather-list">
        <div v-for="day in weatherDaily" :key="day.date" class="weather-row">
          <span class="w-date">{{ formatWeatherDate(day.date) }}</span>
          <span class="w-icon">{{ weatherDayLabel(day).icon }}</span>
          <span class="w-desc">{{ weatherDayLabel(day).label }}</span>
          <span class="w-temp">{{ Math.round(day.tempMax) }}° / {{ Math.round(day.tempMin) }}°</span>
          <span v-if="Number.isFinite(day.rainProb)" class="w-rain">💧 {{ day.rainProb }}%</span>
        </div>
        <p v-if="weatherDaily.some((day) => isClimateDay(day))" class="weather-note">
          超出 16 天预报范围，以上为历史气候常态，仅供参考
        </p>
      </div>
      <button v-else type="button" class="weather-fetch" @click="emit('refresh-weather')">
        获取实时天气
      </button>
    </section>

    <section v-if="packingList.length" class="side-card">
      <div class="side-title">
        <h2>行前清单</h2>
        <span class="side-rule"></span>
      </div>

      <ul class="packing-list">
        <li v-for="item in packingList" :key="item">
          <button
            type="button"
            class="pack-check"
            :class="{ done: isPacked(item) }"
            :aria-pressed="isPacked(item)"
            @click="emit('toggle-pack', item)"
          >
            <span class="box">{{ isPacked(item) ? '✓' : '' }}</span>
            <span class="pack-name">{{ item }}</span>
          </button>
        </li>
      </ul>
    </section>

    <section class="side-card actions">
      <a v-if="id" class="side-action" :href="`/api/trips/${id}/ics`" download>▤ 导出日历</a>
      <button type="button" class="side-action" @click="emit('print')">♢ 打印行程</button>
      <NuxtLink to="/plan" class="side-action link">✦ 前往规划页</NuxtLink>
      <button type="button" class="side-action danger" @click="emit('delete')">删除这份旅行</button>
    </section>
  </aside>
</template>

<style scoped>
.info-sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: sticky;
  top: 24px;
  min-width: 0;
}

.side-card {
  padding: 22px 24px;
  border: 1px solid #edf0f6;
  border-radius: 18px;
  background: #fff;
}

.side-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.side-title h2 {
  margin: 0;
  font-size: 15px;
  white-space: nowrap;
}

.side-rule {
  flex: 1;
  height: 1px;
  background: #edf0f6;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 13px;
  margin: 0;
}

.info-list > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.info-list dt {
  color: #98a5ba;
  font-size: 12px;
  white-space: nowrap;
}

.info-list dd {
  margin: 0;
  color: #334766;
  font-size: 13px;
  text-align: right;
}

.pref-line {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.pref-line span {
  padding: 4px 9px;
  border-radius: 100px;
  background: #eaf0fc;
  color: #5874a5;
  font-size: 11px;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.plan-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  color: #61718d;
  font-size: 12px;
}

.plan-bar {
  height: 7px;
  overflow: hidden;
  border-radius: 100px;
  background: #f0f3f9;
}

.plan-bar i {
  display: block;
  height: 100%;
  border-radius: 100px;
}

.hint-text {
  margin: 0;
  color: #7b889d;
  font-size: 13px;
  line-height: 1.8;
}

.weather-refresh {
  border: 0;
  background: #f3f6fb;
  color: #52749f;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.weather-refresh:disabled {
  opacity: 0.5;
  cursor: wait;
}

.weather-refresh:hover {
  background: #e8eef9;
}

.weather-state {
  color: #7b889d;
  font-size: 13px;
  padding: 6px 0;
}

.weather-state.error {
  color: #d0565e;
}

.weather-fetch {
  border: 0;
  background: #eaf0fc;
  color: #3478ff;
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 12px;
  cursor: pointer;
}

.weather-list {
  display: flex;
  flex-direction: column;
}

.weather-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f3f8;
  font-size: 12px;
}

.weather-row:last-child {
  border-bottom: 0;
}

.w-date {
  color: #61718d;
  white-space: nowrap;
  width: 48px;
}

.w-icon {
  font-size: 15px;
}

.w-desc {
  color: #334766;
  flex: 1;
  min-width: 0;
}

.w-temp {
  color: #102449;
  font-weight: 600;
  white-space: nowrap;
}

.w-rain {
  color: #5a8dff;
  white-space: nowrap;
}

.weather-note {
  margin: 8px 0 0;
  color: #98a5ba;
  font-size: 11px;
  line-height: 1.6;
}

.packing-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pack-check {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 7px 6px;
  border: 0;
  background: none;
  cursor: pointer;
  text-align: left;
}

.box {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 2px solid #c6d2e6;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
}

.pack-check.done .box {
  border-color: #3478ff;
  background: #3478ff;
}

.pack-name {
  color: #46586f;
  font-size: 13px;
}

.pack-check.done .pack-name {
  color: #a5b1c2;
  text-decoration: line-through;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.side-action {
  padding: 11px;
  border: 0;
  border-radius: 11px;
  background: #f3f6fb;
  color: #36506f;
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
}

.side-action.link {
  background: #eaf0fc;
  color: #3478ff;
  font-weight: 600;
}

.side-action:hover {
  background: #e8eef9;
}

.side-action.danger {
  background: transparent;
  color: #b3545e;
}

.side-action.danger:hover {
  background: #fdf0f1;
}

@media (max-width: 900px) {
  .info-sidebar {
    position: static;
  }
}
</style>
