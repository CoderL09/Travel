<script setup>
import { ref, nextTick } from 'vue';
const props = defineProps({ trip: { type: Object, required: true } });
const emit = defineEmits(['itinerary-generated', 'trip-updated']);
const draft = ref('');
const scroller = ref(null);
const busy = ref(false);
const generating = ref(false);
const elapsed = ref(0);
let elapsedTimer = null;
let requestController = null;
let counter = 1;
const greeting = '你好！我是你的 AI 旅行助手。告诉我你的旅行想法，我们可以一起完善计划。';
const messages = ref([{ id: counter++, role: 'assistant', content: greeting, welcome: true }]);
const suggestions = ['帮我安排东京 5 日游', '我想多体验当地美食', '行程轻松一点'];
const formatMessage = (text) => String(text).replace(/\*\*(.*?)\*\*/g, '$1');
const friendlyError = (error, fallback) => {
  const message = error?.data?.message || error?.data?.statusMessage || error?.message;
  if (message && /timeout|aborted/i.test(String(message))) return '请求超时，请稍后重试。';
  return message || fallback;
};
const history = () =>
  messages.value
    .filter((m) => !m.welcome && !m.error)
    .map((m) => ({ role: m.role, content: m.content }))
    .slice(-24);
function startElapsedTimer() {
  elapsed.value = 0;
  elapsedTimer = setInterval(() => {
    elapsed.value += 1;
  }, 1000);
}
function stopElapsedTimer() {
  if (elapsedTimer) clearInterval(elapsedTimer);
  elapsedTimer = null;
  elapsed.value = 0;
}
async function scrollDown() {
  await nextTick();
  scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: 'smooth' });
}
async function sendMessage(value = draft.value) {
  const content = String(value).trim();
  if (!content || busy.value || generating.value) return;
  messages.value.push({ id: counter++, role: 'user', content });
  draft.value = '';
  busy.value = true;
  await scrollDown();
  try {
    const result = await $fetch('/api/chat', {
      method: 'POST',
      body: { messages: history(), trip: props.trip },
      timeout: 120000
    });
    messages.value.push({ id: counter++, role: 'assistant', content: result.reply });
    if (result.trip && typeof result.trip === 'object') emit('trip-updated', result.trip);
  } catch (error) {
    messages.value.push({
      id: counter++,
      role: 'assistant',
      content: friendlyError(error, 'AI 暂时无法回复，请稍后重试。'),
      error: true
    });
  } finally {
    busy.value = false;
    await scrollDown();
  }
}
async function generateItinerary() {
  if (busy.value || generating.value) return;
  generating.value = true;
  startElapsedTimer();
  requestController = new AbortController();
  try {
    const context = history();
    const messagesToSend = context.length
      ? context
      : [{ role: 'user', content: '请根据当前旅行信息安排合理的行程。' }];
    const result = await $fetch('/api/itinerary', {
      method: 'POST',
      body: { messages: messagesToSend, trip: props.trip },
      timeout: 180000,
      signal: requestController.signal
    });
    emit('itinerary-generated', result);
    messages.value.push({
      id: counter++,
      role: 'assistant',
      content: `已生成 ${result.days.length} 天行程！你可以在中间查看、编辑，然后点击“保存行程”。`
    });
  } catch (error) {
    if (requestController?.signal?.aborted) {
      messages.value.push({
        id: counter++,
        role: 'assistant',
        content: '已取消生成行程。',
        error: true
      });
    } else {
      messages.value.push({
        id: counter++,
        role: 'assistant',
        content: friendlyError(error, '生成失败，请稍后重试。'),
        error: true
      });
    }
  } finally {
    generating.value = false;
    requestController = null;
    stopElapsedTimer();
    await scrollDown();
  }
}
function cancelGeneration() {
  requestController?.abort();
}
function resetChat() {
  if (busy.value || generating.value) return;
  messages.value = [{ id: counter++, role: 'assistant', content: greeting, welcome: true }];
  draft.value = '';
}
</script>

<template>
  <section class="chat-panel panel">
    <header class="panel-heading">
      <div><span class="sparkle">✦</span><strong>AI 旅行助手</strong></div>
      <button class="subtle-button" :disabled="busy || generating" @click="resetChat">
        重置对话
      </button>
    </header>
    <div ref="scroller" class="messages" aria-live="polite">
      <div v-for="message in messages" :key="message.id" class="message-row" :class="message.role">
        <span v-if="message.role === 'assistant'" class="avatar">✦</span>
        <div class="bubble">{{ formatMessage(message.content) }}</div>
      </div>
      <div v-if="busy || generating" class="message-row assistant">
        <span class="avatar">✦</span>
        <div class="bubble">
          {{ generating ? `正在规划行程（已等待 ${elapsed} 秒）…` : '正在思考…' }}
        </div>
      </div>
    </div>
    <div class="chat-bottom">
      <div class="suggestions">
        <button
          v-for="item in suggestions"
          :key="item"
          :disabled="busy || generating"
          @click="sendMessage(item)"
        >
          {{ item }} <span>↗</span>
        </button>
      </div>
      <button class="generate-button" :disabled="busy || generating" @click="generateItinerary">
        {{ generating ? `正在生成行程…（${elapsed} 秒）` : '✦ 确认需求，生成行程' }}
      </button>
      <button v-if="generating" class="cancel-button" @click="cancelGeneration">取消生成</button>
      <form class="chat-form" @submit.prevent="sendMessage()">
        <input
          v-model="draft"
          aria-label="旅行想法"
          placeholder="告诉我你的旅行想法…"
          :disabled="busy || generating"
        />
        <button type="submit" :disabled="!draft.trim() || busy || generating" aria-label="发送消息">
          ➤
        </button>
      </form>
      <p class="hint">AI 内容仅供参考，出行前请核实实际信息</p>
    </div>
  </section>
</template>

<style scoped>
.panel {
  background: #fff;
  border: 1px solid #edf0f6;
  border-radius: 22px;
  box-shadow: 0 12px 40px rgba(31, 51, 88, 0.035);
}
.chat-panel {
  display: flex;
  flex-direction: column;
  min-height: 680px;
  overflow: hidden;
}
.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 23px 22px;
  border-bottom: 1px solid #f0f2f7;
  gap: 8px;
}
.panel-heading > div {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 17px;
}
.sparkle {
  color: #3b74f6;
  font-size: 24px;
}
.subtle-button {
  border: 0;
  background: #f5f7fc;
  border-radius: 999px;
  padding: 9px 12px;
  color: #66758f;
  cursor: pointer;
  white-space: nowrap;
}
.messages {
  padding: 24px 19px;
  flex: 1;
  min-height: 250px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.message-row {
  display: flex;
  gap: 9px;
  align-items: flex-start;
}
.message-row.user {
  justify-content: flex-end;
}
.avatar {
  background: #dce7ff;
  color: #2d6cf6;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex: none;
}
.bubble {
  max-width: 89%;
  font-size: 14px;
  line-height: 1.85;
  padding: 14px 16px;
  border-radius: 17px;
  background: #f5f7fb;
  color: #24334e;
  white-space: pre-wrap;
}
.user .bubble {
  background: #e8f1ff;
  color: #2455a0;
  border-bottom-right-radius: 5px;
}
.assistant .bubble {
  border-top-left-radius: 5px;
}
.chat-bottom {
  padding: 15px 17px 17px;
}
.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}
.suggestions button {
  border: 0;
  background: #f2f6ff;
  color: #3468c9;
  padding: 9px 12px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
}
.suggestions span {
  margin-left: 4px;
}
.chat-form {
  display: flex;
  gap: 8px;
  align-items: center;
  border: 1px solid #e6ebf5;
  background: #fff;
  border-radius: 15px;
  padding: 7px;
  box-shadow: 0 5px 18px rgba(30, 55, 95, 0.05);
}
.chat-form input {
  border: 0;
  outline: 0;
  flex: 1;
  min-width: 0;
  padding: 10px;
  font: inherit;
  font-size: 13px;
  color: #182b48;
}
.chat-form button {
  border: 0;
  background: #3678ff;
  color: #fff;
  width: 39px;
  height: 39px;
  border-radius: 11px;
  cursor: pointer;
}
.chat-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.hint {
  text-align: center;
  color: #a0a9b8;
  font-size: 11px;
  margin: 9px 0 0;
}
.generate-button {
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 8px;
  border: 0;
  border-radius: 12px;
  background: #3678ff;
  color: white;
  font-weight: 700;
  cursor: pointer;
}
.generate-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.cancel-button {
  width: 100%;
  padding: 9px 14px;
  margin-bottom: 12px;
  border: 1px solid #dfe6f0;
  border-radius: 12px;
  background: #fff;
  color: #66758f;
  font-size: 13px;
  cursor: pointer;
}
.cancel-button:hover {
  background: #f5f7fc;
}
@media (max-width: 800px) {
  .chat-panel {
    min-height: 520px;
  }
}
@media (max-width: 480px) {
  .chat-panel {
    min-height: 440px;
    border-radius: 16px;
  }
  .panel-heading {
    padding: 16px 14px;
  }
  .panel-heading > div {
    font-size: 15px;
  }
  .messages {
    padding: 16px 12px;
    gap: 16px;
  }
  .bubble {
    max-width: 94%;
    font-size: 13px;
    line-height: 1.7;
    padding: 11px 12px;
  }
  .avatar {
    width: 28px;
    height: 28px;
  }
  .chat-bottom {
    padding: 12px 10px 14px;
  }
  .suggestions {
    gap: 6px;
    margin-bottom: 12px;
  }
  .suggestions button {
    padding: 8px 10px;
    font-size: 11px;
  }
  .generate-button {
    padding: 11px 12px;
    font-size: 13px;
  }
  .chat-form {
    padding: 5px;
  }
  .chat-form input {
    padding: 8px;
  }
  .hint {
    font-size: 10px;
  }
}
</style>
