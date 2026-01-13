<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)
const profile = ref(null)
const orders = ref([])
const loading = ref(true)
const activeTab = ref('dashboard')

// --- ESTADOS DO MODAL ---
const showModal = ref(false)
const selectedOrder = ref(null)

// Gamificação
const nivelTorcedor = computed(() => {
  const qtdPedidos = orders.value.length
  if (qtdPedidos >= 10) return { nome: 'Lenda do Clube 🏆', cor: 'text-yellow-400', bg: 'bg-yellow-400/10' }
  if (qtdPedidos >= 5) return { nome: 'Capitão ©', cor: 'text-atk-neon', bg: 'bg-atk-neon/10' }
  if (qtdPedidos >= 1) return { nome: 'Titular 👕', cor: 'text-blue-400', bg: 'bg-blue-400/10' }
  return { nome: 'Torcedor da Base 🧢', cor: 'text-gray-400', bg: 'bg-gray-400/10' }
})

onMounted(async () => {
  loading.value = true
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    router.push('/login')
    return
  }
  user.value = currentUser

  // Pega Perfil
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single()
  profile.value = profileData

  // Pega Pedidos + Itens + Dados do Produto (Nome e Foto)
  const { data: ordersData } = await supabase
    .from('orders')
    .select(`
      id, 
      created_at, 
      total, 
      status,
      order_items (
        id, quantity, price, size, product_id, customization,
        produtos ( name, image_cover ) 
      )
    `)
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })
  
  orders.value = ordersData || []
  loading.value = false
})

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/login')
}

// Abrir Modal
function abrirDetalhes(order) {
  selectedOrder.value = order
  showModal.value = true
}

// Utilitários
const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR')
const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const statusClass = (status) => {
  if (status === 'Pendente') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
  if (status === 'Pago') return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  if (status === 'Enviado') return 'text-purple-500 bg-purple-500/10 border-purple-500/20'
  if (status === 'Entregue') return 'text-green-500 bg-green-500/10 border-green-500/20'
  return 'text-gray-500'
}
</script>

<template>
  <div class="min-h-screen bg-atk-dark text-white p-4 md:p-8 font-sans pb-20">
    
    <div v-if="loading" class="flex justify-center items-center h-[50vh]">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-atk-neon"></div>
    </div>

    <div v-else class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
      
      <div class="md:col-span-1 space-y-6">
        <div class="bg-[#151515] p-6 rounded-xl border border-white/10 text-center">
          <div class="w-20 h-20 bg-atk-neon text-atk-dark rounded-full flex items-center justify-center text-3xl font-extrabold mx-auto mb-4 shadow-[0_0_20px_rgba(0,255,194,0.3)]">
            {{ profile?.full_name ? profile.full_name[0] : user.email[0].toUpperCase() }}
          </div>
          <h2 class="font-bold text-lg truncate">{{ profile?.full_name || 'Torcedor' }}</h2>
          <p class="text-xs text-gray-500 mb-3">{{ user.email }}</p>
          <div :class="`inline-block px-3 py-1 rounded-full text-xs font-bold border border-white/5 ${nivelTorcedor.bg} ${nivelTorcedor.cor}`">
            {{ nivelTorcedor.nome }}
          </div>
        </div>

        <nav class="bg-[#151515] rounded-xl border border-white/10 overflow-hidden">
          <button @click="activeTab = 'dashboard'" :class="activeTab === 'dashboard' ? 'bg-white/5 text-atk-neon border-l-4 border-atk-neon' : 'text-gray-400 hover:text-white'" class="w-full text-left px-6 py-4 font-bold text-sm transition flex items-center gap-3">📊 Visão Geral</button>
          <button @click="activeTab = 'pedidos'" :class="activeTab === 'pedidos' ? 'bg-white/5 text-atk-neon border-l-4 border-atk-neon' : 'text-gray-400 hover:text-white'" class="w-full text-left px-6 py-4 font-bold text-sm transition flex items-center gap-3">📦 Meus Pedidos <span class="bg-atk-neon text-atk-dark text-[10px] px-1.5 rounded-full ml-auto">{{ orders.length }}</span></button>
          <button @click="activeTab = 'favoritos'" :class="activeTab === 'favoritos' ? 'bg-white/5 text-atk-neon border-l-4 border-atk-neon' : 'text-gray-400 hover:text-white'" class="w-full text-left px-6 py-4 font-bold text-sm transition flex items-center gap-3">❤️ Favoritos</button>
          <button @click="handleLogout" class="w-full text-left px-6 py-4 font-bold text-sm text-red-500 hover:bg-red-500/10 transition flex items-center gap-3 border-t border-white/5">🚪 Sair</button>
        </nav>
      </div>

      <div class="md:col-span-3">
        
        <div v-if="activeTab === 'dashboard'" class="space-y-6 animate-fade-in">
          <h1 class="text-2xl font-bold uppercase tracking-wider">Olá, {{ profile?.full_name?.split(' ')[0] || 'Torcedor' }}! 👋</h1>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <p class="text-gray-400 text-xs uppercase mb-1">Total Gasto</p>
              <p class="text-2xl font-bold text-white">{{ formatMoney(orders.reduce((acc, o) => acc + Number(o.total), 0)) }}</p>
            </div>
            <div class="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <p class="text-gray-400 text-xs uppercase mb-1">Pedidos</p>
              <p class="text-2xl font-bold text-atk-neon">{{ orders.length }}</p>
            </div>
            <div class="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <p class="text-gray-400 text-xs uppercase mb-1">Status</p>
              <p class="text-lg font-bold" :class="nivelTorcedor.cor">{{ nivelTorcedor.nome }}</p>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'pedidos'" class="animate-fade-in space-y-4">
          <h2 class="text-2xl font-bold uppercase mb-6">Histórico de Pedidos</h2>
          
          <div v-if="orders.length === 0" class="text-center py-12 text-gray-500">Nenhum pedido encontrado.</div>

          <div v-for="order in orders" :key="order.id" class="bg-[#151515] border border-white/10 rounded-xl overflow-hidden">
            <div class="bg-[#1a1a1a] p-4 flex flex-wrap justify-between items-center border-b border-white/5 gap-4">
              <div>
                <span class="text-gray-500 text-xs uppercase block">Data</span>
                <span class="font-bold text-sm">{{ formatDate(order.created_at) }}</span>
              </div>
              <div>
                <span class="text-gray-500 text-xs uppercase block">Total</span>
                <span class="font-bold text-atk-neon">{{ formatMoney(order.total) }}</span>
              </div>
              <div>
                <span class="text-gray-500 text-xs uppercase block mb-1">Status</span>
                <span :class="`px-2 py-0.5 rounded text-[10px] font-bold border ${statusClass(order.status)}`">{{ order.status }}</span>
              </div>
              <button @click="abrirDetalhes(order)" class="text-xs bg-white/10 hover:bg-atk-neon hover:text-atk-dark px-3 py-2 rounded font-bold uppercase transition">
                Ver Detalhes
              </button>
            </div>
            
            <div class="p-4 text-xs text-gray-500 flex items-center gap-2">
               <span>📦 {{ order.order_items.length }} itens no pacote.</span>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'favoritos'" class="animate-fade-in text-center py-20 bg-[#151515] rounded-xl border border-dashed border-white/10">
          <p class="text-4xl mb-4">❤️</p>
          <h3 class="text-xl font-bold text-white">Sua lista de desejos</h3>
          <p class="text-gray-400 text-sm mb-6">Salve os mantos que você está de olho.</p>
          <button @click="router.push('/produtos')" class="bg-atk-neon text-atk-dark px-6 py-2 rounded font-bold uppercase text-sm">Explorar Loja</button>
        </div>

      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showModal = false">
      <div class="bg-[#1a1a1a] w-full max-w-2xl rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        
        <div class="bg-[#202020] p-4 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 class="font-bold text-white uppercase tracking-wider">Detalhes do Pedido</h3>
            <p class="text-xs text-gray-500">ID: #{{ selectedOrder.id }} • {{ formatDate(selectedOrder.created_at) }}</p>
          </div>
          <button @click="showModal = false" class="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div class="p-4 overflow-y-auto custom-scrollbar space-y-3">
          <div v-for="item in selectedOrder.order_items" :key="item.id" class="flex gap-4 bg-black/20 p-3 rounded border border-white/5 items-center">
            
            <div class="w-16 h-16 bg-white/5 rounded flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/10">
               <img v-if="item.produtos?.image_cover" :src="item.produtos.image_cover" class="w-full h-full object-contain p-1">
               <span v-else class="text-xs text-gray-500">Sem foto</span>
            </div>
            
            <div class="flex-grow">
              <p class="font-bold text-sm text-white">{{ item.produtos?.name || 'Produto Indisponível' }}</p>
              <div class="flex flex-wrap gap-3 text-xs text-gray-400 mt-1">
                <span class="bg-white/5 px-2 py-0.5 rounded">Tam: <strong class="text-white">{{ item.size }}</strong></span>
                <span class="bg-white/5 px-2 py-0.5 rounded">Qtd: <strong class="text-white">{{ item.quantity }}</strong></span>
              </div>
              
              <div v-if="item.customization" class="mt-2 text-[10px] bg-atk-neon/10 text-atk-neon inline-block px-2 py-1 rounded border border-atk-neon/20">
                Personalizado: <strong>{{ item.customization.nome }}</strong> #<strong>{{ item.customization.numero }}</strong>
              </div>
            </div>

            <div class="text-right">
              <p class="font-bold text-sm text-white">{{ formatMoney(item.price * item.quantity) }}</p>
              <p class="text-[10px] text-gray-500" v-if="item.quantity > 1">{{ formatMoney(item.price) }} un.</p>
            </div>
          </div>
        </div>

        <div class="bg-[#202020] p-4 border-t border-white/5">
          <div class="flex justify-between items-center text-sm mb-2 text-gray-400">
            <span>Status do Pagamento</span>
            <span :class="`font-bold ${statusClass(selectedOrder.status).split(' ')[0]}`">{{ selectedOrder.status }}</span>
          </div>
          <div class="flex justify-between items-center border-t border-white/10 pt-3">
            <span class="text-white uppercase font-bold tracking-widest">Total Pago</span>
            <span class="text-2xl font-extrabold text-atk-neon">{{ formatMoney(selectedOrder.total) }}</span>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

/* Scrollbar bonita para o modal */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
</style>