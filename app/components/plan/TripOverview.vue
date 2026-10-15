
<script setup>
import {
  Pencil,
  MapPin,
  CalendarDays,
  UsersRound,
  Wallet,
  Tags
} from 'lucide-vue-next'

defineProps({
  destination: {
    type: String,
    default: 'Tokyo, Japan'
  },
  startDate: {
    type: String,
    default: '2026-11-10'
  },
  endDate: {
    type: String,
    default: '2026-11-14'
  },
  travelers: {
    type: Number,
    default: 2
  },
  budget: {
    type: Number,
    default: 10000
  },
  preferences: {
    type: Array,
    default: () => ['Food', 'Nature', 'Culture']
  }
})

const emit = defineEmits(['edit'])

function formatDate(dateString) {
  if (!dateString) return ''

  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
}

function formatDateRange(start, end) {
  if (!start || !end) return 'Select travel dates'

  const startText = formatDate(start)
  const endText = formatDate(end)
  const year = end.split('-')[0]

  return `${startText} – ${endText}, ${year}`
}
</script>

<template>
  <section class="trip-overview">
    <header class="overview-header">
      <h3>Trip Overview</h3>

      <button
        type="button"
        class="edit-button"
        aria-label="Edit trip"
        @click="emit('edit')"
      >
        <Pencil :size="15" />
      </button>
    </header>

    <div class="overview-details">
      <div class="detail-row">
        <span class="icon-box green">
          <MapPin :size="17" />
        </span>
        <div class="detail-content">
          <span class="detail-label">Destination</span>
          <span class="detail-value">{{ destination }}</span>
        </div>
      </div>

      <div class="detail-row">
        <span class="icon-box coral">
          <CalendarDays :size="17" />
        </span>
        <div class="detail-content">
          <span class="detail-label">Dates</span>
          <span class="detail-value">
            {{ formatDateRange(startDate, endDate) }}
          </span>
        </div>
      </div>

      <div class="detail-row">
        <span class="icon-box blue">
          <UsersRound :size="17" />
        </span>
        <div class="detail-content">
          <span class="detail-label">Travelers</span>
          <span class="detail-value">
            {{ travelers }} {{ travelers === 1 ? 'person' : 'people' }}
          </span>
        </div>
      </div>

      <div class="detail-row">
        <span class="icon-box mint">
          <Wallet :size="17" />
        </span>
        <div class="detail-content">
          <span class="detail-label">Budget</span>
          <span class="detail-value">
            ¥ {{ budget.toLocaleString() }}
          </span>
        </div>
      </div>

      <div class="detail-row">
        <span class="icon-box purple">
          <Tags :size="17" />
        </span>
        <div class="detail-content">
          <span class="detail-label">Preferences</span>
          <span class="detail-value">
            {{ preferences.length ? preferences.join(' · ') : 'Not selected' }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.trip-overview {
  width: 100%;
  padding: 20px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 5px 24px rgba(40, 45, 90, 0.055);
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.overview-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #222b49;
}

.edit-button {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #53618f;
  background: #f0f2ff;
  cursor: pointer;
}

.edit-button:hover {
  background: #e5e9ff;
}

.overview-details {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-box {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
}

.green {
  color: #22a36c;
  background: #eaf8f0;
}

.coral {
  color: #ff6659;
  background: #fff0ee;
}

.blue {
  color: #5372ff;
  background: #edf0ff;
}

.mint {
  color: #25a878;
  background: #e9f8f2;
}

.purple {
  color: #695bd5;
  background: #f0edff;
}

.detail-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-label {
  font-size: 12px;
  color: #939ab0;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: #343c59;
  overflow-wrap: anywhere;
}
</style>
