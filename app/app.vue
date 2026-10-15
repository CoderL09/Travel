<script setup>
const route = useRoute();
</script>

<template>
  <div>
    <nav v-if="route.path !== '/plan'" class="navbar">
      <NuxtLink to="/" class="navbar-brand"> Travel AI </NuxtLink>

      <div class="navbar-links">
        <NuxtLink to="/">首页</NuxtLink>
        <NuxtLink to="/plan">AI 行程规划</NuxtLink>
        <NuxtLink to="/trips">我的旅行</NuxtLink>
      </div>
    </nav>
    <NuxtPage />
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
}
</style>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 20px 40px;
  box-sizing: border-box;

  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;

  background-color: transparent;

  border: none;
  box-shadow: none;
}

.navbar-brand {
  font-size: 22px;
  font-weight: 700;
  color: white;
  text-decoration: none;
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 30px;
}

.navbar-links a {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  transition: color 0.3s ease;
}

.navbar-links a:hover {
  color: white;
}

.navbar-links a.router-link-exact-active {
  color: white;
  font-weight: 700;
}

@media (max-width: 900px) {
  .navbar {
    padding: 16px 24px;
  }

  .navbar-links {
    gap: 18px;
  }

  .navbar-links a {
    font-size: 14px;
  }
}

@media (max-width: 640px) {
  .navbar {
    padding: 14px 16px;
  }

  .navbar-brand {
    font-size: 18px;
  }

  .navbar-links {
    gap: 10px;
    overflow-x: auto;
  }

  .navbar-links a {
    font-size: 13px;
    white-space: nowrap;
  }
}
</style>
