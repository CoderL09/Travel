<script setup>
defineProps({
  activity: { type: Object, required: true }
})

const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="activity-modal" role="dialog" aria-modal="true">
        <button type="button" class="close" aria-label="关闭" @click="emit('close')">×</button>

        <div class="modal-head">
          <span class="eyebrow">ACTIVITY DETAIL</span>
          <h2>{{ activity.name }}</h2>
          <p class="period">
            {{ activity.period }} · {{ activity.time }}
          </p>
        </div>

        <p class="desc">{{ activity.description }}</p>

        <div class="meta-grid">
          <div v-if="activity.location" class="meta-item">
            <span>⌖ 地点</span>
            <strong>{{ activity.location }}</strong>
          </div>
          <div v-if="activity.duration" class="meta-item">
            <span>◷ 建议停留</span>
            <strong>{{ activity.duration }}</strong>
          </div>
          <div v-if="activity.cost" class="meta-item">
            <span>¥ 参考花费</span>
            <strong>{{ activity.cost }}</strong>
          </div>
        </div>

        <div v-if="activity.transport" class="note">
          <h3>⇢ 交通建议</h3>
          <p>{{ activity.transport }}</p>
        </div>

        <div v-if="activity.tips" class="note tips">
          <h3>✦ 游玩贴士</h3>
          <p>{{ activity.tips }}</p>
        </div>

        <div class="modal-footer">
          <button type="button" class="confirm" @click="emit('close')">知道了</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(14, 26, 46, .55);
}

.activity-modal {
  position: relative;
  width: min(520px, 100%);
  max-height: 86vh;
  overflow-y: auto;
  padding: 30px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 24px 90px rgba(10, 20, 40, .35);
}

.close {
  position: absolute;
  top: 16px;
  right: 18px;
  border: 0;
  background: none;
  color: #9ca8ba;
  font-size: 26px;
  cursor: pointer;
}

.close:hover {
  color: #102449;
}

.eyebrow {
  color: #3478ff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
}

.modal-head h2 {
  margin: 12px 0 8px;
  color: #102449;
  font-size: 25px;
  letter-spacing: -.5px;
}

.period {
  margin: 0;
  color: #98a5ba;
  font-size: 13px;
}

.desc {
  margin: 20px 0;
  color: #5b6b84;
  font-size: 14px;
  line-height: 1.9;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 13px 15px;
  border-radius: 13px;
  background: #f5f8fd;
}

.meta-item span {
  color: #98a5ba;
  font-size: 11px;
}

.meta-item strong {
  color: #334766;
  font-size: 13px;
}

.note {
  margin-top: 18px;
  padding: 16px 18px;
  border-radius: 13px;
  background: #f5f8fd;
}

.note.tips {
  background: #fff7e8;
}

.note h3 {
  margin: 0 0 8px;
  color: #334766;
  font-size: 13px;
}

.note p {
  margin: 0;
  color: #6b7a92;
  font-size: 13px;
  line-height: 1.8;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.confirm {
  padding: 11px 26px;
  border: 0;
  border-radius: 11px;
  background: #3478ff;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.confirm:hover {
  background: #2465e5;
}

@media (max-width: 480px) {
  .modal-backdrop {
    padding: 10px;
  }

  .activity-modal {
    max-height: 92vh;
    padding: 22px 18px;
    border-radius: 18px;
  }

  .modal-head h2 {
    font-size: 21px;
  }

  .desc {
    margin: 14px 0;
    font-size: 13px;
  }

  .meta-item {
    padding: 11px 13px;
  }

  .note {
    padding: 14px 15px;
  }

  .modal-footer {
    margin-top: 18px;
  }

  .confirm {
    width: 100%;
    padding: 12px;
  }
}
</style>
