import { ref } from 'vue'

// 所有页面共享同一个响应式数组，数据源为服务端 MySQL（Prisma）
const trips = ref([])
const loaded = ref(false)
const loading = ref(false)

export function useTrips() {
  async function loadTrips() {
    if (loading.value) return trips.value
    loading.value = true
    try {
      const data = await $fetch('/api/trips')
      trips.value = Array.isArray(data) ? data : []
      loaded.value = true
    } catch (error) {
      console.error('加载旅行列表失败：', error)
    } finally {
      loading.value = false
    }
    return trips.value
  }

  async function saveTrip(data) {
    const record = await $fetch('/api/trips', { method: 'POST', body: data })
    trips.value.unshift(record)
    return record.id
  }

  async function getTrip(id) {
    try {
      return await $fetch(`/api/trips/${encodeURIComponent(id)}`)
    } catch (error) {
      if (error?.data?.statusCode === 404) return null
      throw error
    }
  }

  async function updateTrip(id, data) {
    const record = await $fetch(`/api/trips/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: data
    })
    const index = trips.value.findIndex(item => item.id === id)
    if (index >= 0) trips.value[index] = record
    return record
  }

  async function generateGuide(id) {
    const record = await $fetch(`/api/trips/${encodeURIComponent(id)}/guide`, {
      method: 'POST'
    })
    const index = trips.value.findIndex(item => item.id === id)
    if (index >= 0) trips.value[index] = record
    return record
  }

  async function deleteTrip(id) {
    await $fetch(`/api/trips/${encodeURIComponent(id)}`, { method: 'DELETE' })
    trips.value = trips.value.filter(item => item.id !== id)
  }

  return {
    trips,
    loadTrips,
    saveTrip,
    getTrip,
    updateTrip,
    generateGuide,
    deleteTrip
  }
}
