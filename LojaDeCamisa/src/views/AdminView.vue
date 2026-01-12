<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const produtos = ref([])
const loading = ref(true)
const search = ref('')

// Controle do Modal
const showModal = ref(false)
const salvando = ref(false)
const editando = ref(false) 

// Campo temporário para adicionar nova foto
const novaFotoUrl = ref('')

// Formulário
const form = ref({
  id: null,
  name: '',
  description: '',
  price_cost: 0,
  price_sale: 0,
  image_cover: '',
  images_gallery: [], 
  category: 'Torcedor',
  league: 'Brasileirão',
  slug: '',
  active: true
})

const categorias = ['Torcedor', 'Player', 'Feminino', 'Kids', 'Retrô']
const ligas = ['Brasileirão', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Seleções', 'Outros']

onMounted(async () => {
  listarProdutos()
})

async function listarProdutos() {
  loading.value = true
  // Traz tudo ordenado por data
  const { data, error } = await supabase
    .from('produtos') // Confirme se é 'produtos' ou 'products'
    .select('*')
    .order('created_at', { ascending: false })

  if (error) console.error(error)
  else produtos.value = data
  loading.value = false
}

// --- GERENCIAMENTO DE GALERIA ---

function adicionarFotoGaleria() {
  if (novaFotoUrl.value.trim()) {
    form.value.images_gallery.push(novaFotoUrl.value.trim())
    novaFotoUrl.value = ''
  }
}

function removerFotoGaleria(index) {
  form.value.images_gallery.splice(index, 1)
}

// --- FUNÇÕES DO MODAL ---

function abrirNovo() {
  editando.value = false
  novaFotoUrl.value = ''
  form.value = {
    id: null,
    name: '',
    description: '',
    price_cost: 0,
    price_sale: 0,
    image_cover: '',
    images_gallery: [],
    category: 'Torcedor',
    league: 'Brasileirão',
    slug: '',
    active: true
  }
  showModal.value = true
}

function abrirEdicao(produto) {
  editando.value = true
  novaFotoUrl.value = ''
  
  // Lógica blindada para ler a galeria (seja texto ou array)
  let galeria = []
  try {
    if (Array.isArray(produto.images_gallery)) {
      galeria = [...produto.images_gallery]
    } else if (typeof produto.images_gallery === 'string') {
      // Tenta converter se estiver salvo como texto antigo
      // Se a string começar com { (formato postgres) ou [ (formato json)
      const limparString = produto.images_gallery.replace(/^{|}$/g, '') // Remove chaves do postgres se houver
      if (produto.images_gallery.startsWith('[')) {
         galeria = JSON.parse(produto.images_gallery)
      } else {
         galeria = limparString.split(',').map(s => s.replace(/"/g, '').trim())
      }
    }
  } catch (e) {
    console.error('Erro ao ler galeria', e)
    galeria = []
  }

  form.value = { 
    ...produto,
    images_gallery: galeria.filter(g => g) // Remove vazios
  }
  showModal.value = true
}

function gerarSlug() {
  if (!editando.value) {
    form.value.slug = form.value.name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
  }
}

async function salvarProduto() {
  try {
    salvando.value = true

    // Remove links vazios
    const galeriaLimpa = form.value.images_gallery.filter(link => link && link.trim() !== '')

    const dados = {
      name: form.value.name,
      description: form.value.description,
      price_cost: form.value.price_cost,
      price_sale: form.value.price_sale,
      image_cover: form.value.image_cover,
      
      // --- CORREÇÃO AQUI: Enviamos o array direto, sem JSON.stringify ---
      images_gallery: galeriaLimpa, 
      
      category: form.value.category,
      league: form.value.league,
      slug: form.value.slug,
      active: form.value.active
    }

    let error = null
    if (editando.value) {
      const res = await supabase.from('produtos').update(dados).eq('id', form.value.id)
      error = res.error
    } else {
      const res = await supabase.from('produtos').insert([dados])
      error = res.error
    }

    if (error) throw error

    alert(editando.value ? 'Produto atualizado!' : 'Produto criado!')
    showModal.value = false
    listarProdutos()

  } catch (err) {
    console.error(err)
    alert('Erro ao salvar: ' + err.message)
  } finally {
    salvando.value = false
  }
}

async function deletarProduto() {
  if (confirm('Tem certeza que deseja EXCLUIR este produto?')) {
    await supabase.from('produtos').delete().eq('id', form.value.id)
    showModal.value = false
    listarProdutos()
  }
}

async function toggleStatus(produto, campo) {
  const novoValor = !produto[campo]
  produto[campo] = novoValor
  await supabase.from('produtos').update({ [campo]: novoValor }).eq('id', produto.id)
}

const produtosFiltrados = computed(() => {
  if (!search.value) return produtos.value
  return produtos.value.filter(p => p.name.toLowerCase().includes(search.value.toLowerCase()))
})
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] text-white p-6 font-sans relative">
    
    <div class="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
      <h1 class="text-2xl font-bold text-atk-neon uppercase">Painel Gerencial</h1>
      
      <div class="flex gap-4 w-full md:w-auto">
        <input v-model="search" type="text" placeholder="Buscar..." class="bg-[#1a1a1a] border border-white/10 rounded px-4 py-2 text-white outline-none focus:border-atk-neon w-full"/>
        <button @click="abrirNovo" class="bg-atk-neon text-atk-dark px-4 py-2 rounded font-bold hover:bg-white transition whitespace-nowrap">+ Novo Produto</button>
        <router-link to="/" class="bg-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-600 whitespace-nowrap flex items-center">Loja</router-link>
      </div>
    </div>

    <div class="max-w-7xl mx-auto bg-[#151515] rounded-xl border border-white/5 overflow-hidden shadow-2xl mb-20">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr class="bg-[#202020] text-gray-400 uppercase text-xs">
              <th class="p-4">Capa</th>
              <th class="p-4">Nome</th>
              <th class="p-4 text-center">Preço</th>
              <th class="p-4 text-center">Destaques</th>
              <th class="p-4 text-center">Ativo</th>
              <th class="p-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in produtosFiltrados" :key="item.id" class="border-b border-white/5 hover:bg-white/5 transition">
              <td class="p-4"><img :src="item.image_cover" class="w-12 h-12 object-contain bg-white/5 rounded border border-white/10" /></td>
              <td class="p-4">
                <div class="font-bold text-white truncate max-w-[200px]" :title="item.name">{{ item.name }}</div>
                <div class="text-[10px] text-gray-500 uppercase">{{ item.league }} | {{ item.category }}</div>
              </td>
              <td class="p-4 text-center text-atk-neon font-bold">R$ {{ item.price_sale }}</td>
              <td class="p-4 flex justify-center gap-2">
                <button @click="toggleStatus(item, 'is_featured')" title="Home Topo" class="w-8 h-8 rounded border flex items-center justify-center transition-all" :class="item.is_featured ? 'bg-yellow-500 border-yellow-500 text-black' : 'border-gray-700 text-gray-700 opacity-50 hover:opacity-100'">⭐</button>
                <button @click="toggleStatus(item, 'is_trending')" title="Queridinha" class="w-8 h-8 rounded border flex items-center justify-center transition-all" :class="item.is_trending ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-700 text-gray-700 opacity-50 hover:opacity-100'">💜</button>
                <button @click="toggleStatus(item, 'is_brasileirao_featured')" title="Brasileirão" class="w-8 h-8 rounded border flex items-center justify-center transition-all" :class="item.is_brasileirao_featured ? 'bg-green-600 border-green-600 text-white' : 'border-gray-700 text-gray-700 opacity-50 hover:opacity-100'">🇧🇷</button>
                <button @click="toggleStatus(item, 'is_selecoes_featured')" title="Seleções" class="w-8 h-8 rounded border flex items-center justify-center transition-all" :class="item.is_selecoes_featured ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-700 text-gray-700 opacity-50 hover:opacity-100'">🌍</button>
              </td>
              <td class="p-4 text-center">
                <button @click="toggleStatus(item, 'active')" class="px-2 py-1 rounded text-[10px] font-bold uppercase w-12" :class="item.active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'">{{ item.active ? 'ON' : 'OFF' }}</button>
              </td>
              <td class="p-4 text-right">
                <button @click="abrirEdicao(item)" class="bg-[#333] hover:bg-atk-neon hover:text-atk-dark text-white p-2 rounded transition shadow-lg">✏️ Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-[#1a1a1a] w-full max-w-4xl rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div class="bg-[#202020] p-4 border-b border-white/5 flex justify-between items-center">
          <h2 class="text-xl font-bold text-white uppercase tracking-wider">{{ editando ? 'Editar Produto' : 'Novo Produto' }}</h2>
          <button @click="showModal = false" class="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div class="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 uppercase font-bold mb-1">Nome</label>
              <input v-model="form.name" @input="gerarSlug" type="text" class="w-full bg-[#0f0f0f] border border-white/10 rounded px-3 py-2 text-white focus:border-atk-neon outline-none" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 uppercase font-bold mb-1">Slug</label>
              <input v-model="form.slug" type="text" class="w-full bg-[#0f0f0f] border border-white/10 rounded px-3 py-2 text-gray-400 focus:border-atk-neon outline-none text-xs" />
            </div>
          </div>

          <div>
            <label class="block text-xs text-gray-500 uppercase font-bold mb-1">Capa Principal (Link)</label>
            <div class="flex gap-4 items-center">
              <input v-model="form.image_cover" type="text" class="flex-grow bg-[#0f0f0f] border border-white/10 rounded px-3 py-2 text-white focus:border-atk-neon outline-none" />
              <div class="w-10 h-10 bg-white/5 rounded border border-white/10 overflow-hidden flex-shrink-0">
                <img v-if="form.image_cover" :src="form.image_cover" class="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          <div class="bg-[#101010] p-4 rounded border border-white/5">
            <label class="block text-xs text-atk-neon uppercase font-bold mb-3">Gerenciar Galeria ({{ form.images_gallery.length }} fotos)</label>
            
            <div class="space-y-3 mb-4">
               <div v-for="(foto, index) in form.images_gallery" :key="index" class="flex items-center gap-3">
                 <div class="w-10 h-10 bg-white/5 rounded border border-white/10 overflow-hidden flex-shrink-0">
                    <img :src="foto" class="w-full h-full object-contain" />
                 </div>
                 <input 
                   v-model="form.images_gallery[index]" 
                   type="text" 
                   class="flex-grow bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-gray-300 text-xs focus:border-atk-neon outline-none"
                 />
                 <button @click="removerFotoGaleria(index)" class="text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 p-2 rounded transition">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                 </button>
               </div>
            </div>

            <div class="flex gap-2 border-t border-white/5 pt-3">
              <input 
                v-model="novaFotoUrl" 
                type="text" 
                placeholder="Cole o link de uma nova foto aqui e aperte Enter..." 
                class="flex-grow bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white text-xs focus:border-atk-neon outline-none"
                @keyup.enter="adicionarFotoGaleria"
              />
              <button 
                @click="adicionarFotoGaleria"
                class="bg-gray-700 hover:bg-atk-neon hover:text-atk-dark text-white px-3 py-2 rounded text-xs font-bold uppercase"
              >
                Adicionar
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 uppercase font-bold mb-1">Preço Custo</label>
              <input v-model="form.price_cost" type="number" step="0.01" class="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:border-atk-neon outline-none" />
            </div>
            <div>
              <label class="block text-xs text-atk-neon uppercase font-bold mb-1">Preço Venda</label>
              <input v-model="form.price_sale" type="number" step="0.01" class="w-full bg-[#1a1a1a] border border-atk-neon/50 rounded px-3 py-2 text-atk-neon font-bold focus:border-atk-neon outline-none" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 uppercase font-bold mb-1">Categoria</label>
              <select v-model="form.category" class="w-full bg-[#0f0f0f] border border-white/10 rounded px-3 py-2 text-white focus:border-atk-neon outline-none">
                <option v-for="cat in categorias" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 uppercase font-bold mb-1">Liga</label>
              <select v-model="form.league" class="w-full bg-[#0f0f0f] border border-white/10 rounded px-3 py-2 text-white focus:border-atk-neon outline-none">
                <option v-for="liga in ligas" :key="liga" :value="liga">{{ liga }}</option>
              </select>
            </div>
          </div>

        </div>

        <div class="bg-[#202020] p-4 border-t border-white/5 flex justify-between items-center">
          <button v-if="editando" @click="deletarProduto" type="button" class="text-red-500 text-xs font-bold hover:text-red-400 uppercase tracking-widest">Excluir Produto</button>
          <div v-else></div>

          <div class="flex gap-3">
            <button @click="showModal = false" class="px-4 py-2 rounded text-gray-400 hover:text-white font-bold transition">Cancelar</button>
            <button 
              @click="salvarProduto" 
              :disabled="salvando"
              class="bg-atk-neon text-atk-dark px-6 py-2 rounded font-extrabold uppercase tracking-widest hover:bg-white hover:scale-105 transition disabled:opacity-50"
            >
              {{ salvando ? 'Salvando...' : 'Salvar Alterações' }}
            </button>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
</style>