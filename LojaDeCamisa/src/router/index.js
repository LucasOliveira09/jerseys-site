import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CatalogView from '../views/CatalogView.vue'
import ProductView from '../views/ProductView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import AdminView from '../views/AdminView.vue'
import ShippingView from '../views/ShippingView.vue'
import CartView from '../views/CartView.vue'
import ProfileView from '../views/ProfileView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import PaymentView from '../views/PaymentView.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 } // Faz a página subir ao topo quando muda de rota
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
  path: '/pagamento/:id', // :id será o número do pedido
  name: 'pagamento',
  component: PaymentView,
  meta: { requiresAuth: true }
},
    {
      path: '/produtos',
      name: 'catalogo',
      component: CatalogView
    },
    {
      path: '/checkout',
  name: 'checkout',
  component: CheckoutView,
  // Opcional: Adicionar meta para exigir login
  meta: { requiresAuth: true } 
  },
    {
      path: '/produto/:slug',
      name: 'produto',
      component: ProductView
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
    {
      path: '/admin',
      name: 'admin',
      component: AdminView
    },
    {
  path: '/perfil',
  name: 'perfil',
  component: ProfileView
},
    {
      path: '/politicas',
      name: 'politicas',
      component: ShippingView
    },

    {
      path: '/carrinho',
      name: 'carrinho',
      component: CartView
    }
  ]
})

export default router