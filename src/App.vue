<template>
  <router-view />
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

@keyframes gradientBG {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.btn-grade {
  width: 100%;
  height: 75px;
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 10px;
  border-radius: 20px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border: none;
  position: relative;
  overflow: hidden;
  letter-spacing: 3px;
}

.btn-grade::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%);
  transition: transform 0.4s ease;
}

.btn-grade::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.btn-grade:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
}

.btn-grade:hover::before {
  transform: scale(1.1);
}

.btn-grade:hover::after {
  opacity: 1;
}

.btn-grade:active {
  transform: translateY(-2px) scale(0.98);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.btn-grade-1 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  box-shadow: 0 10px 30px rgba(245, 87, 108, 0.4);
}

.btn-grade-2 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  box-shadow: 0 10px 30px rgba(79, 172, 254, 0.4);
}

.btn-grade-3 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  box-shadow: 0 10px 30px rgba(67, 233, 123, 0.4);
}

.btn-grade-4 {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
  box-shadow: 0 10px 30px rgba(250, 112, 154, 0.4);
}

.btn-grade-5 {
  background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
  color: white;
  box-shadow: 0 10px 30px rgba(161, 140, 209, 0.4);
}

.btn-grade-6 {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  color: white;
  box-shadow: 0 10px 30px rgba(255, 154, 158, 0.4);
}

.poem-card {
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 16px;
  margin-bottom: 6px;
  border: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  background: white;
  position: relative;
  overflow: hidden;
}

.poem-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.poem-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.poem-card:hover::before {
  transform: scaleX(1);
}

.poem-content {
  font-size: 1.35rem;
  line-height: 2.4;
  white-space: pre-wrap;
  font-family: 'KaiTi', '楷体', 'STKaiti', serif;
  color: #2c3e50;
  letter-spacing: 1px;
  padding: 10px 0;
}

.review-badge {
  font-size: 0.8rem;
  padding: 6px 14px;
  border-radius: 25px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card {
  border: none;
  border-radius: 0 !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.98);
  margin-bottom: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
}

.card-header {
  border-radius: 0 !important;
  padding: 20px 24px;
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.card-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
}

.card-body {
  border-radius: 0 !important;
}

.list-group-item {
  border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 16px 24px;
  transition: all 0.3s ease;
  position: relative;
  background: transparent;
}

.list-group-item:last-child {
  border-bottom: none;
}

.list-group-item:hover {
  background-color: rgba(102, 126, 234, 0.05);
  transform: translateX(5px);
}

.list-group-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.list-group-item:hover::before {
  transform: scaleY(1);
}

.badge {
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 25px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

h1, h2, h3, h4, h5 {
  font-weight: 700;
  letter-spacing: 0.5px;
}

.btn {
  border-radius: 14px;
  font-weight: 600;
  padding: 12px 24px;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  border: none;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.bg-light {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%) !important;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

.text-muted {
  color: #7a8a9a;
  font-weight: 500;
}

.container {
  padding: 24px 20px;
  max-width: 600px;
}

.card-body {
  padding: 20px 24px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.list-group-item {
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
}

.list-group-item:nth-child(1) { animation-delay: 0.05s; }
.list-group-item:nth-child(2) { animation-delay: 0.1s; }
.list-group-item:nth-child(3) { animation-delay: 0.15s; }
.list-group-item:nth-child(4) { animation-delay: 0.2s; }
.list-group-item:nth-child(5) { animation-delay: 0.25s; }
</style>