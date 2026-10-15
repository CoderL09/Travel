<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  trip: { type: Object, required: true },
  days: { type: Array, required: true },
  completedCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 }
});

const emit = defineEmits(['toggle-activity', 'open-activity']);

const activeDay = ref(0);
const viewMode = ref('day');

watch(
  () => props.days.length,
  (length) => {
    if (activeDay.value >= length) activeDay.value = Math.max(0, length - 1);
  }
);

const currentDay = computed(() => props.days[activeDay.value] ?? null);

const progressPercent = computed(() => {
  if (!props.totalCount) return 0;
  return Math.round((props.completedCount / props.totalCount) * 100);
});

function dateLabel(offset) {
  const start = props.trip.startDate;
  if (!start) return '';
  const d = new Date(`${start}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + offset);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
</script>

<template>
  <section class="itinerary">
    <div class="section-head">
      <div class="section-title">
        <span class="eyebrow">ITINERARY</span>
        <h2>每日行程</h2>
        <p>属于你的旅行故事</p>
      </div>

      <div v-if="totalCount" class="progress">
        <div class="progress-text">
          <span>行程进度</span>
          <strong>{{ completedCount }} / {{ totalCount }}</strong>
        </div>
        <div class="progress-bar">
          <i :style="{ width: progressPercent + '%' }"></i>
        </div>
      </div>
    </div>

    <div v-if="days.length" class="controls">
      <div class="day-tabs" role="tablist" aria-label="选择行程日期">
        <button
          v-for="(day, index) in days"
          :key="index"
          role="tab"
          :aria-selected="activeDay === index"
          :class="{ active: activeDay === index }"
          @click="activeDay = index"
        >
          <strong>第 {{ index + 1 }} 天</strong>
          <small>{{ dateLabel(index) || day.title }}</small>
        </button>
      </div>

      <div class="view-toggle">
        <button type="button" :class="{ active: viewMode === 'day' }" @click="viewMode = 'day'">
          单日
        </button>
        <button type="button" :class="{ active: viewMode === 'all' }" @click="viewMode = 'all'">
          全部
        </button>
      </div>
    </div>

    <div v-if="!days.length" class="empty">这份旅行还没有每日行程。</div>

    <template v-else-if="viewMode === 'day'">
      <div v-if="currentDay" class="day-block">
        <div class="day-heading">
          <h3>{{ currentDay.title || `第 ${activeDay + 1} 天` }}</h3>
          <span>{{ dateLabel(activeDay) }}</span>
        </div>

        <p v-if="!currentDay.activities?.length" class="empty small">这一天还没有安排活动。</p>

        <div v-else class="timeline">
          <article
            v-for="(activity, index) in currentDay.activities"
            :key="activity.id || index"
            class="activity-card"
            :class="{ done: activity.completed }"
          >
            <button
              type="button"
              class="check"
              :aria-pressed="!!activity.completed"
              @click="emit('toggle-activity', { dayIndex: activeDay, id: activity.id })"
            >
              {{ activity.completed ? '✓' : '' }}
            </button>

            <button
              type="button"
              class="activity-main"
              @click="emit('open-activity', { dayIndex: activeDay, activity })"
            >
              <div class="period-line">
                <span class="step">STEP {{ index + 1 }}</span>
                <strong>{{ activity.period }}</strong>
                <span class="time">{{ activity.time }}</span>
              </div>

              <h4>{{ activity.name }}</h4>
              <p class="desc">{{ activity.description }}</p>

              <div class="meta">
                <span v-if="activity.location">⌖ {{ activity.location }}</span>
                <span v-if="activity.duration">◷ {{ activity.duration }}</span>
                <span v-if="activity.cost">¥ {{ activity.cost }}</span>
                <span v-if="activity.transport">⇢ {{ activity.transport }}</span>
              </div>

              <div v-if="activity.tags?.length" class="tag-chips">
                <span v-for="tag in activity.tags" :key="tag">{{ tag }}</span>
              </div>
            </button>
          </article>
        </div>
      </div>
    </template>

    <template v-else>
      <div v-for="(day, dayIndex) in days" :key="dayIndex" class="day-block all">
        <div class="day-heading">
          <h3>{{ day.title || `第 ${dayIndex + 1} 天` }}</h3>
          <span>{{ dateLabel(dayIndex) }}</span>
        </div>

        <p v-if="!day.activities?.length" class="empty small">这一天还没有安排活动。</p>

        <div v-else class="timeline">
          <article
            v-for="(activity, index) in day.activities"
            :key="activity.id || index"
            class="activity-card"
            :class="{ done: activity.completed }"
          >
            <button
              type="button"
              class="check"
              :aria-pressed="!!activity.completed"
              @click="emit('toggle-activity', { dayIndex, id: activity.id })"
            >
              {{ activity.completed ? '✓' : '' }}
            </button>

            <button
              type="button"
              class="activity-main"
              @click="emit('open-activity', { dayIndex, activity })"
            >
              <div class="period-line">
                <span class="step">STEP {{ index + 1 }}</span>
                <strong>{{ activity.period }}</strong>
                <span class="time">{{ activity.time }}</span>
              </div>

              <h4>{{ activity.name }}</h4>
              <p class="desc">{{ activity.description }}</p>

              <div class="meta">
                <span v-if="activity.location">⌖ {{ activity.location }}</span>
                <span v-if="activity.duration">◷ {{ activity.duration }}</span>
                <span v-if="activity.cost">¥ {{ activity.cost }}</span>
                <span v-if="activity.transport">⇢ {{ activity.transport }}</span>
              </div>

              <div v-if="activity.tags?.length" class="tag-chips">
                <span v-for="tag in activity.tags" :key="tag">{{ tag }}</span>
              </div>
            </button>
          </article>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.itinerary {
  padding: 34px 30px;
  border: 1px solid #edf0f6;
  border-radius: 22px;
  background: #fff;
  min-width: 0;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
  flex-wrap: wrap;
}

.eyebrow {
  color: #3478ff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
}

.section-title h2 {
  margin: 8px 0 4px;
  font-size: 24px;
  letter-spacing: -0.5px;
}

.section-title p {
  margin: 0;
  color: #9ca8ba;
  font-size: 13px;
}

.progress {
  flex: 1;
  min-width: 170px;
  max-width: 260px;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  margin-bottom: 7px;
  color: #98a5ba;
  font-size: 12px;
}

.progress-text strong {
  color: #3478ff;
}

.progress-bar {
  height: 8px;
  overflow: hidden;
  border-radius: 100px;
  background: #eef2f8;
}

.progress-bar i {
  display: block;
  height: 100%;
  border-radius: 100px;
  background: linear-gradient(90deg, #3478ff, #5a8dff);
  transition: width 0.3s ease;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin: 28px 0;
  flex-wrap: wrap;
}

.day-tabs {
  display: flex;
  gap: 9px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.day-tabs button {
  min-width: 92px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 12px 10px;
  border: 0;
  border-radius: 12px;
  background: #f3f6fb;
  color: #61718d;
  cursor: pointer;
  white-space: nowrap;
}

.day-tabs button.active {
  background: #3478ff;
  color: #fff;
}

.day-tabs strong {
  font-size: 13px;
}

.day-tabs small {
  font-size: 11px;
  opacity: 0.72;
}

.view-toggle {
  display: flex;
  padding: 3px;
  border-radius: 11px;
  background: #f0f3f9;
}

.view-toggle button {
  padding: 8px 16px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #8190a8;
  font-size: 12px;
  cursor: pointer;
}

.view-toggle button.active {
  background: #fff;
  color: #3478ff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(31, 51, 88, 0.08);
}

.day-block {
  margin-bottom: 34px;
}

.day-block:last-child {
  margin-bottom: 0;
}

.day-heading {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
}

.day-heading h3 {
  margin: 0;
  font-size: 19px;
}

.day-heading span {
  color: #9ca8ba;
  font-size: 13px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.activity-card {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 14px;
  padding: 18px;
  border: 1px solid #edf0f6;
  border-radius: 16px;
  transition:
    box-shadow 0.2s,
    border-color 0.2s;
}

.activity-card:hover {
  border-color: #d9e4f8;
  box-shadow: 0 8px 22px rgba(31, 51, 88, 0.06);
}

.activity-card.done {
  opacity: 0.72;
}

.activity-card.done h4 {
  text-decoration: line-through;
}

.check {
  width: 26px;
  height: 26px;
  align-self: start;
  margin-top: 2px;
  display: grid;
  place-items: center;
  border: 2px solid #c6d2e6;
  border-radius: 8px;
  background: #fff;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s;
}

.check:hover {
  border-color: #3478ff;
}

.activity-card.done .check {
  border-color: #3478ff;
  background: #3478ff;
}

.activity-main {
  display: block;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;
  min-width: 0;
}

.period-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.step {
  padding: 3px 8px;
  border-radius: 6px;
  background: #eaf0fc;
  color: #3478ff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
}

.period-line strong {
  font-size: 13px;
  color: #334766;
}

.time {
  color: #98a5ba;
  font-size: 12px;
}

.activity-main h4 {
  margin: 0 0 8px;
  font-size: 17px;
  color: #102449;
}

.desc {
  margin: 0;
  color: #8794aa;
  font-size: 13.5px;
  line-height: 1.75;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.meta span {
  padding: 6px 10px;
  border-radius: 8px;
  background: #f3f6fb;
  color: #728099;
  font-size: 11.5px;
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 10px;
}

.tag-chips span {
  padding: 4px 10px;
  border-radius: 100px;
  background: #fff7e8;
  color: #b98a2e;
  font-size: 11px;
}

.empty {
  padding: 46px 0;
  color: #8b98ad;
  text-align: center;
  font-size: 14px;
}

.empty.small {
  padding: 28px 0;
  font-size: 13px;
}

@media (max-width: 650px) {
  .itinerary {
    padding: 24px 16px;
  }

  .section-head {
    flex-direction: column;
    align-items: stretch;
  }

  .progress {
    max-width: none;
  }

  .controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin: 22px 0;
  }

  .view-toggle {
    align-self: flex-end;
  }

  .day-tabs button {
    min-width: 80px;
    padding: 10px 8px;
  }

  .period-line {
    flex-wrap: wrap;
    gap: 6px;
  }

  .meta span {
    font-size: 10.5px;
  }

  .activity-card {
    grid-template-columns: 26px minmax(0, 1fr);
    gap: 10px;
    padding: 14px;
  }
}

@media (max-width: 480px) {
  .itinerary {
    padding: 20px 12px;
    border-radius: 16px;
  }

  .section-title h2 {
    font-size: 21px;
  }

  .day-tabs button {
    min-width: 72px;
  }

  .activity-card {
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 8px;
    padding: 12px 10px;
    border-radius: 13px;
  }

  .activity-main h4 {
    font-size: 15px;
  }

  .desc {
    font-size: 12.5px;
  }

  .day-heading h3 {
    font-size: 17px;
  }
}
</style>
