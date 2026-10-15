<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTrips } from '~/composables/useTrips';
import TripCard from '~/components/trips/TripCard.vue';

const { trips, loadTrips, deleteTrip } = useTrips();

const keyword = ref('');
const activeFilter = ref('全部');
const ready = ref(false);

const filters = ['全部', '即将出发', '旅行中', '已结束', '草稿'];

onMounted(async () => {
  await loadTrips();
  ready.value = true;
});

function getStatus(record) {
  const start = record.trip?.startDate;
  const end = record.trip?.endDate;

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
}

const filteredTrips = computed(() => {
  return trips.value.filter((record) => {
    const searchText = [record.title, record.trip?.destination].join(' ').toLowerCase();

    const matchesKeyword = searchText.includes(keyword.value.trim().toLowerCase());

    const matchesFilter = activeFilter.value === '全部' || getStatus(record) === activeFilter.value;

    return matchesKeyword && matchesFilter;
  });
});

async function handleDelete(id) {
  if (window.confirm('确定删除这条旅行计划吗？')) {
    try {
      await deleteTrip(id);
    } catch (error) {
      console.error('删除旅行失败：', error);
      window.alert(error?.data?.message || '删除失败，请稍后重试');
    }
  }
}
</script>

<template>
  <main class="trips-page">
    <div class="page-container">
      <header class="page-header">
        <div>
          <span class="eyebrow">YOUR JOURNEYS</span>
          <h1>我的旅行<span class="accent">.</span></h1>
          <p>每一段旅程，都值得被好好收藏。</p>
        </div>

        <NuxtLink to="/plan" class="create-button">
          <span>＋</span>
          规划新旅行
        </NuxtLink>
      </header>

      <section class="toolbar">
        <div class="filters">
          <button
            v-for="filter in filters"
            :key="filter"
            type="button"
            :class="{ active: activeFilter === filter }"
            @click="activeFilter = filter"
          >
            {{ filter }}
          </button>
        </div>

        <input v-model="keyword" class="search-input" placeholder="搜索目的地或旅行名称..." />
      </section>

      <section v-if="ready && filteredTrips.length" class="trip-grid">
        <TripCard
          v-for="record in filteredTrips"
          :key="record.id"
          :record="record"
          @delete="handleDelete"
        />
      </section>

      <section v-else-if="ready" class="empty-state">
        <div class="empty-icon">✈</div>
        <h2>
          {{ trips.length ? '没有找到符合条件的旅行' : '你的旅程，从这里开始' }}
        </h2>
        <p>
          {{
            trips.length
              ? '试试其他关键词或筛选条件。'
              : '还没有保存的旅行计划，去规划你的第一次旅程吧。'
          }}
        </p>

        <NuxtLink v-if="!trips.length" to="/plan" class="empty-link"> 开始规划 → </NuxtLink>
      </section>
    </div>
  </main>
</template>

<style scoped>
.trips-page {
  min-height: 100vh;
  background: #f8faff;
  color: #102449;
}

.page-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 64px 32px 100px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 48px;
}

.eyebrow {
  color: #3478ff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
}

.page-header h1 {
  margin: 12px 0;
  font-size: clamp(34px, 5vw, 48px);
  letter-spacing: -1.5px;
}

.accent {
  color: #3478ff;
}

.page-header p {
  color: #8b98ad;
  font-size: 15px;
}

.create-button {
  padding: 14px 22px;
  border-radius: 12px;
  background: #3478ff;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.create-button:hover {
  background: #2465e5;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 32px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filters button {
  padding: 10px 16px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #8592a8;
  cursor: pointer;
}

.filters button.active {
  background: #e8efff;
  color: #3478ff;
  font-weight: 600;
}

.search-input {
  width: 270px;
  max-width: 100%;
  padding: 12px 16px;
  border: 1px solid #e7ecf4;
  border-radius: 12px;
  background: #fff;
  outline: none;
  font-size: 13px;
}

.search-input:focus {
  border-color: #3478ff;
}

.trip-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.empty-state {
  padding: 100px 20px;
  border: 1px dashed #dce5f4;
  border-radius: 24px;
  background: #fff;
  text-align: center;
}

.empty-icon {
  margin-bottom: 20px;
  color: #3478ff;
  font-size: 48px;
}

.empty-state h2 {
  font-size: 22px;
}

.empty-state p {
  color: #8b98ad;
}

.empty-link {
  display: inline-block;
  margin-top: 20px;
  color: #3478ff;
  text-decoration: none;
}

@media (max-width: 1000px) {
  .trip-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .page-container {
    padding: 32px 18px 60px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .create-button {
    width: 100%;
    text-align: center;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filters {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .filters button {
    white-space: nowrap;
  }

  .search-input {
    width: 100%;
  }

  .trip-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: 24px 14px 50px;
  }

  .page-header h1 {
    font-size: 30px;
  }

  .page-header {
    margin-bottom: 30px;
  }

  .filters button {
    padding: 9px 13px;
    font-size: 13px;
  }

  .trip-grid {
    gap: 16px;
  }

  .empty-state {
    padding: 60px 16px;
  }
}
</style>
