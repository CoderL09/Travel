<script setup>
defineProps({
  stats: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <section class="stats-bar">
    <div class="stat">
      <strong>{{ stats.days }}</strong>
      <span>旅行天数</span>
    </div>
    <div class="stat">
      <strong>{{ stats.activities }}</strong>
      <span>行程活动</span>
    </div>
    <div class="stat">
      <strong>{{ stats.travelers }}</strong>
      <span>出行人数</span>
    </div>
    <div v-if="stats.budget" class="stat">
      <strong>¥{{ stats.budgetText }}</strong>
      <span>总预算</span>
    </div>
    <div v-if="stats.budget" class="stat">
      <strong>¥{{ stats.perPersonText }}</strong>
      <span>人均预算</span>
    </div>
    <div v-if="stats.preferences?.length" class="prefs">
      <span v-for="pref in stats.preferences" :key="pref">{{ pref }}</span>
    </div>
  </section>
</template>

<style scoped>
.stats-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  padding: 22px 28px;
  border: 1px solid #edf0f6;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(31, 51, 88, .04);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-right: 22px;
  border-right: 1px solid #edf0f6;
}

.stat strong {
  color: #102449;
  font-size: 21px;
  letter-spacing: -.5px;
}

.stat span {
  color: #98a5ba;
  font-size: 12px;
}

.prefs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}

.prefs span {
  padding: 7px 12px;
  border-radius: 100px;
  background: #eaf0fc;
  color: #5874a5;
  font-size: 12px;
}

@media (max-width: 650px) {
  .stats-bar {
    gap: 12px;
    padding: 16px 18px;
    border-radius: 16px;
  }

  .stat {
    padding-right: 12px;
  }

  .stat strong {
    font-size: 18px;
  }

  .prefs {
    margin-left: 0;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .stat {
    padding-right: 0;
    border-right: 0;
  }
}
</style>
