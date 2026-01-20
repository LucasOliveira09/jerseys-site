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

// CONFIGURAÇÃO
const tamanhosGrade = ['P', 'M', 'G', 'GG', 'XG', '2XL', '16', '18', '20', '22', '24', '26', '28'] // Adulto e Infantil

// CONTROLE MODAL PRODUTO (CRIAÇÃO/EDIÇÃO)
const showProductModal = ref(false)
const editandoProduto = ref(false)
const salvandoProduto = ref(false)
const novaFotoUrl = ref('')
const formProduto = ref({
  id: null, name: '', description: '', price_cost: 0, price_sale: 0,
  image_cover: '', images_gallery: [], category: 'Torcedor', league: 'Brasileirão',
  slug: '', active: true, is_featured: false, stock: {} 
})

// CONTROLE MODAL ESTOQUE (NOVO)
const showStockModal = ref(false)
const stockForm = ref({}) // Objeto temporário para edição { P: 2, M: 0 }
const produtoEmEdicaoEstoque = ref(null)

// CONTROLE MODAL PEDIDOS
const showOrderModal = ref(false)
const selectedOrder = ref(null)

const categorias = ['Torcedor', 'Player', 'Feminino', 'Kids', 'Retrô']
const ligas = ['Brasileirão', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Seleções', 'Outros']

// --- SEGURANÇA E INICIALIZAÇÃO ---
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

// --- LÓGICA DE ESTOQUE POR TAMANHO (NOVA) ---
function abrirModalEstoque(produto) {
  produtoEmEdicaoEstoque.value = produto
  // Cria uma cópia do estoque atual ou inicia zerado
  stockForm.value = { ...produto.stock } || {}
  
  // Garante que todos os tamanhos tenham pelo menos 0 visualmente se já existirem
  tamanhosGrade.forEach(t => {
    if (stockForm.value[t] === undefined) stockForm.value[t] = 0
  })
  
  showStockModal.value = true
}

async function salvarEstoque() {
  try {
    // Limpa tamanhos com 0 para não sujar o banco (opcional, mas bom pra performance)
    const estoqueLimpo = {}
    for (const [tam, qtd] of Object.entries(stockForm.value)) {
      if (qtd > 0) estoqueLimpo[tam] = qtd
    }

    const { error } = await supabase
      .from('produtos')
      .update({ stock: estoqueLimpo })
      .eq('id', produtoEmEdicaoEstoque.value.id)

    if (error) throw error

    // Atualiza localmente
    produtoEmEdicaoEstoque.value.stock = estoqueLimpo
    showStockModal.value = false
    Swal.fire({ icon: 'success', title: 'Estoque Atualizado!', timer: 1000, showConfirmButton: false, background: '#151515', color: '#fff' })
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Erro', text: e.message })
  }
}

// Calcula o total de itens somando todos os tamanhos
function getTotalEstoque(produto) {
  if (!produto.stock) return 0
  return Object.values(produto.stock).reduce((acc, qtd) => acc + Number(qtd), 0)
}

// Gera string bonita ex: "P: 2 | M: 5"
function getEstoqueFormatado(produto) {
  if (!produto.stock) return '-'
  return Object.entries(produto.stock)
    .filter(([_, qtd]) => qtd > 0)
    .map(([tam, qtd]) => `${tam}: ${qtd}`)
    .join(' | ')
}

// --- LÓGICA GERAL (MANTIDA) ---
async function buscarPedidos() {
  const { data, error } = await supabase.from('orders').select(`*, profiles (full_name, email, cpf, phone), order_items (*, produtos (name, image_cover))`).order('created_at', { ascending: false })
  if (!error) orders.value = data
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
}

function verDetalhesPedido(order) {
  selectedOrder.value = order
  showOrderModal.value = true
}

async function buscarProdutos() {
  const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
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
    formProduto.value = { ...produto, images_gallery: galeria, stock: produto.stock || {} }
  } else {
    formProduto.value = { id: null, name: '', description: '', price_cost: 0, price_sale: 0, image_cover: '', images_gallery: [], category: 'Torcedor', league: 'Brasileirão', slug: '', active: true, is_featured: false, stock: {} }
  }
  showProductModal.value = true
}

function gerarSlug() {
  if (!editandoProduto.value) formProduto.value.slug = formProduto.value.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
}

function addFoto() {
  if (novaFotoUrl.value) { formProduto.value.images_gallery.push(novaFotoUrl.value); novaFotoUrl.value = '' }
}

async function salvarProduto() {
  salvandoProduto.value = true
  try {
    const payload = { ...formProduto.value }
    delete payload.id
    payload.images_gallery = payload.images_gallery.filter(x => x)
    // Se for novo, inicializa estoque vazio se não tiver
    if (!payload.stock) payload.stock = {}

    if (editandoProduto.value) await supabase.from('produtos').update(payload).eq('id', formProduto.value.id)
    else await supabase.from('produtos').insert(payload)
    
    await buscarProdutos()
    showProductModal.value = false
    Swal.fire({ icon: 'success', title: 'Salvo!', timer: 1000, showConfirmButton: false, background: '#151515', color: '#fff' })
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Erro', text: e.message })
  } finally {
    salvandoProduto.value = false
  }
}

async function toggleProduto(produto, campo) {
  produto[campo] = !produto[campo]
  await supabase.from('produtos').update({ [campo]: produto[campo] }).eq('id', produto.id)
}

const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR')
const produtosFiltrados = computed(() => !searchProdutos.value ? produtos.value : produtos.value.filter(p => p.name.toLowerCase().includes(searchProdutos.value.toLowerCase())))
const statusClass = (s) => {
  if(s==='Pendente') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
  if(s==='Pago' || s==='Enviado') return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  if(s==='Entregue') return 'text-green-500 bg-green-500/10 border-green-500/20'
  return 'text-red-500 bg-red-500/10 border-red-500/20'
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

        <div v-if="activeTab === 'estoque'" class="animate-fade-in">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-bold uppercase">Controle de Estoque</h2>
            <input v-model="searchProdutos" type="text" placeholder="Buscar produto..." class="bg-[#1a1a1a] border border-white/10 rounded px-4 py-2 text-white outline-none focus:border-atk-neon" />
          </div>
          <div class="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
            <table class="w-full text-left text-sm">
              <thead><tr class="bg-[#202020] text-gray-400 uppercase text-xs"><th class="p-4">Produto</th><th class="p-4 text-center">Status</th><th class="p-4">Disponibilidade (Pronta Entrega)</th><th class="p-4 text-right">Gerenciar</th></tr></thead>
              <tbody>
                <tr v-for="prod in produtosFiltrados" :key="prod.id" class="border-b border-white/5 hover:bg-white/5">
                  <td class="p-4 flex items-center gap-3">
                    <img :src="prod.image_cover" class="w-10 h-10 object-contain bg-white/5 rounded">
                    <div><p class="font-bold">{{ prod.name }}</p><p class="text-xs text-gray-500">{{ prod.league }}</p></div>
                  </td>
                  <td class="p-4 text-center">
                    <span v-if="getTotalEstoque(prod) > 0" class="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold uppercase border border-green-500/30">Disponível</span>
                    <span v-else class="text-gray-600 text-xs font-bold uppercase">Encomenda</span>
                  </td>
                  <td class="p-4">
                    <div v-if="getTotalEstoque(prod) > 0" class="flex flex-wrap gap-1">
                      <span v-for="(qtd, tam) in prod.stock" :key="tam" v-show="qtd > 0" class="text-xs bg-white/10 px-2 py-1 rounded border border-white/10 text-gray-300">
                        <strong class="text-white">{{ tam }}:</strong> {{ qtd }}
                      </span>
                    </div>
                    <span v-else class="text-xs text-gray-600 italic">Sem estoque físico</span>
                  </td>
                  <td class="p-4 text-right">
                    <button @click="abrirModalEstoque(prod)" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold uppercase transition shadow-lg">Editar Qtd.</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="activeTab === 'pedidos'" class="animate-fade-in">
           <h2 class="text-3xl font-bold uppercase mb-6">Pedidos</h2>
           <div class="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
             <table class="w-full text-left text-sm">
               <thead><tr class="bg-[#202020] text-gray-400 uppercase text-xs"><th class="p-4">ID</th><th class="p-4">Cliente</th><th class="p-4">Total</th><th class="p-4">Status</th><th class="p-4 text-right">Ação</th></tr></thead>
               <tbody>
                 <tr v-for="order in orders" :key="order.id" class="border-b border-white/5">
                   <td class="p-4">#{{ String(order.id).slice(0,8) }}</td><td class="p-4">{{ order.profiles?.full_name }}</td><td class="p-4 font-bold text-atk-neon">{{ formatMoney(order.total) }}</td>
                   <td class="p-4"><select :value="order.status" @change="atualizarStatusPedido(order, $event.target.value)" class="bg-[#0f0f0f] border border-white/10 text-xs text-white rounded px-2 py-1"><option value="Pendente">Pendente</option><option value="Pago">Pago</option><option value="Enviado">Enviado</option><option value="Entregue">Entregue</option></select></td>
                   <td class="p-4 text-right"><button @click="verDetalhesPedido(order)" class="bg-white/10 px-3 py-1 rounded text-xs">Ver</button></td>
                 </tr>
               </tbody>
             </table>
           </div>
        </div>

        <div v-if="activeTab === 'produtos'" class="animate-fade-in">
           <div class="flex justify-between items-center mb-6"><h2 class="text-3xl font-bold uppercase">Produtos</h2><button @click="abrirModalProduto()" class="bg-atk-neon text-atk-dark px-4 py-2 rounded font-bold uppercase text-sm">Novo</button></div>
           <div class="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
             <table class="w-full text-left text-sm">
               <thead><tr class="bg-[#202020] text-gray-400 uppercase text-xs"><th class="p-4">Produto</th><th class="p-4">Preço</th><th class="p-4 text-center">Ativo</th><th class="p-4 text-right">Editar</th></tr></thead>
               <tbody>
                 <tr v-for="prod in produtosFiltrados" :key="prod.id" class="border-b border-white/5"><td class="p-4 flex items-center gap-2"><img :src="prod.image_cover" class="w-8 h-8 rounded object-contain bg-white/5">{{ prod.name }}</td><td class="p-4 text-atk-neon font-bold">{{ formatMoney(prod.price_sale) }}</td><td class="p-4 text-center"><button @click="toggleProduto(prod, 'active')" class="w-8 h-4 rounded-full relative" :class="prod.active ? 'bg-green-500' : 'bg-gray-700'"><span class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform" :class="prod.active ? 'translate-x-4' : ''"></span></button></td><td class="p-4 text-right"><button @click="abrirModalProduto(prod)">✏️</button></td></tr>
               </tbody>
             </table>
           </div>
        </div>

      </div>
    </main>

    <div v-if="showStockModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-[#1a1a1a] w-full max-w-md rounded-xl border border-white/10 shadow-2xl p-6">
        <h3 class="text-xl font-bold text-white uppercase mb-1">Ajustar Estoque</h3>
        <p class="text-xs text-gray-400 mb-4">{{ produtoEmEdicaoEstoque?.name }}</p>
        
        <div class="grid grid-cols-3 gap-3 mb-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          <div v-for="tam in tamanhosGrade" :key="tam" class="bg-[#0f0f0f] p-2 rounded border border-white/5 flex flex-col items-center">
            <span class="text-xs font-bold text-gray-500 uppercase mb-1">{{ tam }}</span>
            <input 
              v-model.number="stockForm[tam]" 
              type="number" 
              min="0"
              class="w-full bg-white/5 border border-white/10 rounded text-center text-white font-bold py-1 focus:border-atk-neon outline-none"
            />
          </div>
        </div>

        <div class="flex gap-3 justify-end">
          <button @click="showStockModal = false" class="px-4 py-2 rounded text-gray-400 hover:text-white text-sm font-bold">Cancelar</button>
          <button @click="salvarEstoque" class="bg-atk-neon text-atk-dark px-6 py-2 rounded font-bold uppercase text-sm hover:bg-white transition">Salvar</button>
        </div>
      </div>
    </div>

    <div v-if="showProductModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       <div class="bg-[#1a1a1a] w-full max-w-3xl rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="bg-[#202020] p-4 flex justify-between items-center border-b border-white/5">
            <h3 class="font-bold uppercase text-white">{{ editandoProduto ? 'Editar Produto' : 'Novo Produto' }}</h3>
            <button @click="showProductModal = false" class="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>
          <div class="p-6 overflow-y-auto custom-scrollbar space-y-4">
             <div class="grid grid-cols-2 gap-4">
               <div><label class="text-xs text-gray-500 font-bold uppercase">Nome</label><input v-model="formProduto.name" @input="gerarSlug" class="w-full bg-black border border-white/10 rounded p-2 text-white outline-none focus:border-atk-neon"></div>
               <div><label class="text-xs text-gray-500 font-bold uppercase">Slug</label><input v-model="formProduto.slug" class="w-full bg-black border border-white/10 rounded p-2 text-gray-400 text-xs outline-none"></div>
             </div>
             <div><label class="text-xs text-gray-500 font-bold uppercase">Capa (URL)</label><input v-model="formProduto.image_cover" class="w-full bg-black border border-white/10 rounded p-2 text-white outline-none focus:border-atk-neon"></div>
             <div class="grid grid-cols-3 gap-4">
               <div><label class="text-xs text-gray-500 font-bold uppercase">Preço Custo</label><input v-model="formProduto.price_cost" type="number" class="w-full bg-black border border-white/10 rounded p-2 text-white"></div>
               <div><label class="text-xs text-atk-neon font-bold uppercase">Preço Venda</label><input v-model="formProduto.price_sale" type="number" class="w-full bg-black border border-atk-neon/50 rounded p-2 text-atk-neon font-bold"></div>
               <div><label class="text-xs text-gray-500 font-bold uppercase">Categoria</label><select v-model="formProduto.category" class="w-full bg-black border border-white/10 rounded p-2 text-white"><option v-for="c in categorias" :key="c" :value="c">{{ c }}</option></select></div>
             </div>
          </div>
          <div class="p-4 bg-[#202020] border-t border-white/5 text-right"><button @click="salvarProduto" :disabled="salvandoProduto" class="bg-atk-neon text-atk-dark font-bold uppercase px-6 py-2 rounded hover:bg-white transition">{{ salvandoProduto ? 'Salvando...' : 'Salvar' }}</button></div>
       </div>
    </div>

    <div v-if="showOrderModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       <div class="bg-[#1a1a1a] w-full max-w-2xl rounded-xl border border-white/10 shadow-2xl p-6">
          <div class="flex justify-between mb-4"><h3 class="font-bold text-white uppercase">Detalhes do Pedido</h3><button @click="showOrderModal = false">X</button></div>
          <div v-if="selectedOrder" class="space-y-4">
             <div v-for="item in selectedOrder.order_items" :key="item.id" class="flex gap-3 items-center bg-white/5 p-2 rounded"><img :src="item.produtos?.image_cover" class="w-10 h-10 rounded"><div><p class="font-bold text-sm">{{ item.produtos?.name }}</p><p class="text-xs text-gray-400">Tam: {{ item.size }}</p></div></div>
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