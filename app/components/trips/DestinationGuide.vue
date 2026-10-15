<script setup>
import { computed } from 'vue'

const props = defineProps({
  guide: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

const emit = defineEmits(['generate'])

const sections = [
  { key: 'overview', label: '城市速览', icon: '✦' },
  { key: 'food', label: '美食推荐', icon: '♨' },
  { key: 'transport', label: '交通指南', icon: '⇢' },
  { key: 'culture', label: '文化礼仪', icon: '◈' },
  { key: 'tips', label: '避坑提示', icon: '◉' }
]

const guideSections = computed(() => {
  if (!props.guide || typeof props.guide !== 'object') return []
  return sections.filter(section => typeof props.guide[section.key] === 'string' && props.guide[section.key].trim())
})

const dayPlans = computed(() => {
  if (!props.guide || !Array.isArray(props.guide.dayPlans)) return []
  return props.guide.dayPlans.filter(item => item && typeof item.plan === 'string' && item.plan.trim())
})
</script>

<template>
  <section class="guide">
    <div class="section-title">
      <span class="eyebrow">DESTINATION GUIDE</span>
      <h2>目的地攻略</h2>
      <p>AI 为你整理的出发前实用指南</p>
    </div>

    <div v-if="dayPlans.length" class="day-plans">
      <div class="card-head">
        <span class="icon">➤</span>
        <h3>每日行程详解</h3>
      </div>
      <article v-for="plan in dayPlans" :key="plan.day" class="day-plan">
        <div class="day-plan-head">
          <strong>第 {{ plan.day }} 天</strong>
          <span>{{ plan.title }}</span>
        </div>
        <p>{{ plan.plan }}</p>
      </article>
    </div>

    <div v-if="guideSections.length" class="guide-grid">
      <article
        v-for="(section, index) in guideSections"
        :key="section.key"
        class="guide-card"
        :class="{ featured: index === 0 }"
      >
        <div class="card-head">
          <span class="icon">{{ section.icon }}</span>
          <h3>{{ section.label }}</h3>
        </div>
        <p>{{ guide[section.key] }}</p>
      </article>
    </div>

    <div v-if="!guideSections.length && !dayPlans.length" class="guide-empty">
      <div class="empty-icon">✈</div>
      <h3>还没有这份旅行的目的地攻略</h3>
      <p>让 AI 为你生成城市速览、美食、交通、文化礼仪和避坑提示。</p>
      <p v-if="error" class="guide-error">{{ error }}</p>
      <button type="button" class="generate" :disabled="loading" @click="emit('generate')">
        {{ loading ? 'AI 正在撰写攻略…' : '✦ 生成 AI 目的地攻略' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.guide {
  padding: 34px 30px;
  border: 1px solid #edf0f6;
  border-radius: 22px;
  background: #fff;
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
  letter-spacing: -.5px;
}

.section-title p {
  margin: 0 0 26px;
  color: #9ca8ba;
  font-size: 13px;
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.guide-card {
  padding: 20px 22px;
  border-radius: 16px;
  background: #f7f9fd;
  border: 1px solid #eef1f7;
}

.guide-card.featured {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, #eef4ff, #f5f8ff);
  border-color: #dce8fc;
}

.day-plans {
  padding: 22px 24px;
  margin-bottom: 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eef4ff, #f7faff);
  border: 1px solid #dce8fc;
}

.day-plan {
  padding: 16px 0;
  border-top: 1px solid #dfe8f8;
}

.day-plan:first-of-type {
  border-top: 0;
  padding-top: 6px;
}

.day-plan-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
}

.day-plan-head strong {
  color: #2f6ff2;
  font-size: 14px;
  white-space: nowrap;
}

.day-plan-head span {
  color: #334766;
  font-size: 14px;
  font-weight: 600;
}

.day-plan p {
  margin: 0;
  color: #5f7089;
  font-size: 13px;
  line-height: 1.9;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: #e4edfd;
  color: #3478ff;
  font-size: 13px;
}

.card-head h3 {
  margin: 0;
  color: #334766;
  font-size: 15px;
}

.guide-card p {
  margin: 0;
  color: #6b7a92;
  font-size: 13px;
  line-height: 1.85;
}

.guide-empty {
  padding: 44px 20px 50px;
  border: 1px dashed #dce5f4;
  border-radius: 16px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 16px;
  color: #3478ff;
  font-size: 40px;
}

.guide-empty h3 {
  margin: 0 0 10px;
  color: #334766;
  font-size: 17px;
}

.guide-empty p {
  margin: 0 auto 22px;
  max-width: 360px;
  color: #98a5ba;
  font-size: 13px;
  line-height: 1.7;
}

.guide-error {
  color: #d0565e !important;
}

.generate {
  padding: 13px 26px;
  border: 0;
  border-radius: 12px;
  background: #3478ff;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.generate:disabled {
  opacity: .65;
  cursor: wait;
}

@media (max-width: 650px) {
  .guide {
    padding: 24px 16px;
  }

  .guide-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .guide {
    padding: 20px 14px;
    border-radius: 16px;
  }

  .section-title h2 {
    font-size: 21px;
  }

  .day-plans {
    padding: 16px 14px;
    margin-bottom: 14px;
  }

  .day-plan-head {
    flex-direction: column;
    gap: 4px;
  }

  .day-plan p {
    font-size: 12.5px;
    line-height: 1.8;
  }

  .guide-card {
    padding: 16px;
  }
}
</style>
