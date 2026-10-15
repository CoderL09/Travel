<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  trip: { type: Object, required: true },
  status: { type: String, required: true },
  countdown: { type: Object, default: null },
  dayCount: { type: Number, default: 0 }
})

const heroImage = computed(() => props.trip.image || '/images/4.jpg')

const statusClass = computed(() => ({
  '即将出发': 'upcoming',
  '旅行中': 'ongoing',
  '已结束': 'finished',
  '草稿': 'draft'
}[props.status] || ''))

function formatDate(date) {
  if (!date) return '待定'
  return String(date).replaceAll('-', '.')
}
</script>

<template>
  <header
    class="detail-hero"
    :style="{
      backgroundImage: `linear-gradient(180deg, rgba(9,20,40,.62), rgba(9,20,40,.28) 45%, rgba(9,20,40,.72)), url('${heroImage}')`
    }"
  >
    <div class="hero-inner">
      <NuxtLink to="/trips" class="back-link">← 返回我的旅行</NuxtLink>

      <div class="hero-row">
        <span class="eyebrow">MY JOURNEY</span>
        <span class="status" :class="statusClass">{{ status }}</span>
      </div>

      <h1>{{ title }}</h1>

      <p class="hero-sub">
        {{ trip.destination }} ·
        {{ formatDate(trip.startDate) }} — {{ formatDate(trip.endDate) }} ·
        {{ dayCount }} 天
      </p>

      <div class="hero-chips">
        <span v-if="countdown" class="countdown">✈ {{ countdown.label }}</span>
        <span>{{ trip.travelers || 1 }} 人同行</span>
        <span v-if="trip.budget">
          预算 ¥{{ Number(trip.budget).toLocaleString() }}
        </span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.detail-hero {
  position: relative;
  min-height: 420px;
  background-position: center 40%;
  background-size: cover;
  color: #fff;
}

.hero-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 130px 24px 60px;
}

.back-link {
  display: inline-block;
  margin-bottom: 34px;
  color: rgba(255, 255, 255, .82);
  font-size: 14px;
  text-decoration: none;
  transition: color .2s;
}

.back-link:hover {
  color: #fff;
}

.hero-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #9fc0ff;
}

.status {
  padding: 6px 13px;
  border-radius: 100px;
  background: rgba(255, 255, 255, .16);
  backdrop-filter: blur(4px);
  font-size: 12px;
  letter-spacing: 1px;
}

.status.upcoming { color: #ffd27a; }
.status.ongoing { color: #7ee2a8; }
.status.finished { color: #cdd7e6; }
.status.draft { color: #ffc6a0; }

h1 {
  margin: 18px 0 12px;
  font-size: clamp(32px, 5vw, 50px);
  letter-spacing: -1px;
  text-shadow: 0 2px 18px rgba(0, 0, 0, .3);
}

.hero-sub {
  margin: 0;
  color: rgba(255, 255, 255, .85);
  font-size: 15px;
}

.hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
}

.hero-chips span {
  padding: 9px 15px;
  border-radius: 11px;
  background: rgba(255, 255, 255, .14);
  backdrop-filter: blur(4px);
  font-size: 13px;
}

.hero-chips .countdown {
  background: rgba(52, 120, 255, .9);
}

@media (max-width: 650px) {
  .detail-hero {
    min-height: 360px;
  }

  .hero-inner {
    padding: 110px 18px 44px;
  }
}

@media (max-width: 480px) {
  .detail-hero {
    min-height: 320px;
  }

  .hero-inner {
    padding: 92px 16px 32px;
  }

  .back-link {
    margin-bottom: 24px;
    font-size: 13px;
  }

  .hero-sub {
    font-size: 13px;
    line-height: 1.7;
  }

  .hero-chips {
    gap: 8px;
    margin-top: 20px;
  }

  .hero-chips span {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>
