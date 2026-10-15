<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from '#imports';
import { useTrips } from '~/composables/useTrips';
import TripDetailHero from '~/components/trips/TripDetailHero.vue';
import TripStatsBar from '~/components/trips/TripStatsBar.vue';
import TripInfoSidebar from '~/components/trips/TripInfoSidebar.vue';
import ItinerarySection from '~/components/trips/ItinerarySection.vue';
import ActivityDetailModal from '~/components/trips/ActivityDetailModal.vue';
import DestinationGuide from '~/components/trips/DestinationGuide.vue';

const route = useRoute();
const { getTrip, updateTrip, generateGuide, deleteTrip } = useTrips();

const clone = (value) => JSON.parse(JSON.stringify(value));

const record = ref(null);
const ready = ref(false);
const activeActivity = ref(null);
const guideLoading = ref(false);
const guideError = ref('');
const weatherLoading = ref(false);
const weatherError = ref('');
const toast = ref('');

onMounted(async () => {
  try {
    record.value = await getTrip(String(route.params.id));
  } catch (error) {
    console.error('加载旅行失败：', error);
  }
  ready.value = true;
});

const trip = computed(() => record.value?.trip || {});
const days = computed(() => record.value?.days || []);
const weather = computed(() =>
  trip.value.weatherData && typeof trip.value.weatherData === 'object'
    ? trip.value.weatherData
    : null
);

const dayCount = computed(() => {
  const { startDate, endDate } = trip.value;
  if (startDate && endDate) {
    const diff = Math.round(
      (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000
    );
    if (Number.isFinite(diff) && diff >= 0) return diff + 1;
  }
  return days.value.length || 0;
});

const status = computed(() => {
  const start = trip.value.startDate;
  const end = trip.value.endDate;

  if (!start || !end) return '草稿';

  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-');

  if (today < start) return '即将出发';
  if (today > end) return '已结束';
  return '旅行中';
});

const countdown = computed(() => {
  const start = trip.value.startDate;
  if (!start) return null;

  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const startUtc = Date.parse(`${start}T00:00:00Z`);
  if (!Number.isFinite(startUtc)) return null;

  const diff = Math.round((startUtc - todayUtc) / 86400000);
  if (diff > 0) return { label: `距出发还有 ${diff} 天` };
  if (diff === 0) return { label: '今天出发' };
  return { label: `已出发 ${Math.abs(diff)} 天` };
});

const allActivities = computed(() => days.value.flatMap((day) => day?.activities || []));

const completedCount = computed(
  () => allActivities.value.filter((activity) => activity.completed).length
);

const stats = computed(() => ({
  days: dayCount.value,
  activities: allActivities.value.length,
  travelers: trip.value.travelers || 1,
  budget: trip.value.budget,
  budgetText: Number(trip.value.budget).toLocaleString(),
  perPersonText: Math.round(
    Number(trip.value.budget) / (trip.value.travelers || 1)
  ).toLocaleString(),
  preferences: trip.value.preferences || []
}));

const title = computed(() => record.value?.title || trip.value.destination || '未命名旅行');
const guide = computed(() => trip.value.guide || null);

function notify(message) {
  toast.value = message;
}

async function toggleActivity({ dayIndex, id }) {
  const activities = days.value[dayIndex]?.activities;
  const activity = activities?.find((item) => item.id === id);
  if (!activity || !record.value) return;

  activity.completed = !activity.completed;
  try {
    record.value = await updateTrip(record.value.id, { days: clone(days.value) });
  } catch (error) {
    activity.completed = !activity.completed;
    notify(error?.data?.message || '更新失败，请稍后重试');
  }
}

async function togglePack(name) {
  if (!record.value) return;
  const packed = Array.isArray(trip.value.packedItems) ? [...trip.value.packedItems] : [];
  const index = packed.indexOf(name);
  const hadItem = index >= 0;
  if (hadItem) packed.splice(index, 1);
  else packed.push(name);
  trip.value.packedItems = packed;

  try {
    record.value = await updateTrip(record.value.id, { trip: clone(trip.value) });
  } catch (error) {
    if (hadItem) packed.splice(index, 0, name);
    else packed.pop();
    trip.value.packedItems = packed;
    notify(error?.data?.message || '更新失败，请稍后重试');
  }
}

function openActivity({ dayIndex, activity }) {
  activeActivity.value = { dayIndex, activity };
}

async function handleRefreshWeather() {
  if (!record.value) return;
  weatherLoading.value = true;
  weatherError.value = '';
  try {
    const data = await $fetch(`/api/trips/${encodeURIComponent(record.value.id)}/weather`);
    record.value = {
      ...record.value,
      trip: { ...trip.value, weatherData: data }
    };
    notify('天气预报已更新');
  } catch (error) {
    weatherError.value = error?.data?.message || '天气获取失败，请稍后重试';
  } finally {
    weatherLoading.value = false;
  }
}

async function handleGenerateGuide() {
  if (!record.value) return;
  guideLoading.value = true;
  guideError.value = '';
  try {
    record.value = await generateGuide(record.value.id);
    notify('AI 目的地攻略已生成');
  } catch (error) {
    guideError.value = error?.data?.message || '攻略生成失败，请稍后重试';
  } finally {
    guideLoading.value = false;
  }
}

async function handleDelete() {
  if (!record.value) return;
  if (!window.confirm('确定删除这份旅行计划吗？此操作不可恢复。')) return;
  try {
    await deleteTrip(record.value.id);
    await navigateTo('/trips');
  } catch (error) {
    notify(error?.data?.message || '删除失败，请稍后重试');
  }
}

function handlePrint() {
  window.print();
}
</script>

<template>
  <main class="detail-page">
    <template v-if="ready && record">
      <TripDetailHero
        :title="title"
        :trip="trip"
        :status="status"
        :countdown="countdown"
        :day-count="dayCount"
      />

      <div class="container">
        <TripStatsBar :stats="stats" />

        <div class="detail-layout">
          <div class="detail-sidebar no-print">
            <TripInfoSidebar
              :id="record.id"
              :trip="trip"
              :weather="weather"
              :weather-loading="weatherLoading"
              :weather-error="weatherError"
              @delete="handleDelete"
              @print="handlePrint"
              @toggle-pack="togglePack"
              @refresh-weather="handleRefreshWeather"
            />
          </div>

          <div class="detail-main">
            <ItinerarySection
              :trip="trip"
              :days="days"
              :completed-count="completedCount"
              :total-count="allActivities.length"
              @toggle-activity="toggleActivity"
              @open-activity="openActivity"
            />

            <DestinationGuide
              :guide="guide"
              :loading="guideLoading"
              :error="guideError"
              @generate="handleGenerateGuide"
            />
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="ready" class="not-found container">
      <div class="not-found-icon">✈</div>
      <h2>没有找到这份旅行</h2>
      <NuxtLink to="/trips" class="not-found-link">返回我的旅行</NuxtLink>
    </div>

    <div v-else class="loading container">
      <p>正在加载旅行…</p>
    </div>

    <ActivityDetailModal
      v-if="activeActivity"
      :activity="activeActivity.activity"
      @close="activeActivity = null"
    />

    <div v-if="toast" class="toast" role="status">
      {{ toast }}
      <button aria-label="关闭提示" @click="toast = ''">×</button>
    </div>
  </main>
</template>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f8faff;
  color: #102449;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 24px 100px;
}

.detail-layout {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 22px;
  align-items: start;
  margin-top: 22px;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-width: 0;
}

.not-found,
.loading {
  padding: 140px 24px;
  color: #8b98ad;
  text-align: center;
}

.not-found-icon {
  margin-bottom: 18px;
  color: #3478ff;
  font-size: 44px;
}

.not-found h2 {
  margin: 0 0 20px;
  color: #334766;
}

.not-found-link {
  color: #3478ff;
  text-decoration: none;
}

.toast {
  position: fixed;
  bottom: 26px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 120;
  padding: 13px 18px;
  border-radius: 12px;
  background: #1c355a;
  color: #fff;
  font-size: 13px;
  box-shadow: 0 10px 25px rgba(32, 51, 76, 0.2);
}

.toast button {
  margin-left: 12px;
  border: 0;
  background: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
}

@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .container {
    padding: 20px 14px 70px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 14px 10px 60px;
  }

  .detail-main {
    gap: 16px;
  }

  .toast {
    width: calc(100% - 32px);
    text-align: center;
    font-size: 12px;
    line-height: 1.6;
  }
}

@media print {
  :global(.navbar),
  .detail-sidebar,
  .toast,
  .no-print {
    display: none !important;
  }

  .detail-page {
    background: #fff;
  }

  .detail-layout {
    display: block;
  }

  .container {
    padding: 0;
    max-width: none;
  }
}
</style>
