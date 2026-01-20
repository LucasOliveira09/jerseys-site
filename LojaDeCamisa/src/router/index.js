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
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import UpdatePasswordView from '../views/UpdatePasswordView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 } // Faz a página subir ao topo quando muda de rota
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Início | LGA Sports' }
    },
    {
      path: '/pagamento/:id',
      name: 'pagamento',
      component: PaymentView,
      meta: { 
        requiresAuth: true,
        title: 'Pagamento | LGA Sports' 
      }
    },
    {
      path: '/produtos',
      name: 'catalogo',
      component: CatalogView,
      meta: { title: 'Catálogo de Produtos | LGA Sports' }
    },
    {
      path: '/recuperar-senha',
      name: 'recuperar-senha',
      component: ForgotPasswordView,
      meta: { title: 'Recuperar Senha | LGA Sports' }
    },
    {
      path: '/resetar-senha',
      name: 'resetar-senha',
      component: UpdatePasswordView,
      meta: { title: 'Nova Senha | LGA Sports' }
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: CheckoutView,
      meta: { 
        requiresAuth: true,
        title: 'Finalizar Compra | LGA Sports'
      }
    },
    {
      path: '/produto/:slug',
      name: 'produto',
      component: ProductView,
      meta: { title: 'Detalhes do Produto | LGA Sports' }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { title: 'Entrar | LGA Sports' }
    },
    {
      path: '/registro',
      name: 'registro',
      component: RegisterView,
      meta: { title: 'Criar Conta | LGA Sports' }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { title: 'Painel Admin | LGA Sports' }
    },
    {
      path: '/perfil',
      name: 'perfil',
      component: ProfileView,
      meta: { title: 'Meu Perfil | LGA Sports' }
    },
    {
      path: '/politicas',
      name: 'politicas',
      component: ShippingView,
      meta: { title: 'Políticas de Envio | LGA Sports' }
    },
    {
      path: '/carrinho',
      name: 'carrinho',
      component: CartView,
      meta: { title: 'Meu Carrinho | LGA Sports' }
    }
  ]
})

// --- LÓGICA PARA MUDAR O TÍTULO DA ABA ---
router.beforeEach((to, from, next) => {
  // Define o título da página com base no meta.title ou usa um padrão
  document.title = to.meta.title || 'LGA Sports | Artigos Esportivos';
  
  next();
});

export default router