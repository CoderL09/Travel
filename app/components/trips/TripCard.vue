<script setup>
import { computed } from 'vue';

const props = defineProps({
  record: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['delete']);

const trip = computed(() => props.record.trip || {});

const destination = computed(() => trip.value.destination || '未命名目的地');

const dateText = computed(() => {
  const start = trip.value.startDate;
  const end = trip.value.endDate;

  if (!start) return '日期待定';
  return `${start} — ${end || start}`;
});

const dayCount = computed(() => {
  const start = trip.value.startDate;
  const end = trip.value.endDate;

  if (!start || !end) {
    return props.record.days?.length || 0;
  }

  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return props.record.days?.length || 0;
  }

  return Math.max(1, Math.round((b - a) / 86400000) + 1);
});

const status = computed(() => {
  const start = trip.value.startDate;
  const end = trip.value.endDate;

  if (!start || !end) return '草稿';

  const today = new Date();
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  if (localToday < start) return '即将出发';
  if (localToday > end) return '已结束';
  return '旅行中';
});

const statusClass = computed(
  () =>
    ({
      即将出发: 'upcoming',
      旅行中: 'ongoing',
      已结束: 'finished',
      草稿: 'draft'
    })[status.value]
);
</script>

<template>
  <article class="trip-card">
    <div class="card-top">
      <span class="eyebrow">NEXUS JOURNEY</span>
      <span class="status" :class="statusClass">
        {{ status }}
      </span>

      <div class="destination">
        <span class="location-icon">✦</span>
        <h2>{{ destination }}</h2>
      </div>

      <p class="card-subtitle">
        {{ record.title || '我的专属旅行计划' }}
      </p>

      <div class="decorative-circle"></div>
    </div>

    <div class="card-body">
      <p class="date">{{ dateText }}</p>

      <div class="meta">
        <span>{{ dayCount }} 天</span>
        <span>{{ trip.travelers || 1 }} 人</span>
        <span v-if="trip.budget"> 预算 ¥{{ Number(trip.budget).toLocaleString() }} </span>
      </div>

      <div class="card-footer">
        <NuxtLink class="detail-link" :to="`/trips/${record.id}`">
          查看行程 <span>↗</span>
        </NuxtLink>

        <button type="button" class="delete-button" @click="emit('delete', record.id)">删除</button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.trip-card {
  overflow: hidden;
  border: 1px solid #e9edf5;
  border-radius: 22px;
  background: #fff;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.trip-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(29, 53, 87, 0.08);
}

.card-top {
  position: relative;
  min-height: 205px;
  overflow: hidden;
  padding: 24px;
  background: linear-gradient(135deg, #e7efff 0%, #d8e6ff 55%, #e9e6ff 100%);
}

.eyebrow {
  position: relative;
  z-index: 1;
  color: #4776c6;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
}

.status {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1;
  padding: 7px 12px;
  border-radius: 100px;
  background: #fff;
  color: #4d6b9a;
  font-size: 12px;
}

.status.ongoing {
  color: #15803d;
}
.status.finished {
  color: #64748b;
}
.status.draft {
  color: #b45309;
}

.destination {
  position: relative;
  z-index: 1;
  margin-top: 48px;
}

.location-icon {
  color: #3478ff;
  font-size: 24px;
}

.destination h2 {
  margin: 8px 0;
  color: #102449;
  font-size: 27px;
  font-weight: 700;
}

.card-subtitle {
  position: relative;
  z-index: 1;
  color: #6680a8;
  font-size: 13px;
}

.decorative-circle {
  position: absolute;
  right: -55px;
  bottom: -95px;
  width: 250px;
  height: 250px;
  border: 45px solid rgba(255, 255, 255, 0.35);
  border-radius: 50%;
}

.card-body {
  padding: 22px 24px;
}

.date {
  margin: 0 0 16px;
  color: #334766;
  font-size: 14px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta span {
  padding: 6px 10px;
  border-radius: 8px;
  background: #f4f6fa;
  color: #728099;
  font-size: 12px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
}

.detail-link {
  color: #3478ff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.delete-button {
  border: 0;
  background: transparent;
  color: #9ca8ba;
  cursor: pointer;
}

.delete-button:hover {
  color: #e05252;
}

@media (max-width: 480px) {
  .trip-card {
    border-radius: 18px;
  }

  .card-top {
    min-height: 168px;
    padding: 18px;
  }

  .status {
    top: 16px;
    right: 16px;
    padding: 6px 10px;
    font-size: 11px;
  }

  .destination {
    margin-top: 36px;
  }

  .destination h2 {
    font-size: 22px;
  }

  .card-body {
    padding: 16px 18px;
  }

  .date {
    margin: 0 0 12px;
    font-size: 13px;
  }

  .meta span {
    font-size: 11px;
  }

  .card-footer {
    margin-top: 18px;
  }
}
</style>
