<template>
  <router-view />
</template>

<script>
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';


export default {
  name: 'App',
  mounted() {
    // Listen to Android native back button and system back swipe gestures
    if (Capacitor.getPlatform() === 'android') {
      this.backButtonListener = CapApp.addListener('backButton', () => {
        if (this.$route.name !== 'Home') {
          this.$router.back();
        } else {
          CapApp.exitApp();
        }
      });
    }

    this.touchStartX = 0;
    this.touchStartY = 0;
    
    this.handleTouchStart = (e) => {
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    };
    
    this.handleTouchEnd = (e) => {
      if (e.changedTouches.length > 0) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - this.touchStartX;
        const diffY = Math.abs(touchEndY - this.touchStartY);
        
        // Edge swipe from left: start X <= 40px, swipe right >= 85px, vertical deviation < 50px
        if (this.touchStartX <= 40 && diffX >= 85 && diffY < 50) {
          this.$router.back();
        }
      }
    };
    
    // Only register custom swipe listener on non-Android platforms (like iOS/web) to avoid double-back triggers
    if (Capacitor.getPlatform() !== 'android') {
      window.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      window.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }
  },
  beforeUnmount() {
    if (this.backButtonListener) {
      this.backButtonListener.remove();
    }
    if (Capacitor.getPlatform() !== 'android') {
      window.removeEventListener('touchstart', this.handleTouchStart);
      window.removeEventListener('touchend', this.handleTouchEnd);
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Long+Cang&family=Noto+Serif+SC:wght@500;700;900&family=ZCOOL+XiaoWei&display=swap');

* {
  box-sizing: border-box;
}

body {
  background-color: #f6f3eb;
  min-height: 100vh;
  color: #2c3e50;
  font-family: 'Noto Serif SC', -apple-system, BlinkMacSystemFont, sans-serif;
  margin: 0;
}



.btn-grade {
  width: 100%;
  height: 85px;
  font-size: 1.5rem;
  font-family: 'ZCOOL XiaoWei', serif;
  font-weight: 700;
  margin-bottom: 12px;
  border-radius: 12px;
  transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 15px rgba(44, 62, 80, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  position: relative;
  overflow: hidden;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-grade:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(44, 62, 80, 0.18);
}

.btn-grade:active {
  transform: translateY(-1px);
}

/* Traditional Chinese Heritage Colors */
.btn-grade-1 {
  background: linear-gradient(135deg, #c9372e 0%, #b0261f 100%);
  color: #fff6e5 !important;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn-grade-2 {
  background: linear-gradient(135deg, #274a78 0%, #1c3557 100%);
  color: #fff6e5 !important;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn-grade-3 {
  background: linear-gradient(135deg, #4c7d6c 0%, #375c4f 100%);
  color: #fff6e5 !important;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn-grade-4 {
  background: linear-gradient(135deg, #b07a3e 0%, #8c5f2e 100%);
  color: #fff6e5 !important;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn-grade-5 {
  background: linear-gradient(135deg, #785448 0%, #5d4037 100%);
  color: #fff6e5 !important;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn-grade-6 {
  background: linear-gradient(135deg, #522c5e 0%, #3e2047 100%);
  color: #fff6e5 !important;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.poem-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  border-radius: 12px;
  margin-bottom: 8px;
  border: 1px solid rgba(44, 62, 80, 0.08);
  box-shadow: 0 2px 10px rgba(44, 62, 80, 0.04);
  background: #fdfdfb;
  position: relative;
  overflow: hidden;
}

.poem-card:hover {
  transform: translateX(4px);
  box-shadow: 0 8px 20px rgba(44, 62, 80, 0.08);
  border-color: #4c7d6c;
}

.poem-content {
  font-size: 1.45rem;
  line-height: 1.8;
  font-family: 'Noto Serif SC', serif;
  color: #2c3e50;
  padding: 20px 15px;
  text-align: center;
  border-left: 1px dashed rgba(44, 62, 80, 0.1);
  border-right: 1px dashed rgba(44, 62, 80, 0.1);
  background-color: rgba(246, 243, 235, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.poem-line {
  margin-bottom: 12px;
  letter-spacing: 3px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.poem-line:last-child {
  margin-bottom: 0;
}

.review-badge {
  font-size: 0.85rem;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.card {
  border: 1px solid rgba(44, 62, 80, 0.08) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 24px rgba(76, 68, 55, 0.06) !important;
  background: #fdfdfb !important;
  margin-bottom: 24px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-header {
  border-radius: 12px 12px 0 0 !important;
  padding: 16px 20px;
  font-weight: 700;
  font-size: 1.1rem;
  font-family: 'ZCOOL XiaoWei', serif;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(44, 62, 80, 0.08) !important;
}

.card-body {
  border-radius: 0 0 12px 12px !important;
  padding: 20px 24px;
}

.list-group-item {
  border: none;
  border-bottom: 1px solid rgba(44, 62, 80, 0.05);
  padding: 16px 20px;
  transition: all 0.3s ease;
  background: transparent;
}

.list-group-item:last-child {
  border-bottom: none;
}

.badge {
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}

.bg-primary {
  background-color: #274a78 !important;
  color: #fff6e5 !important;
}

.bg-success {
  background-color: #4c7d6c !important;
  color: #fff6e5 !important;
}

.bg-secondary {
  background-color: #785448 !important;
  color: #fff6e5 !important;
}

.bg-info {
  background-color: #b07a3e !important;
  color: #fff6e5 !important;
}

h1, h2, h3, h4, h5 {
  font-weight: 700;
  font-family: 'ZCOOL XiaoWei', serif;
  letter-spacing: 1px;
}

.btn {
  border-radius: 8px;
  font-weight: 600;
  padding: 10px 20px;
  transition: all 0.3s ease;
  font-family: 'Noto Serif SC', serif;
  border: none;
}

.bg-light {
  background-color: #f6f3eb !important;
  border-bottom: 1px solid rgba(44, 62, 80, 0.05);
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 0.95rem;
}

.text-muted {
  color: #8c7e6c !important;
}

.container {
  padding: 20px 16px;
  max-width: 600px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.list-group-item {
  animation: fadeInUp 0.4s ease forwards;
  opacity: 0;
}

.list-group-item:nth-child(1) { animation-delay: 0.04s; }
.list-group-item:nth-child(2) { animation-delay: 0.08s; }
.list-group-item:nth-child(3) { animation-delay: 0.12s; }
.list-group-item:nth-child(4) { animation-delay: 0.16s; }
.list-group-item:nth-child(5) { animation-delay: 0.2s; }

</style>