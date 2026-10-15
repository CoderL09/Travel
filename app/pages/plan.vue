<script setup>
import { ref, onMounted } from 'vue';
import { initialTrip, initialDays } from '~/data/travel-demo';
import TravelChat from '~/components/plan/TravelChat.vue';
import ItineraryPanel from '~/components/plan/ItineraryPanel.vue';
import TripSidebar from '~/components/plan/TripSidebar.vue';
import { useTrips } from '~/composables/useTrips';

const { saveTrip: saveToTrips } = useTrips();
const clone = (value) => JSON.parse(JSON.stringify(value));
const trip = ref(clone(initialTrip));
const days = ref(clone(initialDays));
const toast = ref('');
const tripEditorOpen = ref(false);
const activityEditorOpen = ref(false);
const editingActivity = ref(null);
const editingDayIndex = ref(0);
const tripDraft = ref(clone(initialTrip));
const activityDraft = ref({});

onMounted(() => {
  try {
    const saved = localStorage.getItem('nexus-travel-plan-v1');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.trip && Array.isArray(data.days)) {
        trip.value = data.trip;
        days.value = data.days;
      }
    }
  } catch (error) {
    console.warn('无法读取本地行程：', error);
  }
});
function handleGeneratedItinerary(result) {
  if (!Array.isArray(result?.days) || !result.days.length) return notify('行程数据无效');
  days.value = clone(result.days);
  if (result.trip && typeof result.trip === 'object') {
    trip.value.destination = result.trip.destination ?? trip.value.destination;
    trip.value.startDate = result.trip.startDate ?? trip.value.startDate;
    trip.value.endDate = result.trip.endDate ?? trip.value.endDate;
    trip.value.travelers = result.trip.travelers ?? trip.value.travelers;
    trip.value.budget = result.trip.budget ?? trip.value.budget;
    trip.value.preferences = Array.isArray(result.trip.preferences)
      ? clone(result.trip.preferences)
      : trip.value.preferences;
    if (result.trip.image) trip.value.image = result.trip.image;
    if (result.trip.guide) trip.value.guide = clone(result.trip.guide);
    if (result.trip.weatherHint) trip.value.weatherHint = result.trip.weatherHint;
    if (Array.isArray(result.trip.packingList))
      trip.value.packingList = clone(result.trip.packingList);
    if (result.trip.budgetPlan) trip.value.budgetPlan = clone(result.trip.budgetPlan);
    notify(
      `已同步行程：${trip.value.startDate} 至 ${trip.value.endDate} · ${days.value.length} 天 · 预算 ¥${Number(trip.value.budget).toLocaleString('zh-CN')}，记得点击保存行程`
    );
  } else {
    trip.value.destination = result.destination || trip.value.destination;
    notify('AI 行程已更新，记得点击保存行程');
  }
}
function handleTripUpdated(updated) {
  if (!updated || typeof updated !== 'object') return;
  let changed = false;
  if (typeof updated.destination === 'string' && updated.destination.trim()) {
    trip.value.destination = updated.destination;
    changed = true;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(updated.startDate || '')) {
    trip.value.startDate = updated.startDate;
    changed = true;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(updated.endDate || '')) {
    trip.value.endDate = updated.endDate;
    changed = true;
  }
  if (Number.isInteger(updated.travelers)) {
    trip.value.travelers = updated.travelers;
    changed = true;
  }
  if (Number.isFinite(updated.budget)) {
    trip.value.budget = updated.budget;
    changed = true;
  }
  if (Array.isArray(updated.preferences)) {
    trip.value.preferences = clone(updated.preferences);
    changed = true;
  }
  if (changed) notify('旅行信息已与对话同步');
}
function notify(message) {
  toast.value = message;
}
async function saveTrip() {
  try {
    localStorage.setItem(
      'nexus-travel-plan-v1',
      JSON.stringify({ trip: trip.value, days: days.value })
    );
    const savedId = await saveToTrips({
      trip: clone(trip.value),
      days: clone(days.value),
      title: `${trip.value.destination}之旅`,
      status: 'saved'
    });
    notify(`行程已保存到我的旅行（${savedId}）`);
  } catch (error) {
    console.error('保存旅行失败：', error);
    notify(error?.data?.message || '保存失败，请检查数据库连接');
  }
}
function openTripEditor() {
  tripDraft.value = clone(trip.value);
  tripEditorOpen.value = true;
}
function confirmTripEdit() {
  if (!tripDraft.value.destination.trim()) return notify('请填写目的地');
  if (tripDraft.value.endDate < tripDraft.value.startDate)
    return notify('结束日期不能早于开始日期');
  trip.value = clone(tripDraft.value);
  tripEditorOpen.value = false;
  notify('旅行信息已更新，点击保存行程可持久保存');
}
function openActivityEditor({ dayIndex, activity }) {
  editingDayIndex.value = dayIndex;
  editingActivity.value = activity.id;
  activityDraft.value = clone(activity);
  activityEditorOpen.value = true;
}
function confirmActivityEdit() {
  if (!activityDraft.value.name.trim()) return notify('请填写活动名称');
  const activities = days.value[editingDayIndex.value]?.activities;
  const index = activities?.findIndex((item) => item.id === editingActivity.value);
  if (index >= 0) activities[index] = clone(activityDraft.value);
  activityEditorOpen.value = false;
  notify('活动已更新，点击保存行程可持久保存');
}
function removeActivity({ dayIndex, id }) {
  const activities = days.value[dayIndex]?.activities;
  if (!activities) return;
  const index = activities.findIndex((item) => item.id === id);
  if (index >= 0) activities.splice(index, 1);
  notify('活动已删除，点击保存行程可持久保存');
}
</script>

<template>
  <div class="travel-page">
    <header class="site-header">
      <NuxtLink class="brand" to="/"><span class="brand-mark">◆</span> Nexus Travel AI</NuxtLink>
      <nav aria-label="主导航">
        <NuxtLink to="/">首页</NuxtLink><NuxtLink to="/plan" class="current">AI 行程规划</NuxtLink
        ><NuxtLink to="/trips">我的旅行</NuxtLink>
      </nav>
      <div class="header-right">✦ <span>探索更多可能</span></div>
    </header>

    <section class="hero" aria-label="旅行灵感">
      <div class="hero-copy">
        <span>JAPAN · 旅行灵感</span>
        <h1>探索世界，<br />开启下一段旅程。</h1>
        <p>用 AI 规划更轻松、更个性化的旅行。</p>
      </div>
    </section>

    <main class="workspace">
      <TravelChat
        :trip="trip"
        @itinerary-generated="handleGeneratedItinerary"
        @trip-updated="handleTripUpdated"
      />
      <ItineraryPanel
        :trip="trip"
        :days="days"
        @save="saveTrip"
        @edit-activity="openActivityEditor"
        @remove-activity="removeActivity"
      />
      <TripSidebar :trip="trip" @edit-trip="openTripEditor" />
    </main>

    <div v-if="toast" class="toast" role="status">
      {{ toast }} <button aria-label="关闭提示" @click="toast = ''">×</button>
    </div>

    <div v-if="tripEditorOpen" class="modal-backdrop" @click.self="tripEditorOpen = false">
      <form class="modal" @submit.prevent="confirmTripEdit">
        <h2>编辑旅行信息</h2>
        <label>目的地<input v-model="tripDraft.destination" required /></label>
        <div class="field-row">
          <label>开始日期<input v-model="tripDraft.startDate" type="date" required /></label
          ><label>结束日期<input v-model="tripDraft.endDate" type="date" required /></label>
        </div>
        <div class="field-row">
          <label
            >出行人数<input
              v-model.number="tripDraft.travelers"
              type="number"
              min="1"
              required /></label
          ><label
            >预算（元）<input v-model.number="tripDraft.budget" type="number" min="0" required
          /></label>
        </div>
        <label
          >旅行偏好（用逗号分隔）<input
            :value="tripDraft.preferences.join('，')"
            @input="
              tripDraft.preferences = $event.target.value
                .split(/[,，]/)
                .map((s) => s.trim())
                .filter(Boolean)
            "
        /></label>
        <div class="modal-actions">
          <button type="button" @click="tripEditorOpen = false">取消</button
          ><button type="submit" class="primary">确认修改</button>
        </div>
      </form>
    </div>

    <div v-if="activityEditorOpen" class="modal-backdrop" @click.self="activityEditorOpen = false">
      <form class="modal" @submit.prevent="confirmActivityEdit">
        <h2>编辑行程活动</h2>
        <label>活动名称<input v-model="activityDraft.name" required /></label>
        <div class="field-row">
          <label
            >时间段<select v-model="activityDraft.period">
              <option>上午</option>
              <option>下午</option>
              <option>晚上</option>
            </select></label
          ><label>时间<input v-model="activityDraft.time" /></label>
        </div>
        <label>地点<input v-model="activityDraft.location" /></label>
        <label>建议停留<input v-model="activityDraft.duration" /></label>
        <label>活动介绍<textarea v-model="activityDraft.description" rows="3"></textarea></label>
        <div class="modal-actions">
          <button type="button" @click="activityEditorOpen = false">取消</button
          ><button type="submit" class="primary">确认修改</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.travel-page {
  min-height: 100vh;
  background: #f7f9fd;
  color: #182b49;
  font-family: Inter, 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
}
.site-header {
  height: 72px;
  padding: 0 clamp(20px, 4vw, 65px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  background: #fff;
}
.brand {
  color: #162743;
  text-decoration: none;
  font-weight: 800;
  font-size: 19px;
  white-space: nowrap;
}
.brand-mark {
  color: #3678ff;
  font-size: 23px;
  margin-right: 7px;
}
nav {
  display: flex;
  gap: 9px;
}
nav a {
  color: #55647c;
  text-decoration: none;
  padding: 12px 19px;
  border-radius: 999px;
  font-size: 14px;
  white-space: nowrap;
}
nav a.current {
  color: #2369ec;
  background: #eff5ff;
  font-weight: 700;
}
.header-right {
  font-size: 12px;
  color: #7e90ad;
  white-space: nowrap;
}
.hero {
  height: 220px;
  position: relative;
  background-image:
    linear-gradient(
      90deg,
      rgba(244, 249, 255, 0.92),
      rgba(244, 249, 255, 0.55) 37%,
      rgba(255, 255, 255, 0) 78%
    ),
    url('/images/4.jpg');
  background-position: center 45%;
  background-size: cover;
}
.hero-copy {
  position: absolute;
  top: 30px;
  left: clamp(24px, 5vw, 75px);
}
.hero-copy span {
  font-size: 12px;
  letter-spacing: 3px;
  font-weight: 700;
}
.hero-copy h1 {
  font-size: clamp(30px, 3.1vw, 48px);
  letter-spacing: -1px;
  line-height: 1.25;
  margin: 19px 0 12px;
}
.hero-copy p {
  font-size: 15px;
  color: #65748b;
}
.workspace {
  max-width: 1780px;
  margin: 24px auto 0;
  padding: 0 20px 35px;
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(440px, 1.45fr) minmax(250px, 0.77fr);
  gap: 16px;
  align-items: stretch;
}
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: #1c355a;
  color: white;
  padding: 12px 17px;
  border-radius: 12px;
  box-shadow: 0 10px 25px #20334c35;
  font-size: 13px;
}
.toast button {
  background: none;
  border: 0;
  color: white;
  font-size: 20px;
  margin-left: 12px;
  cursor: pointer;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: #0e203b80;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 15px;
}
.modal {
  background: #fff;
  border-radius: 20px;
  width: min(480px, 100%);
  padding: 27px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  box-shadow: 0 20px 80px #101e3530;
}
.modal h2 {
  font-size: 20px;
  margin: 0 0 4px;
}
.modal label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: #66758b;
  font-size: 12px;
  flex: 1;
}
.modal input,
.modal textarea,
.modal select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dfe6f0;
  border-radius: 10px;
  padding: 11px;
  font: inherit;
  font-size: 13px;
  color: #22314c;
}
.field-row {
  display: flex;
  gap: 10px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 7px;
}
.modal-actions button {
  border: 0;
  border-radius: 10px;
  padding: 11px 18px;
  cursor: pointer;
  background: #f1f4f9;
  color: #42536b;
}
.modal-actions .primary {
  background: #3678ff;
  color: white;
}
@media (max-width: 1250px) {
  .workspace {
    grid-template-columns: minmax(280px, 0.85fr) minmax(430px, 1.25fr);
  }
  .workspace > :last-child {
    grid-column: 1/-1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
}
@media (max-width: 1100px) {
  .site-header {
    padding: 0 22px;
  }
  .header-right {
    display: none;
  }
  nav a {
    padding: 11px 14px;
  }
}
@media (max-width: 800px) {
  .site-header {
    padding: 0 16px;
  }
  .header-right {
    display: none;
  }
  .brand {
    font-size: 15px;
  }
  nav a {
    padding: 9px;
    font-size: 12px;
  }
  .workspace {
    display: flex;
    flex-direction: column;
    padding: 0 12px 25px;
  }
  .workspace > :last-child {
    display: flex;
  }
  .hero {
    height: 250px;
  }
  .hero-copy {
    top: 36px;
  }
  .hero-copy p {
    max-width: 240px;
  }
  .field-row {
    flex-direction: column;
  }
}
@media (max-width: 480px) {
  .site-header {
    height: 60px;
    gap: 8px;
  }
  .brand {
    font-size: 14px;
  }
  .brand-mark {
    font-size: 18px;
  }
  nav a {
    padding: 7px;
    font-size: 11px;
  }
  .hero {
    height: 200px;
    background-position: center 40%;
  }
  .hero-copy {
    top: 24px;
  }
  .hero-copy h1 {
    font-size: 26px;
    margin: 12px 0 8px;
  }
  .hero-copy p {
    font-size: 13px;
  }
  .workspace {
    padding: 0 8px 20px;
  }
  .toast {
    width: calc(100% - 32px);
    text-align: center;
    font-size: 12px;
    line-height: 1.6;
  }
  .modal {
    padding: 20px 16px;
  }
  .modal h2 {
    font-size: 17px;
  }
}
</style>
