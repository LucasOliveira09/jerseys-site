<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2' // Importando SweetAlert2

const router = useRouter()
const user = ref(null)
const orders = ref([])
const loading = ref(true)
const saving = ref(false)

// 🔴 ALTERAÇÃO 1: Começa na aba 'dados'
const activeTab = ref('dados')

// Dados do Formulário
const formPerfil = ref({
  full_name: '',
  email: '',
  cpf: '',
  phone: '',
  cep: '',
  address: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: ''
})

const showModal = ref(false)
const selectedOrder = ref(null)

const nivelTorcedor = computed(() => {
  const qtdPedidos = orders.value.length
  if (qtdPedidos >= 10) return { nome: 'Lenda do Clube 🏆', cor: 'text-yellow-400', bg: 'bg-yellow-400/10' }
  if (qtdPedidos >= 5) return { nome: 'Capitão ©', cor: 'text-atk-neon', bg: 'bg-atk-neon/10' }
  if (qtdPedidos >= 1) return { nome: 'Titular 👕', cor: 'text-blue-400', bg: 'bg-blue-400/10' }
  return { nome: 'Torcedor da Base 🧢', cor: 'text-gray-400', bg: 'bg-gray-400/10' }
})

onMounted(async () => {
  await carregarDados()
})

// --- HELPER PARA ALERTAS (PADRÃO DARK) ---
const showAlert = (title, text, icon = 'success') => {
  return Swal.fire({
    title: title,
    text: text,
    icon: icon,
    background: '#151515',
    color: '#fff',
    confirmButtonColor: '#00ffc2',
    confirmButtonText: 'OK'
  })
}

async function carregarDados() {
  loading.value = true
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) { router.push('/login'); return }
  user.value = currentUser

  // 1. Carrega Perfil
  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
  if (profileData) formPerfil.value = { ...profileData, email: currentUser.email }

  // 2. Carrega Pedidos
  const { data: ordersData, error } = await supabase
    .from('orders')
    .select(`
      id, created_at, total, status, shipping_cost,
      order_items (
        id, quantity, price, size, customization,
        produtos ( name, image_cover ) 
      )
    `)
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error("Erro ao buscar pedidos:", error)
  }
  
  orders.value = ordersData || []
  loading.value = false
}

// --- AÇÃO DE PAGAR ---
function irParaPagamento(orderId) {
  router.push(`/pagamento/${orderId}`)
}

// --- LÓGICA DE CPF E MÁSCARAS ---
function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '')
  if (cpf === '') return false
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  let add = 0
  for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i)
  let rev = 11 - (add % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cpf.charAt(9))) return false
  add = 0
  for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i)
  rev = 11 - (add % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cpf.charAt(10))) return false
  return true
}

async function salvarPerfil() {
  // Validação CPF com SweetAlert
  if (formPerfil.value.cpf && !validarCPF(formPerfil.value.cpf)) {
    showAlert('CPF Inválido', 'Verifique os números digitados.', 'warning')
    return
  }

  saving.value = true
  try {
    const updates = {
      id: user.value.id,
      full_name: formPerfil.value.full_name,
      cpf: formPerfil.value.cpf ? formPerfil.value.cpf.replace(/\D/g, '') : null,
      phone: formPerfil.value.phone,
      cep: formPerfil.value.cep,
      address: formPerfil.value.address,
      number: formPerfil.value.number,
      complement: formPerfil.value.complement,
      district: formPerfil.value.district,
      city: formPerfil.value.city,
      state: formPerfil.value.state,
      updated_at: new Date(),
    }
    const { error } = await supabase.from('profiles').upsert(updates)
    if (error) throw error
    
    // Sucesso com SweetAlert
    showAlert('Sucesso!', 'Seus dados foram atualizados.', 'success')

  } catch (error) {
    showAlert('Erro', error.message, 'error')
  } finally {
    saving.value = false
  }
}

async function buscarCep() {
  const cep = formPerfil.value.cep.replace(/\D/g, '')
  if (cep.length === 8) {
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (!data.erro) {
        formPerfil.value.address = data.logradouro
        formPerfil.value.district = data.bairro
        formPerfil.value.city = data.localidade
        formPerfil.value.state = data.uf
        document.getElementById('numeroInput')?.focus()
      }
    } catch (e) {}
  }
}

function mascaraCPF(e) {
  let v = e.target.value.replace(/\D/g, "")
  if (v.length > 11) v = v.slice(0, 11)
  v = v.replace(/(\d{3})(\d)/, "$1.$2")
  v = v.replace(/(\d{3})(\d)/, "$1.$2")
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  formPerfil.value.cpf = v
}

function mascaraTelefone(e) {
  let v = e.target.value.replace(/\D/g, "")
  if (v.length > 11) v = v.slice(0, 11)
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2")
  v = v.replace(/(\d)(\d{4})$/, "$1-$2")
  formPerfil.value.phone = v
}

// 🔴 ALTERAÇÃO 2: Logout com Confirmação
async function handleLogout() {
  const result = await Swal.fire({
    title: 'Sair da conta?',
    text: "Você precisará fazer login novamente.",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sair',
    cancelButtonText: 'Cancelar',
    background: '#151515',
    color: '#fff'
  })

  if (result.isConfirmed) {
    await supabase.auth.signOut()
    router.push('/login')
  }
}

function abrirDetalhes(order) {
  selectedOrder.value = order
  showModal.value = true
}

const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR')
const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const statusClass = (status) => {
  if (status === 'Pendente') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
  if (status === 'Pago') return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  if (status === 'Cancelado' || status === 'Falha') return 'text-red-500 bg-red-500/10 border-red-500/20'
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
            {{ formPerfil.full_name ? formPerfil.full_name[0] : user.email[0].toUpperCase() }}
          </div>
          <h2 class="font-bold text-lg truncate">{{ formPerfil.full_name || 'Torcedor' }}</h2>
          <p class="text-xs text-gray-500 mb-3">{{ user.email }}</p>
          <div :class="`inline-block px-3 py-1 rounded-full text-xs font-bold border border-white/5 ${nivelTorcedor.bg} ${nivelTorcedor.cor}`">
            {{ nivelTorcedor.nome }}
          </div>
        </div>

        <nav class="bg-[#151515] rounded-xl border border-white/10 overflow-hidden">
          <button @click="activeTab = 'dados'" :class="activeTab === 'dados' ? 'bg-white/5 text-atk-neon border-l-4 border-atk-neon' : 'text-gray-400 hover:text-white'" class="w-full text-left px-6 py-4 font-bold text-sm transition flex items-center gap-3">
            👤 Meus Dados
          </button>
          <button @click="activeTab = 'dashboard'" :class="activeTab === 'dashboard' ? 'bg-white/5 text-atk-neon border-l-4 border-atk-neon' : 'text-gray-400 hover:text-white'" class="w-full text-left px-6 py-4 font-bold text-sm transition flex items-center gap-3">
            📊 Visão Geral
          </button>
          <button @click="activeTab = 'pedidos'" :class="activeTab === 'pedidos' ? 'bg-white/5 text-atk-neon border-l-4 border-atk-neon' : 'text-gray-400 hover:text-white'" class="w-full text-left px-6 py-4 font-bold text-sm transition flex items-center gap-3">
            📦 Meus Pedidos <span class="bg-atk-neon text-atk-dark text-[10px] px-1.5 rounded-full ml-auto">{{ orders.length }}</span>
          </button>
          <button @click="handleLogout" class="w-full text-left px-6 py-4 font-bold text-sm text-red-500 hover:bg-red-500/10 transition flex items-center gap-3 border-t border-white/5">
            🚪 Sair
          </button>
        </nav>
      </div>

      <div class="md:col-span-3">
        
        <div v-if="activeTab === 'dashboard'" class="space-y-6 animate-fade-in">
          <h1 class="text-2xl font-bold uppercase tracking-wider">Painel do Torcedor</h1>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <p class="text-gray-400 text-xs uppercase mb-1">Total Gasto</p>
              <p class="text-2xl font-bold text-white">{{ formatMoney(orders.reduce((acc, o) => o.status !== 'Cancelado' ? acc + Number(o.total) : acc, 0)) }}</p>
            </div>
            <div class="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <p class="text-gray-400 text-xs uppercase mb-1">Pedidos</p>
              <p class="text-2xl font-bold text-atk-neon">{{ orders.length }}</p>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'dados'" class="space-y-6 animate-fade-in">
          <h2 class="text-2xl font-bold uppercase mb-2">Editar Perfil</h2>
          <form @submit.prevent="salvarPerfil" class="bg-[#1a1a1a] p-6 md:p-8 rounded-xl border border-white/10 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div><label class="block text-xs text-gray-500 uppercase mb-1">Nome</label><input v-model="formPerfil.full_name" class="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-atk-neon outline-none" /></div>
                 <div><label class="block text-xs text-gray-500 uppercase mb-1">CPF</label><input :value="formPerfil.cpf" @input="mascaraCPF" class="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-atk-neon outline-none" /></div>
                 <div><label class="block text-xs text-gray-500 uppercase mb-1">Telefone</label><input :value="formPerfil.phone" @input="mascaraTelefone" class="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-atk-neon outline-none" /></div>
                 <div><label class="block text-xs text-gray-500 uppercase mb-1">CEP</label><input v-model="formPerfil.cep" @blur="buscarCep" class="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-atk-neon outline-none" /></div>
                 <div class="md:col-span-2"><label class="block text-xs text-gray-500 uppercase mb-1">Endereço</label><input v-model="formPerfil.address" class="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-atk-neon outline-none" /></div>
                 <div><label class="block text-xs text-gray-500 uppercase mb-1">Número</label><input id="numeroInput" v-model="formPerfil.number" class="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-atk-neon outline-none" /></div>
                 <div><label class="block text-xs text-gray-500 uppercase mb-1">Bairro</label><input v-model="formPerfil.district" class="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-atk-neon outline-none" /></div>
                 <div><label class="block text-xs text-gray-500 uppercase mb-1">Cidade</label><input v-model="formPerfil.city" class="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-atk-neon outline-none" /></div>
                 <div><label class="block text-xs text-gray-500 uppercase mb-1">UF</label><input v-model="formPerfil.state" class="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-atk-neon outline-none uppercase" /></div>
            </div>
            <button type="submit" :disabled="saving" class="bg-atk-neon text-atk-dark font-extrabold uppercase px-8 py-3 rounded hover:bg-white transition w-full">
              {{ saving ? 'Salvando...' : 'Salvar Alterações' }}
            </button>
          </form>
        </div>

        <div v-if="activeTab === 'pedidos'" class="animate-fade-in space-y-4">
          <h2 class="text-2xl font-bold uppercase mb-6">Histórico de Pedidos</h2>
          <div v-if="orders.length === 0" class="text-center py-12 text-gray-500">Nenhum pedido encontrado.</div>
          
          <div v-for="order in orders" :key="order.id" class="bg-[#151515] border border-white/10 rounded-xl overflow-hidden hover:border-atk-neon/30 transition">
            <div class="bg-[#1a1a1a] p-4 flex flex-wrap justify-between items-center border-b border-white/5 gap-4">
              <div class="flex items-center gap-4">
                 <div><span class="text-gray-500 text-xs uppercase block">Data</span><span class="font-bold text-sm">{{ formatDate(order.created_at) }}</span></div>
                 <div><span class="text-gray-500 text-xs uppercase block">Total</span><span class="font-bold text-atk-neon">{{ formatMoney(order.total) }}</span></div>
                 <div><span class="text-gray-500 text-xs uppercase block mb-1">Status</span><span :class="`px-2 py-0.5 rounded text-[10px] font-bold border ${statusClass(order.status)}`">{{ order.status }}</span></div>
              </div>
              
              <div class="flex gap-2">
                 <button v-if="order.status === 'Pendente'" @click="irParaPagamento(order.id)" class="text-xs bg-green-500 text-white hover:bg-green-400 px-4 py-2 rounded font-bold uppercase transition flex items-center gap-2 animate-pulse">
                    Pagar Agora 💳
                 </button>
                 
                 <button @click="abrirDetalhes(order)" class="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded font-bold uppercase transition">
                    Detalhes
                 </button>
              </div>
            </div>
            <div class="p-4 text-xs text-gray-500 flex justify-between">
               <span>📦 {{ order.order_items.length }} itens no pacote.</span>
               <span class="text-gray-600">ID: #{{ String(order.id).slice(0,8) }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showModal = false">
      <div class="bg-[#1a1a1a] w-full max-w-2xl rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        <div class="bg-[#202020] p-4 border-b border-white/5 flex justify-between items-center">
          <div>
              <h3 class="font-bold text-white uppercase tracking-wider">Detalhes do Pedido</h3>
              <p :class="`text-xs font-bold mt-1 ${statusClass(selectedOrder.status)}`">{{ selectedOrder.status }}</p>
          </div>
          <button @click="showModal = false" class="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        <div class="p-4 overflow-y-auto custom-scrollbar space-y-3 flex-grow">
          <div v-for="item in selectedOrder.order_items" :key="item.id" class="flex gap-4 bg-black/20 p-3 rounded border border-white/5 items-center">
            <div class="w-16 h-16 bg-white/5 rounded flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/10">
               <img v-if="item.produtos?.image_cover" 
                    :src="item.produtos.image_cover" 
                    class="w-full h-full object-contain p-1">
               <span v-else class="text-xs text-gray-500">Sem foto</span>
            </div>
            <div class="flex-grow">
              <p class="font-bold text-sm text-white">{{ item.produtos?.name || 'Produto Removido' }}</p>
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
            </div>
          </div>
        </div>

        <div class="bg-[#202020] p-4 border-t border-white/5 space-y-2">
            <div class="flex justify-between text-gray-400 text-sm">
                <span>Frete</span>
                <span>{{ formatMoney(selectedOrder.shipping_cost || 0) }}</span>
            </div>
            <div class="flex justify-between text-white font-bold text-lg border-t border-white/10 pt-2">
                <span>Total</span>
                <span class="text-atk-neon">{{ formatMoney(selectedOrder.total) }}</span>
            </div>
            
            <button v-if="selectedOrder.status === 'Pendente'" 
                    @click="irParaPagamento(selectedOrder.id)" 
                    class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded uppercase mt-4 transition">
                Realizar Pagamento Agora
            </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
</style>