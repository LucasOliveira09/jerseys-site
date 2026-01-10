import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProductView from '../views/ProductView.vue'
import LoginView from '../views/LoginView.vue' // <--- Importe
import RegisterView from '../views/RegisterView.vue' // <--- Importe

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/produto/:slug', name: 'produto', component: ProductView },
    
    // Adicione estas duas:
    { path: '/login', name: 'login', component: LoginView },
    { path: '/cadastro', name: 'cadastro', component: RegisterView }
  ]
})

export default router