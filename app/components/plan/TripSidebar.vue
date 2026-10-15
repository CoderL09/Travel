<script setup>
const props = defineProps({ trip: { type: Object, required: true } })
const emit = defineEmits(['edit-trip'])
</script>

<template>
  <aside class="sidebar">
    <div class="destination-image" :style="{ backgroundImage: `linear-gradient(180deg, transparent 25%, rgba(9, 22, 45, .76)), url('${trip.image}')` }">
      <div class="image-text"><span>目的地精选</span><h2>{{ trip.destination }}</h2><p>让每一段旅程，都成为独特的回忆。</p></div>
    </div>
    <section class="summary panel">
      <div class="summary-heading"><h3>旅行概览</h3><button @click="emit('edit-trip')">✎ 编辑</button></div>
      <dl>
        <div><dt>▦ <span>旅行日期</span></dt><dd>{{ trip.startDate }}<br />至 {{ trip.endDate }}</dd></div>
        <div><dt>♧ <span>出行人数</span></dt><dd>{{ trip.travelers }} 人</dd></div>
        <div><dt>▣ <span>旅行预算</span></dt><dd>¥ {{ Number(trip.budget).toLocaleString('zh-CN') }}</dd></div>
        <div><dt>◇ <span>旅行偏好</span></dt><dd><span v-for="tag in trip.preferences" :key="tag" class="tag">{{ tag }}</span></dd></div>
      </dl>
    </section>
  </aside>
</template>

<style scoped>
.sidebar{display:flex;flex-direction:column;gap:18px;min-width:0}.destination-image{height:270px;background-size:cover;background-position:center;border-radius:22px;position:relative;overflow:hidden}.image-text{position:absolute;bottom:20px;left:22px;right:18px;color:white}.image-text span{font-size:11px;letter-spacing:2px;opacity:.8}.image-text h2{margin:7px 0;font-size:25px}.image-text p{margin:0;font-size:12px;opacity:.85}
.panel{background:#fff;border:1px solid #edf0f6;border-radius:22px;box-shadow:0 12px 40px rgba(31,51,88,.035)}.summary{padding:22px}.summary-heading{display:flex;justify-content:space-between;align-items:center;gap:10px}.summary-heading h3{font-size:17px;margin:0}.summary-heading button{border:0;background:#f5f7fb;color:#526584;border-radius:10px;padding:9px 12px;cursor:pointer}
dl{margin:20px 0 0}dl>div{padding:15px 0;border-bottom:1px solid #f1f3f8}dl>div:last-child{border:0}dt{color:#4277ec;font-size:17px;display:flex;gap:9px;align-items:center}dt span{font-size:12px;color:#8792a4}dd{margin:7px 0 0 27px;color:#25344f;font-size:13px;line-height:1.7}.tag{display:inline-block;margin:2px 4px 2px 0;padding:4px 8px;border-radius:7px;background:#f2f6ff;color:#4d78c6;font-size:11px}
@media(max-width:600px){.destination-image{height:200px;border-radius:16px}.image-text h2{font-size:21px}.summary{padding:18px 16px;border-radius:16px}.summary-heading h3{font-size:15px}}
</style>
