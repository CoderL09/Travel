<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { attractions } from '~/data/attractions'

const currentIndex = ref(0)
const showInfo = ref(false)




let timer


function startCarousel() {
  clearInterval(timer)

  timer = setInterval(() => {
    currentIndex.value =
      (currentIndex.value + 1) % attractions.length
  }, 3000)
}



function showAttractionInfo() {
  showInfo.value = true
  clearInterval(timer)
}


function closeAttractionInfo() {
  showInfo.value = false
  startCarousel()
}


onMounted(() => {
  startCarousel()
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<template>
  <section
    class="hero"
    @click.self="showAttractionInfo"
  >
   
    <Transition name="fade">
      <div
        :key="currentIndex"
        class="hero-background"
        :style="{
          backgroundImage: `
            linear-gradient(
              rgba(0, 0, 0, 0.4),
              rgba(0, 0, 0, 0.4)
            ),
            url(${attractions[currentIndex].image})
          `
        }"
      ></div>
    </Transition>

   
    <div class="hero-content">
      <h1>让 AI 带你探索世界</h1>

      <p>
        输入目的地、预算和旅行偏好，
        AI 为你生成专属行程。
      </p>

      <NuxtLink to="/plan" class="hero-cta">
        开始规划旅行
        <span aria-hidden="true">↗</span>
      </NuxtLink>
    </div>

    <Transition name="fade">
      <div
        v-if="showInfo"
        class="attraction-info"
      >
        <h2>{{ attractions[currentIndex].name }}</h2>

        <p class="attraction-country">{{ attractions[currentIndex].country }}</p>

        <p class="attraction-description">{{ attractions[currentIndex].description }}</p>

        <button @click="closeAttractionInfo">
          关闭
        </button>
      </div>
    </Transition>
  </section>
</template>


<style scoped>
.hero {
  min-height: 100vh;
  min-height: 100dvh;

  box-sizing: border-box;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  color: white;

  position: relative;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;

  padding: 24px;
  text-align: center;
}

.hero-content h1 {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 2px;

  color: white;
  margin: 0 0 20px;

  text-shadow: 0 4px 16px  rgba(0,0,0,0.5);
}

.hero-content p{
    font-size: 18px;
    font-weight: 400;       
    line-height: 1.8;       
    letter-spacing: 0.5px; 

     color: rgba(255, 255, 255, 0.85); 
     max-width: 600px; 
     margin: 0 auto;
}

.hero-cta{
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap:10px;

    padding: 14px 30px;
    margin-top: 20px;

    font-size: 17px;
    font-weight: 600;
    color: white;
    text-decoration: none;

     background-color:  rgba(255, 255, 255, 0.16);
     backdrop-filter: blur(12px);
     -webkit-backdrop-filter: blur(12px);  
     border-radius: 50px;        

     border:1px solid rgba(255,255,255,0.4);
     border-radius:50px;

     transition:background-color 0.3s ease,transform 0.3s ease
}

.hero-cta:hover{
    background-color: rgba(255,255,255,0.28);
    transform: translateY(-3px);
}


.attraction-info {
  position: absolute;
  right: 30px;
  bottom: 30px;
  z-index: 2;

  
  width: 280px;
  max-width: calc(100% - 60px);

  padding: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  text-align: left;

}


.attraction-info h2 {
  font-size: 22px;       
  font-weight: 700;      
  line-height: 1.3;      
  margin: 0 0 8px;      
  color: white;
}


.attraction-country {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 1px;   
  color: rgba(255, 255, 255, 0.65);
  margin: 0 0 14px;
}


.attraction-description {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 18px;
}



.attraction-info button {
  padding: 8px 18px;        

  font-size: 13px;         
  font-weight: 500;         
  color: white;             


  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

 
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;

 
  cursor: pointer;

 
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);


  transition:
    background-color 0.3s ease,
    transform 0.3s ease;
}


.attraction-info button:hover {
  background-color: rgba(255, 255, 255, 0.28);
  transform: translateY(-2px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1.5s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}




@media (max-width: 900px) {
  .hero-content h1 {
    font-size: 40px;
  }
}

@media (max-width: 768px) {
 
  .hero-content h1 {
    font-size: 32px;
  }

  .attraction-info {
    right: 20px;
    bottom: 20px;
    max-width: calc(100% - 40px);
  }
}


@media (max-width: 480px) {
  
  .hero-content {
    padding: 16px;
  }

  .hero-content h1 {
    font-size: 24px;
  }

  .hero-content p{
    font-size: 15px;
    line-height: 1.7;
  }

  .hero-cta {
    padding: 12px 24px;
    font-size: 15px;
  }

  .attraction-info {
    right: 10px;
    bottom: 10px;
    left: 10px;

    width: auto;
    max-width: none;
    padding: 16px;
  }
}
</style>