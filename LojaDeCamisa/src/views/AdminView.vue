<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const router = useRouter()
const activeTab = ref('dashboard')
const loading = ref(true)

// DADOS
const stats = ref({ faturamento: 0, totalPedidos: 0, pendentes: 0 })
const orders = ref([])
const produtos = ref([])
const searchProdutos = ref('')

// --- CONTROLE DE SELEÇÃO DE PEDIDOS ---
const selectedOrderIds = ref([])
const allSelected = computed({
  get: () => orders.value.length > 0 && selectedOrderIds.value.length === orders.value.length,
  set: (val) => {
    if (val) selectedOrderIds.value = orders.value.map(o => o.id)
    else selectedOrderIds.value = []
  }
})

async function excluirPedidosSelecionados() {
  if (selectedOrderIds.value.length === 0) return
  const result = await Swal.fire({
    title: 'Tem certeza?', text: `Apagar ${selectedOrderIds.value.length} pedido(s)?`, icon: 'warning',
    showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sim, apagar!', background: '#151515', color: '#fff'
  })
  if (result.isConfirmed) {
    try {
      const { error } = await supabase.from('orders').delete().in('id', selectedOrderIds.value)
      if (error) throw error
      Swal.fire({ title: 'Apagado!', icon: 'success', timer: 1000, showConfirmButton: false, background: '#151515', color: '#fff' })
      selectedOrderIds.value = [] 
      await buscarPedidos()
      calcularStats()
    } catch (e) {
      Swal.fire({ title: 'Erro', text: e.message, icon: 'error', background: '#151515', color: '#fff' })
    }
  }
}

// CONFIGURAÇÃO
const tamanhosGrade = ['P', 'M', 'G', 'GG', 'XG', '2XL', '16', '18', '20', '22', '24', '26', '28'] 
const categorias = ['Torcedor', 'Player', 'Feminino', 'Kids', 'Retrô']
const ligas = ['Brasileirão', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Seleções', 'Outros']

// CONTROLES MODAIS
const showProductModal = ref(false)
const editandoProduto = ref(false)
const salvandoProduto = ref(false)
const novaFotoUrl = ref('') 
const showStockModal = ref(false)
const showOrderModal = ref(false)

// FORMS
const selectedOrder = ref(null)
const produtoEmEdicaoEstoque = ref(null)
const stockForm = ref({})
const formProduto = ref({
  id: null, name: '', description: '', price_cost: 0, price_sale: 0,
  image_cover: '', images_gallery: [], category: 'Torcedor', league: 'Brasileirão',
  slug: '', active: true, is_featured: false, is_queridinha: false, stock: {} 
})

onMounted(async () => {
  await verificarAdmin()
  await carregarTudo()
})

async function verificarAdmin() {
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
  
  if (!user || user.email !== adminEmail) {
    router.push('/')
  }
}

async function carregarTudo() {
  loading.value = true
  await Promise.all([buscarPedidos(), buscarProdutos()])
  calcularStats()
  loading.value = false
}

// --- PEDIDOS ---
async function buscarPedidos() {
  const { data, error } = await supabase
    .from('orders')
    .select(`*, profiles (full_name, email, cpf, phone, cep, address, number, complement, district, city, state), order_items (*, produtos (name, image_cover))`)
    .order('created_at', { ascending: false })
  
  if (!error) orders.value = data
  else console.error("Erro buscar pedidos:", error)
}

function calcularStats() {
  const total = orders.value.reduce((acc, o) => o.status !== 'Cancelado' ? acc + Number(o.total) : acc, 0)
  const pendentes = orders.value.filter(o => o.status === 'Pendente').length
  stats.value = { faturamento: total, totalPedidos: orders.value.length, pendentes }
}

async function atualizarStatusPedido(order, novoStatus) {
  await supabase.from('orders').update({ status: novoStatus }).eq('id', order.id)
  order.status = novoStatus
  calcularStats()
  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Pedido ${novoStatus}`, showConfirmButton: false, timer: 1500, background: '#151515', color: '#fff' })
}

function verDetalhesPedido(order) {
  selectedOrder.value = order
  showOrderModal.value = true
}

// --- PRODUTOS ---
async function buscarProdutos() {
  const { data, error } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
  if (error) console.error("Erro buscar produtos:", error)
  produtos.value = data || []
}

function abrirModalProduto(produto = null) {
  editandoProduto.value = !!produto
  novaFotoUrl.value = ''
  if (produto) {
    let galeria = []
    try {
      if (Array.isArray(produto.images_gallery)) galeria = [...produto.images_gallery]
      else if (typeof produto.images_gallery === 'string') {
          const limp = produto.images_gallery.replace(/^{|}$/g, '')
          if (limp) galeria = limp.split(',').map(s => s.replace(/"/g, '').trim())
      }
    } catch(e) { galeria = [] }
    formProduto.value = { ...produto, images_gallery: galeria, stock: produto.stock || {}, is_featured: !!produto.is_featured, is_queridinha: !!produto.is_queridinha }
  } else {
    formProduto.value = { id: null, name: '', description: '', price_cost: 0, price_sale: 0, image_cover: '', images_gallery: [], category: 'Torcedor', league: 'Brasileirão', slug: '', active: true, is_featured: false, is_queridinha: false, stock: {} }
  }
  showProductModal.value = true
}

function gerarSlug() {
  if (!editandoProduto.value && formProduto.value.name) {
    formProduto.value.slug = formProduto.value.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
  }
}

function addFotoNaGaleria() { if (novaFotoUrl.value) { formProduto.value.images_gallery.push(novaFotoUrl.value); novaFotoUrl.value = '' } }
function removerFotoGaleria(index) { formProduto.value.images_gallery.splice(index, 1) }

// --- 🚨 FUNÇÃO DE SALVAR BLINDADA 🚨 ---
async function salvarProduto() {
  salvandoProduto.value = true
  
  try {
    // 1. Prepara o Payload (Limpa os dados)
    const payload = { 
        name: formProduto.value.name,
        description: formProduto.value.description || '',
        image_cover: formProduto.value.image_cover,
        category: formProduto.value.category,
        league: formProduto.value.league,
        slug: formProduto.value.slug,
        active: formProduto.value.active,
        is_featured: formProduto.value.is_featured,
        is_queridinha: formProduto.value.is_queridinha
    }
    
    // Tratamento de Arrays e Objetos
    payload.images_gallery = Array.isArray(formProduto.value.images_gallery) ? formProduto.value.images_gallery.filter(x => x) : []
    payload.stock = formProduto.value.stock || {}
    
    // Converte para número (CRÍTICO)
    payload.price_cost = Number(formProduto.value.price_cost) || 0
    payload.price_sale = Number(formProduto.value.price_sale) || 0

    console.log("🟡 Tentando salvar:", payload)

    let error = null

    if (editandoProduto.value) {
        // UPDATE
        const { error: err } = await supabase.from('produtos').update(payload).eq('id', formProduto.value.id)
        error = err
    } else {
        // INSERT
        const { error: err } = await supabase.from('produtos').insert([payload]) // Note os colchetes []
        error = err
    }

    if (error) {
        console.error("🔴 ERRO SUPABASE:", error)
        throw error
    }

    await buscarProdutos()
    showProductModal.value = false
    Swal.fire({ icon: 'success', title: 'Salvo!', timer: 1000, showConfirmButton: false, background: '#151515', color: '#fff' })

  } catch (e) { 
    console.error("🔴 CATCH FINAL:", e)
    Swal.fire({ 
        icon: 'error', 
        title: 'Erro ao Salvar', 
        text: e.message || 'Erro desconhecido. Abra o console (F12).',
        background: '#151515', color: '#fff' 
    }) 
  } finally { 
    salvandoProduto.value = false 
  }
}

async function toggleProduto(produto, campo) {
  produto[campo] = !produto[campo]
  await supabase.from('produtos').update({ [campo]: produto[campo] }).eq('id', produto.id)
}

function abrirModalEstoque(produto) {
  produtoEmEdicaoEstoque.value = produto
  stockForm.value = { ...produto.stock } || {}
  tamanhosGrade.forEach(t => { if (stockForm.value[t] === undefined) stockForm.value[t] = 0 })
  showStockModal.value = true
}

async function salvarEstoque() {
  try {
    const estoqueLimpo = {}
    for (const [tam, qtd] of Object.entries(stockForm.value)) { if (qtd > 0) estoqueLimpo[tam] = qtd }
    const { error } = await supabase.from('produtos').update({ stock: estoqueLimpo }).eq('id', produtoEmEdicaoEstoque.value.id)
    if (error) throw error
    produtoEmEdicaoEstoque.value.stock = estoqueLimpo
    showStockModal.value = false
    Swal.fire({ icon: 'success', title: 'Estoque Atualizado', timer: 1000, showConfirmButton: false, background: '#151515', color: '#fff' })
  } catch (e) { Swal.fire({ icon: 'error', title: 'Erro', text: e.message }) }
}

function getTotalEstoque(produto) {
  if (!produto.stock) return 0
  return Object.values(produto.stock).reduce((acc, qtd) => acc + Number(qtd), 0)
}

const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const productosFiltrados = computed(() => !searchProdutos.value ? produtos.value : produtos.value.filter(p => p.name.toLowerCase().includes(searchProdutos.value.toLowerCase())))
const statusClass = (s) => {
  if(s==='Pendente') return 'text-yellow-500 border-yellow-500/50'
  if(s==='Pago') return 'text-blue-400 border-blue-400/50'
  if(s==='Enviado') return 'text-purple-400 border-purple-400/50'
  if(s==='Entregue') return 'text-green-500 border-green-500/50'
  return 'text-red-500 border-red-500/50'
}
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] text-white font-sans flex">
    
    <aside class="w-64 bg-[#151515] border-r border-white/5 flex flex-col fixed h-full z-20">
      <div class="p-6 border-b border-white/5 flex items-center gap-2">
        <span class="text-2xl">🛡️</span>
        <h1 class="font-extrabold text-xl uppercase tracking-tighter">Admin<span class="text-atk-neon">Painel</span></h1>
      </div>
      <nav class="flex-grow p-4 space-y-2">
        <button @click="activeTab = 'dashboard'" :class="activeTab === 'dashboard' ? 'bg-atk-neon text-atk-dark font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'" class="w-full text-left px-4 py-3 rounded transition flex items-center gap-3">📊 Dashboard</button>
        <button @click="activeTab = 'pedidos'" :class="activeTab === 'pedidos' ? 'bg-atk-neon text-atk-dark font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'" class="w-full text-left px-4 py-3 rounded transition flex items-center gap-3">📦 Pedidos <span v-if="stats.pendentes > 0" class="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{{ stats.pendentes }}</span></button>
        <button @click="activeTab = 'produtos'" :class="activeTab === 'produtos' ? 'bg-atk-neon text-atk-dark font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'" class="w-full text-left px-4 py-3 rounded transition flex items-center gap-3">👕 Produtos</button>
        <button @click="activeTab = 'estoque'" :class="activeTab === 'estoque' ? 'bg-atk-neon text-atk-dark font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'" class="w-full text-left px-4 py-3 rounded transition flex items-center gap-3">🏭 Estoque</button>
      </nav>
      <div class="p-4 border-t border-white/5"><router-link to="/" class="block text-center text-xs uppercase font-bold text-gray-500 hover:text-white transition">Voltar para Loja</router-link></div>
    </aside>

    <main class="flex-grow ml-64 p-8">
      <div v-if="loading" class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-atk-neon"></div></div>
      <div v-else>
        
        <div v-if="activeTab === 'dashboard'" class="animate-fade-in space-y-8">
          <h2 class="text-3xl font-bold uppercase mb-6">Visão Geral</h2>
          <div class="grid grid-cols-3 gap-6">
            <div class="bg-[#1a1a1a] p-6 rounded-xl border border-white/10"><p class="text-gray-500 text-xs uppercase font-bold mb-2">Faturamento</p><p class="text-4xl font-extrabold text-atk-neon">{{ formatMoney(stats.faturamento) }}</p></div>
            <div class="bg-[#1a1a1a] p-6 rounded-xl border border-white/10"><p class="text-gray-500 text-xs uppercase font-bold mb-2">Pedidos</p><p class="text-4xl font-extrabold text-white">{{ stats.totalPedidos }}</p></div>
            <div class="bg-[#1a1a1a] p-6 rounded-xl border border-white/10"><p class="text-gray-500 text-xs uppercase font-bold mb-2">Pendentes</p><p class="text-4xl font-extrabold text-yellow-500">{{ stats.pendentes }}</p></div>
          </div>
        </div>

        <div v-if="activeTab === 'pedidos'" class="animate-fade-in">
           <div class="flex justify-between items-center mb-6">
             <h2 class="text-3xl font-bold uppercase">Pedidos Recentes</h2>
             <button v-if="selectedOrderIds.length > 0" @click="excluirPedidosSelecionados" class="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded flex items-center gap-2 animate-bounce-short shadow-lg">
                🗑️ Apagar ({{ selectedOrderIds.length }})
             </button>
           </div>

           <div class="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
             <table class="w-full text-left text-sm">
               <thead>
                 <tr class="bg-[#202020] text-gray-400 uppercase text-xs">
                   <th class="p-4 w-10 text-center"><input type="checkbox" v-model="allSelected" class="accent-atk-neon w-4 h-4 cursor-pointer"></th>
                   <th class="p-4">ID</th><th class="p-4">Cliente</th><th class="p-4">Total</th><th class="p-4">Status</th><th class="p-4 text-right">Detalhes</th>
                 </tr>
               </thead>
               <tbody>
                 <tr v-for="order in orders" :key="order.id" class="border-b border-white/5 hover:bg-white/5 transition" :class="selectedOrderIds.includes(order.id) ? 'bg-red-500/10' : ''">
                   <td class="p-4 text-center"><input type="checkbox" :value="order.id" v-model="selectedOrderIds" class="accent-atk-neon w-4 h-4 cursor-pointer"></td>
                   <td class="p-4 font-mono text-gray-500">#{{ String(order.id).slice(0,8) }}</td>
                   <td class="p-4">{{ order.profiles?.full_name || 'Desconhecido' }}</td>
                   <td class="p-4 font-bold text-atk-neon">{{ formatMoney(order.total) }}</td>
                   <td class="p-4">
                     <select :value="order.status" @change="atualizarStatusPedido(order, $event.target.value)" class="bg-[#0f0f0f] border text-xs text-white rounded px-2 py-1 outline-none font-bold uppercase" :class="statusClass(order.status)">
                       <option value="Pendente">Pendente</option><option value="Pago">Pago</option><option value="Enviado">Enviado</option><option value="Entregue">Entregue</option><option value="Cancelado">Cancelado</option>
                     </select>
                   </td>
                   <td class="p-4 text-right"><button @click="verDetalhesPedido(order)" class="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-xs uppercase font-bold">Ficha de Envio</button></td>
                 </tr>
               </tbody>
             </table>
           </div>
        </div>

        <div v-if="activeTab === 'produtos'" class="animate-fade-in">
           <div class="flex justify-between items-center mb-6"><h2 class="text-3xl font-bold uppercase">Catálogo</h2><button @click="abrirModalProduto()" class="bg-atk-neon text-atk-dark px-4 py-2 rounded font-bold uppercase text-sm hover:scale-105 transition">+ Novo Produto</button></div>
           <div class="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
             <table class="w-full text-left text-sm">
               <thead><tr class="bg-[#202020] text-gray-400 uppercase text-xs"><th class="p-4">Produto</th><th class="p-4">Preço</th><th class="p-4 text-center">Home?</th><th class="p-4 text-center">Ativo</th><th class="p-4 text-right">Ação</th></tr></thead>
               <tbody>
                 <tr v-for="prod in productosFiltrados" :key="prod.id" class="border-b border-white/5">
                   <td class="p-4 flex items-center gap-2"><img :src="prod.image_cover" class="w-8 h-8 rounded object-contain bg-white/5">{{ prod.name }}</td>
                   <td class="p-4 font-mono">{{ formatMoney(prod.price_sale) }}</td>
                   <td class="p-4 text-center space-x-1">
                      <span v-if="prod.is_queridinha" class="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1 rounded">Queridinha</span>
                      <span v-if="prod.is_featured" class="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1 rounded">Destaque</span>
                      <span v-if="!prod.is_queridinha && !prod.is_featured" class="text-gray-600">-</span>
                   </td>
                   <td class="p-4 text-center"><button @click="toggleProduto(prod, 'active')" class="w-8 h-4 rounded-full relative transition-colors" :class="prod.active ? 'bg-green-500' : 'bg-gray-700'"><span class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform" :class="prod.active ? 'translate-x-4' : ''"></span></button></td>
                   <td class="p-4 text-right"><button @click="abrirModalProduto(prod)" class="text-gray-400 hover:text-white">✏️ Editar</button></td>
                 </tr>
               </tbody>
             </table>
           </div>
        </div>

        <div v-if="activeTab === 'estoque'" class="animate-fade-in">
          <div class="flex justify-between items-center mb-6"><h2 class="text-3xl font-bold uppercase">Estoque</h2><input v-model="searchProdutos" type="text" placeholder="Buscar..." class="bg-[#1a1a1a] border border-white/10 rounded px-4 py-2 text-white outline-none focus:border-atk-neon" /></div>
          <div class="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
            <table class="w-full text-left text-sm">
              <thead><tr class="bg-[#202020] text-gray-400 uppercase text-xs"><th class="p-4">Produto</th><th class="p-4 text-center">Total</th><th class="p-4">Grade</th><th class="p-4 text-right">Ação</th></tr></thead>
              <tbody>
                <tr v-for="prod in productosFiltrados" :key="prod.id" class="border-b border-white/5 hover:bg-white/5">
                  <td class="p-4 flex items-center gap-3"><img :src="prod.image_cover" class="w-10 h-10 object-contain bg-white/5 rounded"><div><p class="font-bold">{{ prod.name }}</p></div></td>
                  <td class="p-4 text-center"><span class="font-bold text-atk-neon">{{ getTotalEstoque(prod) }}</span></td>
                  <td class="p-4"><div class="flex flex-wrap gap-1"><span v-for="(qtd, tam) in prod.stock" :key="tam" v-show="qtd > 0" class="text-[10px] bg-white/10 px-1.5 py-0.5 rounded border border-white/10 text-gray-300"><strong class="text-white">{{ tam }}:</strong> {{ qtd }}</span></div></td>
                  <td class="p-4 text-right"><button @click="abrirModalEstoque(prod)" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold uppercase">Editar</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>

    <div v-if="showOrderModal" class="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
       <div class="bg-[#151515] w-full max-w-4xl rounded-xl border border-white/10 shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
         <div class="bg-atk-neon p-4 flex justify-between items-center text-atk-dark">
            <h3 class="font-extrabold uppercase text-xl flex items-center gap-2">📦 Ficha de Separação <span class="text-sm bg-black/10 px-2 py-1 rounded">#{{ selectedOrder?.id }}</span></h3>
            <button @click="showOrderModal = false" class="text-2xl font-bold hover:text-white">&times;</button>
         </div>
         <div class="p-8 overflow-y-auto custom-scrollbar flex-grow space-y-8" v-if="selectedOrder">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div class="bg-[#1a1a1a] p-6 rounded-lg border border-white/10">
                  <h4 class="text-atk-neon font-bold uppercase mb-4 text-sm tracking-widest border-b border-white/5 pb-2">Destinatário</h4>
                  <p class="text-xl font-bold text-white mb-1">{{ selectedOrder.profiles?.full_name }}</p>
                  <p class="text-gray-400 text-sm mb-4">{{ selectedOrder.profiles?.email }}</p>
                  <div class="space-y-1 text-sm text-gray-300">
                     <p><strong class="text-white">CPF:</strong> {{ selectedOrder.profiles?.cpf || 'Não informado' }}</p>
                     <p><strong class="text-white">Tel:</strong> {{ selectedOrder.profiles?.phone || 'Não informado' }}</p>
                  </div>
               </div>
               <div class="bg-[#1a1a1a] p-6 rounded-lg border border-white/10">
                  <h4 class="text-atk-neon font-bold uppercase mb-4 text-sm tracking-widest border-b border-white/5 pb-2">Endereço de Entrega</h4>
                  <div class="text-white text-lg leading-relaxed">
                     <p class="font-bold">{{ selectedOrder.profiles?.address }}, {{ selectedOrder.profiles?.number }}</p>
                     <p v-if="selectedOrder.profiles?.complement" class="text-sm text-gray-400">{{ selectedOrder.profiles?.complement }}</p>
                     <p>{{ selectedOrder.profiles?.district }}</p>
                     <p>{{ selectedOrder.profiles?.city }} - {{ selectedOrder.profiles?.state }}</p>
                     <p class="font-mono text-atk-neon font-bold mt-2">{{ selectedOrder.profiles?.cep }}</p>
                  </div>
               </div>
            </div>
            <div>
               <h4 class="text-white font-bold uppercase mb-4 text-sm tracking-widest bg-[#202020] p-2 pl-4 rounded">Itens do Pedido</h4>
               <div class="space-y-3">
                  <div v-for="item in selectedOrder.order_items" :key="item.id" class="flex gap-4 bg-[#1a1a1a] p-4 rounded border border-white/5 items-start">
                     <img :src="item.produtos?.image_cover" class="w-16 h-16 rounded object-contain bg-white/5 border border-white/10">
                     <div class="flex-grow">
                        <p class="font-bold text-lg text-white">{{ item.produtos?.name }}</p>
                        <div class="flex flex-wrap gap-2 mt-2">
                           <span class="bg-white/10 text-white text-xs px-2 py-1 rounded font-bold uppercase">Tam: {{ item.size }}</span>
                           <span class="bg-white/10 text-white text-xs px-2 py-1 rounded font-bold uppercase">Qtd: {{ item.quantity }}</span>
                        </div>
                        <div v-if="item.customization" class="mt-3 bg-atk-neon/5 border border-atk-neon/20 p-2 rounded inline-block">
                           <p class="text-xs text-atk-neon font-bold uppercase mb-1">✨ Personalização:</p>
                           <p class="text-sm text-white">Nome: <strong>{{ item.customization.nome }}</strong> | Número: <strong>{{ item.customization.numero }}</strong></p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <div class="bg-[#202020] p-4 flex justify-end gap-3 border-t border-white/5">
            <button onclick="window.print()" class="bg-white text-black font-bold uppercase px-6 py-2 rounded hover:bg-gray-200 transition">🖨️ Imprimir</button>
            <button @click="atualizarStatusPedido(selectedOrder, 'Enviado')" v-if="selectedOrder?.status === 'Pago'" class="bg-blue-600 text-white font-bold uppercase px-6 py-2 rounded hover:bg-blue-500 transition">Marcar como Enviado</button>
         </div>
       </div>
    </div>

    <div v-if="showStockModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-[#1a1a1a] w-full max-w-md rounded-xl border border-white/10 shadow-2xl p-6">
        <h3 class="text-xl font-bold text-white uppercase mb-1">Ajustar Estoque</h3>
        <p class="text-xs text-gray-400 mb-4">{{ produtoEmEdicaoEstoque?.name }}</p>
        <div class="grid grid-cols-4 gap-2 mb-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          <div v-for="tam in tamanhosGrade" :key="tam" class="bg-[#0f0f0f] p-2 rounded border border-white/5 flex flex-col items-center">
            <span class="text-[10px] font-bold text-gray-500 uppercase mb-1">{{ tam }}</span>
            <input v-model.number="stockForm[tam]" type="number" min="0" class="w-full bg-white/5 border border-white/10 rounded text-center text-white font-bold py-1 focus:border-atk-neon outline-none text-sm"/>
          </div>
        </div>
        <div class="flex gap-3 justify-end">
          <button @click="showStockModal = false" class="px-4 py-2 rounded text-gray-400 hover:text-white text-sm font-bold">Cancelar</button>
          <button @click="salvarEstoque" class="bg-atk-neon text-atk-dark px-6 py-2 rounded font-bold uppercase text-sm hover:bg-white transition">Salvar</button>
        </div>
      </div>
    </div>

    <div v-if="showProductModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       <div class="bg-[#1a1a1a] w-full max-w-4xl rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
         <div class="bg-[#202020] p-4 flex justify-between items-center border-b border-white/5">
           <h3 class="font-bold uppercase text-white">{{ editandoProduto ? 'Editar Produto' : 'Novo Produto' }}</h3>
           <button @click="showProductModal = false" class="text-gray-400 hover:text-white text-2xl">&times;</button>
         </div>
         <div class="p-6 overflow-y-auto custom-scrollbar space-y-6">
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div class="col-span-2 md:col-span-1"><label class="text-xs text-gray-500 font-bold uppercase">Nome do Produto</label><input v-model="formProduto.name" @input="gerarSlug" class="w-full bg-black border border-white/10 rounded p-3 text-white outline-none focus:border-atk-neon"></div>
               <div><label class="text-xs text-gray-500 font-bold uppercase">Slug (URL)</label><input v-model="formProduto.slug" class="w-full bg-black border border-white/10 rounded p-3 text-gray-400 text-xs outline-none"></div>
             </div>
             <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div><label class="text-xs text-gray-500 font-bold uppercase">Custo (R$)</label><input v-model.number="formProduto.price_cost" type="number" step="0.01" class="w-full bg-black border border-white/10 rounded p-3 text-white outline-none focus:border-atk-neon"></div>
               <div><label class="text-xs text-atk-neon font-bold uppercase">Venda (R$)</label><input v-model.number="formProduto.price_sale" type="number" step="0.01" class="w-full bg-black border border-atk-neon/50 rounded p-3 text-atk-neon font-bold outline-none focus:border-atk-neon"></div>
               <div><label class="text-xs text-gray-500 font-bold uppercase">Categoria</label><select v-model="formProduto.category" class="w-full bg-black border border-white/10 rounded p-3 text-white outline-none"><option v-for="c in categorias" :key="c" :value="c">{{ c }}</option></select></div>
               <div><label class="text-xs text-gray-500 font-bold uppercase">Liga</label><select v-model="formProduto.league" class="w-full bg-black border border-white/10 rounded p-3 text-white outline-none"><option v-for="l in ligas" :key="l" :value="l">{{ l }}</option></select></div>
             </div>
             <div class="bg-black/30 p-4 rounded-lg border border-white/5 grid grid-cols-2 gap-4">
                <div class="flex items-center justify-between">
                   <div><p class="font-bold text-sm text-white">Destaque Principal</p><p class="text-xs text-gray-500">Aparece no topo.</p></div>
                   <button @click="formProduto.is_featured = !formProduto.is_featured" class="w-10 h-5 rounded-full relative transition-colors" :class="formProduto.is_featured ? 'bg-yellow-500' : 'bg-gray-700'"><span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform" :class="formProduto.is_featured ? 'translate-x-5' : ''"></span></button>
                </div>
                <div class="flex items-center justify-between">
                   <div><p class="font-bold text-sm text-white">Queridinha da Semana</p><p class="text-xs text-gray-500">Sessão especial.</p></div>
                   <button @click="formProduto.is_queridinha = !formProduto.is_queridinha" class="w-10 h-5 rounded-full relative transition-colors" :class="formProduto.is_queridinha ? 'bg-purple-500' : 'bg-gray-700'"><span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform" :class="formProduto.is_queridinha ? 'translate-x-5' : ''"></span></button>
                </div>
             </div>
             <div>
                <label class="text-xs text-gray-500 font-bold uppercase block mb-2">Capa Principal (URL)</label>
                <input v-model="formProduto.image_cover" class="w-full bg-black border border-white/10 rounded p-3 text-white outline-none focus:border-atk-neon mb-4">
                <label class="text-xs text-gray-500 font-bold uppercase block mb-2">Galeria de Fotos</label>
                <div class="flex gap-2 mb-2">
                   <input v-model="novaFotoUrl" placeholder="URL da imagem..." class="flex-grow bg-black border border-white/10 rounded p-3 text-white text-xs outline-none focus:border-atk-neon">
                   <button @click="addFotoNaGaleria" class="bg-white/10 hover:bg-white/20 text-white px-4 rounded font-bold uppercase text-xs">Adicionar</button>
                </div>
                <div v-if="formProduto.images_gallery.length > 0" class="flex flex-wrap gap-2 mt-2">
                   <div v-for="(img, idx) in formProduto.images_gallery" :key="idx" class="relative w-20 h-20 border border-white/10 rounded bg-black group">
                      <img :src="img" class="w-full h-full object-cover rounded opacity-70 group-hover:opacity-100 transition">
                      <button @click="removerFotoGaleria(idx)" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md hover:scale-110 transition">x</button>
                   </div>
                </div>
             </div>
         </div>
         <div class="p-4 bg-[#202020] border-t border-white/5 text-right"><button @click="salvarProduto" :disabled="salvandoProduto" class="bg-atk-neon text-atk-dark font-bold uppercase px-8 py-3 rounded hover:bg-white transition">{{ salvandoProduto ? 'Salvando...' : 'Salvar Produto' }}</button></div>
       </div>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
.animate-bounce-short { animation: bounceShort 0.5s ease-in-out; }
@keyframes bounceShort { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; border: 2px solid #1a1a1a; }
/* Impressão */
@media print {
  aside, button, input[type="checkbox"] { display: none !important; }
  main { margin: 0; padding: 0; }
  .fixed { position: static; background: white; width: 100%; height: auto; }
  .bg-\[\#151515\], .bg-\[\#1a1a1a\] { background: white !important; color: black !important; border: 1px solid #ccc; box-shadow: none; }
  .text-white { color: black !important; }
  .text-gray-400 { color: #333 !important; }
  .text-atk-neon { color: black !important; font-weight: bold; }
}
</style>
