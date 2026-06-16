import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import PoemList from '../views/PoemList.vue'
import PoemDetail from '../views/PoemDetail.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/grade/:grade',
    name: 'PoemList',
    component: PoemList,
    props: true
  },
  {
    path: '/poem/:id',
    name: 'PoemDetail',
    component: PoemDetail,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router