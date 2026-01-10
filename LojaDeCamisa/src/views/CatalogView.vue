<script setup>
import { ref, computed, onMounted, watch } from 'vue' // <--- Adicionei watch
import { supabase } from '../supabase'
import ProductCard from '../components/ProductCard.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const produtos = ref([])
const carregando = ref(true)

// Estados dos Filtros
const abaAtiva = ref('torcedor')
const filtroLiga = ref('')
const filtroTexto = ref('') // <--- NOVO: Para a busca da lupa
const ordenacao = ref('padrao')

const ligasDisponiveis = [
  'Brasileirão', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Seleções', 'Outros'
]

async function buscarTodosProdutos() {
  try {
    carregando.value = true
    const { data, error } = await supabase
      .from('produtos') // Confirme se sua tabela é 'produtos' ou 'products'
      .select('*')
      .eq('active', true)

    if (error) throw error
    produtos.value = data

    // Verifica a URL assim que carrega
    lerParametrosURL()
  } catch (erro) {
    console.error('Erro ao carregar catálogo:', erro)
  } finally {
    carregando.value = false
  }
}

// Função que lê a URL para ativar filtros ou busca
function lerParametrosURL() {
  // 1. Se tiver busca por texto (?q=flamengo)
  if (route.query.q) {
    filtroTexto.value = route.query.q
    abaAtiva.value = 'todos' // Reseta abas
    filtroLiga.value = ''
  } 
  // 2. Se tiver filtro de liga (?liga=brasileirao)
  else if (route.query.liga) {
    filtroLiga.value = route.query.liga
    abaAtiva.value = 'torcedor'
    filtroTexto.value = ''
  }
}

// Ouve mudanças na URL (para funcionar se pesquisar duas vezes seguidas)
watch(() => route.query, () => {
  lerParametrosURL()
})

// LÓGICA DE FILTRAGEM
const produtosFiltrados = computed(() => {
  let lista = [...produtos.value]

  // 0. FILTRO DE BUSCA (Prioridade Máxima)
  if (filtroTexto.value) {
    const termo = filtroTexto.value.toLowerCase()
    // Procura no nome, liga ou categoria
    lista = lista.filter(p => 
      p.name.toLowerCase().includes(termo) || 
      p.league.toLowerCase().includes(termo) ||
      (p.category && p.category.toLowerCase().includes(termo))
    )
    return lista // Se tem busca, ignora as abas abaixo
  }

  // 1. FILTRO DAS ABAS
  if (abaAtiva.value === 'torcedor') {
    // Torcedor = Padrão (Exclui Kids, Player, Retrô e Feminino)
    lista = lista.filter(p => 
      p.category !== 'Kids' && 
      p.category !== 'Retrô' && 
      p.category !== 'Retro' &&
      p.category !== 'Feminino' && 
      p.category !== 'Feminina' &&
      p.category !== 'women' && 
      p.category !== 'Women' &&
      !p.name.toUpperCase().includes('PLAYER')
    )
  } 
  else if (abaAtiva.value === 'feminino') {
    lista = lista.filter(p => 
      p.category === 'women' || 
      p.category === 'Women' ||
      p.category === 'Feminino' || 
      p.category === 'Feminina' ||
      p.name.toUpperCase().includes('WOMEN') ||
      p.name.toUpperCase().includes('FEMININ')
    )
  }
  else if (abaAtiva.value === 'player') {
    lista = lista.filter(p => 
      p.category === 'Player' || 
      p.name.toUpperCase().includes('PLAYER')
    )
  } 
  else if (abaAtiva.value === 'kids') {
    lista = lista.filter(p => p.category === 'Kids')
  } 
  else if (abaAtiva.value === 'retro') {
    lista = lista.filter(p => p.category === 'Retrô' || p.category === 'Retro')
  }

  // 2. FILTRO DE LIGA
  if (filtroLiga.value) {
    lista = lista.filter(p => p.league && p.league.includes(filtroLiga.value))
  }

  // 3. ORDENAÇÃO
  if (ordenacao.value === 'menor-preco') {
    lista.sort((a, b) => a.price_sale - b.price_sale)
  } else if (ordenacao.value === 'maior-preco') {
    lista.sort((a, b) => b.price_sale - a.price_sale)
  } else if (ordenacao.value === 'alfabetica') {
    lista.sort((a, b) => a.name.localeCompare(b.name))
  }

  return lista
})

function setAba(novaAba) {
  abaAtiva.value = novaAba
  filtroTexto.value = '' // Limpa a busca se clicar numa aba
}

onMounted(() => {
  buscarTodosProdutos()
})
</script>

<template>
  <div class="min-h-screen bg-atk-dark text-white pb-20 font-sans">
    
    <div class="bg-[#1a1a1a] border-b border-white/10 pt-10 pb-6 mb-8">
      <div class="max-w-7xl mx-auto px-4 text-center">
        
        <div v-if="filtroTexto" class="mb-6">
          <p class="text-gray-400 uppercase tracking-widest text-sm">Resultados para:</p>
          <h1 class="text-3xl md:text-4xl font-extrabold text-atk-neon">"{{ filtroTexto }}"</h1>
          <button @click="filtroTexto = ''; abaAtiva = 'torcedor'" class="mt-2 text-sm text-white hover:text-red-400 underline cursor-pointer">
            Limpar Busca
          </button>
        </div>

        <div v-else>
          <h1 class="text-3xl md:text-5xl font-extrabold uppercase tracking-tighter mb-2">
            Catálogo <span class="text-atk-neon">Oficial</span>
          </h1>
          <p class="text-gray-400 text-sm md:text-base mb-8">Escolha sua versão favorita</p>
        </div>

        <div v-if="!filtroTexto" class="flex flex-wrap justify-center gap-3">
          
          <button 
            @click="setAba('torcedor')"
            class="px-6 py-3 rounded-lg font-extrabold uppercase text-xs md:text-sm tracking-widest transition-all border border-transparent"
            :class="abaAtiva === 'torcedor' 
              ? 'bg-atk-neon text-atk-dark shadow-[0_0_20px_rgba(0,255,194,0.4)] scale-105' 
              : 'bg-[#252525] text-gray-400 hover:text-white hover:border-atk-neon/50'"
          >
            Torcedor
          </button>

          <button 
            @click="setAba('feminino')"
            class="px-6 py-3 rounded-lg font-extrabold uppercase text-xs md:text-sm tracking-widest transition-all border border-transparent"
            :class="abaAtiva === 'feminino' 
              ? 'bg-atk-neon text-atk-dark shadow-[0_0_20px_rgba(0,255,194,0.4)] scale-105' 
              : 'bg-[#252525] text-gray-400 hover:text-white hover:border-atk-neon/50'"
          >
            Feminino
          </button>

          <button 
            @click="setAba('kids')"
            class="px-6 py-3 rounded-lg font-extrabold uppercase text-xs md:text-sm tracking-widest transition-all border border-transparent"
            :class="abaAtiva === 'kids' 
              ? 'bg-atk-neon text-atk-dark shadow-[0_0_20px_rgba(0,255,194,0.4)] scale-105' 
              : 'bg-[#252525] text-gray-400 hover:text-white hover:border-atk-neon/50'"
          >
            Kids
          </button>

          <button 
            @click="setAba('player')"
            class="px-6 py-3 rounded-lg font-extrabold uppercase text-xs md:text-sm tracking-widest transition-all border border-transparent"
            :class="abaAtiva === 'player' 
              ? 'bg-atk-neon text-atk-dark shadow-[0_0_20px_rgba(0,255,194,0.4)] scale-105' 
              : 'bg-[#252525] text-gray-400 hover:text-white hover:border-atk-neon/50'"
          >
            Player
          </button>

          <button 
            @click="setAba('retro')"
            class="px-6 py-3 rounded-lg font-extrabold uppercase text-xs md:text-sm tracking-widest transition-all border border-transparent"
            :class="abaAtiva === 'retro' 
              ? 'bg-atk-neon text-atk-dark shadow-[0_0_20px_rgba(0,255,194,0.4)] scale-105' 
              : 'bg-[#252525] text-gray-400 hover:text-white hover:border-atk-neon/50'"
          >
            Retrô
          </button>

        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4">
      
      <div class="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 bg-[#151515] p-4 rounded border border-white/5">
        
        <div class="w-full md:w-auto flex items-center gap-3">
          <span class="text-xs font-bold text-atk-neon uppercase tracking-widest hidden md:block">Filtrar Liga:</span>
          <select 
            v-model="filtroLiga" 
            class="w-full md:w-auto bg-[#2a2a2a] text-white border border-white/10 rounded px-4 py-2 focus:border-atk-neon outline-none cursor-pointer uppercase text-xs font-bold tracking-wide transition hover:border-white/30"
          >
            <option value="">Todas as Ligas</option>
            <option v-for="liga in ligasDisponiveis" :key="liga" :value="liga">{{ liga }}</option>
          </select>
        </div>

        <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div class="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
            {{ produtosFiltrados.length }} Produtos
          </div>
          
          <select v-model="ordenacao" class="bg-[#2a2a2a] text-white border border-white/10 rounded px-4 py-2 focus:border-atk-neon outline-none cursor-pointer uppercase text-xs font-bold tracking-wide transition hover:border-white/30">
            <option value="padrao">Relevância</option>
            <option value="menor-preco">Menor Preço</option>
            <option value="maior-preco">Maior Preço</option>
            <option value="alfabetica">A - Z</option>
          </select>
        </div>
      </div>

      <div v-if="carregando" class="text-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-atk-neon mx-auto mb-4"></div>
      </div>

      <div v-else>
        <div v-if="produtosFiltrados.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          <ProductCard 
            v-for="produto in produtosFiltrados" 
            :key="produto.id" 
            :product="produto" 
          />
        </div>

        <div v-else class="text-center py-24 bg-[#151515] rounded-lg border border-dashed border-white/10">
          <p class="text-3xl mb-4">😶</p>
          <h3 class="text-xl font-bold text-white mb-2">Nenhum produto encontrado</h3>
          <p class="text-gray-400 text-sm">
            {{ filtroTexto ? 'Tente verificar a ortografia.' : 'Tente limpar os filtros.' }}
          </p>
        </div>
      </div>

    </div>
  </div>
</template>