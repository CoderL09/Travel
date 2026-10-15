
<script setup>
import { ref, computed } from 'vue'

// 当前显示的年月
const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

// 开始日期、结束日期
const startDate = ref(null)
const endDate = ref(null)

// 生成当前月份的日历
const calendarDays = computed(() => {
  const firstDay = new Date(
    currentYear.value,
    currentMonth.value,
    1
  ).getDay()

  const totalDays = new Date(
    currentYear.value,
    currentMonth.value + 1,
    0
  ).getDate()

  const emptyDays = Array(firstDay).fill(null)

  const days = Array.from(
    { length: totalDays },
    (_, index) => index + 1
  )

  return [...emptyDays, ...days]
})

// 上一个月
function previousMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

// 下一个月
function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

// 点击日期
function selectDate(day) {
  if (day === null) return

  const clickedDate = new Date(
    currentYear.value,
    currentMonth.value,
    day
  )

  if (!startDate.value) {
    // 第一次点击：选择开始日期
    startDate.value = clickedDate
  } else if (!endDate.value) {
    // 第二次点击：选择结束日期
    if (clickedDate < startDate.value) {
      // 如果结束日期更早，交换日期
      endDate.value = startDate.value
      startDate.value = clickedDate
    } else {
      endDate.value = clickedDate
    }
  } else {
    // 第三次点击：重新开始选择
    startDate.value = clickedDate
    endDate.value = null
  }
}

// 判断是否为开始日期
function isStartDate(day) {
  if (day === null || !startDate.value) {
    return false
  }

  return (
    currentYear.value === startDate.value.getFullYear() &&
    currentMonth.value === startDate.value.getMonth() &&
    day === startDate.value.getDate()
  )
}

// 判断是否为结束日期
function isEndDate(day) {
  if (day === null || !endDate.value) {
    return false
  }

  return (
    currentYear.value === endDate.value.getFullYear() &&
    currentMonth.value === endDate.value.getMonth() &&
    day === endDate.value.getDate()
  )
}

// 判断是否在开始日期和结束日期之间
// 不包含开始日期和结束日期本身
function isInRange(day) {
  if (
    day === null ||
    !startDate.value ||
    !endDate.value
  ) {
    return false
  }

  const date = new Date(
    currentYear.value,
    currentMonth.value,
    day
  )

  return (
    date > startDate.value &&
    date < endDate.value
  )
}
</script>

<template>
  <div class="travel-calendar">
    <!-- 标题 -->
    <div class="calendar-header">
      <h3>旅行日期</h3>
    </div>

    <!-- 月份切换 -->
    <div class="month-navigation">
      <button
        type="button"
        class="nav-button"
        @click="previousMonth"
      >
        ‹
      </button>

      <span class="month-title">
        {{ currentYear }} 年 {{ currentMonth + 1 }} 月
      </span>

      <button
        type="button"
        class="nav-button"
        @click="nextMonth"
      >
        ›
      </button>
    </div>

    <!-- 星期 -->
    <div class="calendar-weekdays">
      <span>日</span>
      <span>一</span>
      <span>二</span>
      <span>三</span>
      <span>四</span>
      <span>五</span>
      <span>六</span>
    </div>

    <!-- 日期 -->
    <div class="calendar-days">
      <button
        v-for="(day, index) in calendarDays"
        :key="index"
        type="button"
        class="day-button"
        :disabled="day === null"
        :class="{
          'in-range': isInRange(day),
          'range-start': isStartDate(day),
          'range-end': isEndDate(day)
        }"
        @click="selectDate(day)"
      >
        {{ day }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 日历容器 */
.travel-calendar {
  width: 100%;
  padding: 24px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-sizing: border-box;
}

/* 标题区域 */
.calendar-header {
  margin-bottom: 20px;
}

.calendar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

/* 月份切换 */
.month-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.month-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background-color: transparent;
  color: #374151;
  font-size: 24px;
  cursor: pointer;
}

.nav-button:hover {
  background-color: #f3f4f6;
}

/* 星期标题 */
.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin-bottom: 8px;
  text-align: center;
}

.calendar-weekdays span {
  padding: 8px 0;
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
}

/* 日期网格 */
.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0;
}

/* 日期按钮 */
.day-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 0;
  background-color: transparent;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
}

/* 鼠标悬停 */
.day-button:hover:not(:disabled):not(.range-start):not(.range-end) {
  background-color: #f3f4f6;
}

/* 禁用的空白日期 */
.day-button:disabled {
  cursor: default;
}

/* 中间日期：浅紫色 */
.day-button.in-range {
  background-color: #ede9fe;
  color: #5b21b6;
}

/* 开始日期：深紫色 */
.day-button.range-start {
  background-color: #7c3aed;
  color: #ffffff;
  border-radius: 8px 0 0 8px;
}

/* 结束日期：深紫色 */
.day-button.range-end {
  background-color: #7c3aed;
  color: #ffffff;
  border-radius: 0 8px 8px 0;
}

/* 只选了开始日期，或开始结束为同一天 */
.day-button.range-start:not(.range-end),
.day-button.range-start.range-end {
  border-radius: 8px;
}
</style>
