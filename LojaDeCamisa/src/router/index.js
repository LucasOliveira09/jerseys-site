import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'     // <--- Importe
import RegisterView from '../views/RegisterView.vue' // <--- Importe
import ProductView from '../views/ProductView.vue' // <--- Importe (se já tiver criado)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/cadastro',
    name: 'cadastro',
    component: RegisterView
  },
  // Rota para detalhe do produto (vamos precisar logo)
  {
    path: '/produto/:slug',
    name: 'produto',
    component: ProductView
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})