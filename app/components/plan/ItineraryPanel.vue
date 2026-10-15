<script setup>
import { computed, ref, watch } from 'vue'
const props = defineProps({ trip: { type: Object, required: true }, days: { type: Array, required: true } })
const emit = defineEmits(['edit-activity', 'remove-activity', 'save'])
const activeDay = ref(0)
watch(() => props.days.length, (length) => {
  if (activeDay.value >= length) activeDay.value = Math.max(0, length - 1)
})
const selected = computed(() => props.days[activeDay.value] ?? { title: '', activities: [] })
const dateLabel = (offset) => {
  const d = new Date(`${props.trip.startDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  d.setDate(d.getDate() + offset)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
const menuId = ref(null)
</script>

<template>
  <section class="itinerary panel">
    <header class="topline">
      <div><h2>{{ trip.destination }}</h2><p>{{ trip.startDate }} — {{ trip.endDate }} · {{ days.length }} 天</p></div>
      <button class="save-button" @click="emit('save')">♡ 保存行程</button>
    </header>
    <div class="day-tabs" role="tablist" aria-label="选择行程日期">
      <button v-for="(day, index) in days" :key="index" role="tab" :aria-selected="activeDay === index" :class="{ active: activeDay === index }" @click="activeDay = index; menuId = null">
        <strong>第 {{ index + 1 }} 天</strong><small>{{ dateLabel(index) }}</small>
      </button>
    </div>
    <div class="day-intro"><span class="eyebrow">每日行程</span><h3>{{ selected.title }}</h3></div>
    <div v-if="!selected.activities.length" class="empty">当天还没有活动，可以从其他天调整或稍后添加。</div>
    <div v-else class="timeline">
      <article v-for="activity in selected.activities" :key="activity.id" class="activity">
        <div class="period"><span class="dot"></span><strong>{{ activity.period }}</strong><small>{{ activity.time }}</small></div>
        <div class="activity-info"><h4>{{ activity.name }}</h4><p>{{ activity.description }}</p><div class="meta"><span>⌖ {{ activity.location }}</span><span>◷ {{ activity.duration }}</span></div></div>
        <div class="more"><button :aria-label="`操作 ${activity.name}`" @click="menuId = menuId === activity.id ? null : activity.id">···</button>
          <div v-if="menuId === activity.id" class="dropdown"><button @click="emit('edit-activity', { dayIndex: activeDay, activity }); menuId = null">编辑活动</button><button @click="emit('remove-activity', { dayIndex: activeDay, id: activity.id }); menuId = null">删除活动</button></div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.panel{background:#fff;border:1px solid #edf0f6;border-radius:22px;box-shadow:0 12px 40px rgba(31,51,88,.035)}
.itinerary{padding:25px 24px;min-height:680px;min-width:0}.topline{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
h2{font-size:25px;letter-spacing:-.5px;margin:0 0 7px}p{margin:0}.topline p{color:#8995aa;font-size:13px}.save-button{border:0;background:#f3f6fb;padding:11px 14px;border-radius:13px;cursor:pointer;color:#36506f;white-space:nowrap}
.day-tabs{display:flex;gap:9px;overflow-x:auto;margin:27px 0 28px;padding-bottom:4px}.day-tabs button{min-width:83px;flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;background:#f5f7fb;border:0;border-radius:12px;padding:13px 8px;cursor:pointer;color:#22314c}
.day-tabs button.active{background:#3678ff;color:white}.day-tabs strong{font-size:13px}.day-tabs small{font-size:11px;opacity:.7}
.day-intro{margin-bottom:19px}.eyebrow{font-size:11px;color:#4b80ed;font-weight:700;letter-spacing:2px}.day-intro h3{font-size:19px;margin:7px 0 0}
.timeline{display:flex;flex-direction:column;gap:13px}.activity{display:grid;grid-template-columns:86px minmax(0,1fr) 25px;align-items:center;gap:13px;padding:12px 0;border-bottom:1px solid #f0f2f7;min-width:0}.activity:last-child{border-bottom:0}
.period{position:relative;display:flex;flex-direction:column;gap:8px;padding-left:16px}.dot{position:absolute;left:0;top:4px;width:9px;height:9px;border:3px solid #3c7aff;border-radius:50%}.period strong{font-size:13px}.period small{font-size:11px;color:#8995aa;line-height:1.5}
.activity-info{min-width:0}.activity-info h4{font-size:15px;margin:0 0 7px}.activity-info p{font-size:12px;color:#7b879a;line-height:1.65;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.meta span{background:#f5f7fb;border-radius:8px;color:#728098;font-size:11px;padding:5px 7px}
.more{align-self:start;position:relative}.more>button{background:none;border:0;color:#4b80ed;font-size:22px;cursor:pointer}.dropdown{position:absolute;right:0;top:27px;z-index:2;width:110px;background:#fff;box-shadow:0 7px 25px #243b6226;border:1px solid #edf0f6;border-radius:10px;padding:5px}.dropdown button{display:block;width:100%;border:0;background:none;text-align:left;padding:8px;cursor:pointer;font-size:12px}.dropdown button:hover{background:#f2f6ff}.empty{padding:30px;color:#8792a4;text-align:center;font-size:13px}
@media(max-width:1200px){.activity{grid-template-columns:72px minmax(0,1fr) 25px;gap:10px}}
@media(max-width:600px){.itinerary{padding:18px 14px;min-height:auto;border-radius:16px}.topline{flex-direction:column;gap:10px}.save-button{width:100%}h2{font-size:21px}.day-tabs{margin:20px 0}.day-tabs button{min-width:70px;padding:10px 6px}.day-intro h3{font-size:16px}.activity{grid-template-columns:64px minmax(0,1fr) 20px;gap:8px;align-items:start}.activity-info p{display:none}.meta span{font-size:10px}.period strong{font-size:12px}.period small{font-size:10px}}
</style>
