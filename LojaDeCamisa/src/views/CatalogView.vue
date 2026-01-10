<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { supabase } from '../supabase'
import ProductCard from '../components/ProductCard.vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// --- ESTADOS ---
const produtos = ref([])
const carregando = ref(false)
const erro = ref('')

// Controle de Paginação e Rolagem Infinita
const pagina = ref(0)
const itensPorPagina = 24 // AUMENTADO: Carrega mais itens de uma vez
const temMais = ref(true)
const loadTrigger = ref(null) // O elemento "sentinela" no fim da página
let observer = null // O observador de rolagem

// Filtros
const abaAtiva = ref('torcedor')
const filtroLiga = ref('')
const filtroTexto = ref('')
const ordenacao = ref('padrao')

const ligasDisponiveis = [
  'Brasileirão', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Seleções', 'Outros'
]

// --- FUNÇÃO DE BUSCA OTIMIZADA ---
async function buscarProdutos(novaBusca = false) {
  // Evita chamadas duplicadas se já estiver carregando ou se acabou os itens
  if (carregando.value || (!temMais.value && !novaBusca)) return

  try {
    carregando.value = true
    erro.value = ''

    if (novaBusca) {
      produtos.value = []
      pagina.value = 0
      temMais.value = true
    }

    const inicio = pagina.value * itensPorPagina
    const fim = inicio + itensPorPagina - 1

    // 1. QUERY BASE
    let query = supabase
      .from('produtos') // CERTIFIQUE-SE: 'products' ou 'produtos' conforme seu banco
      .select('*')
      .eq('active', true)
      .range(inicio, fim)

    // 2. APLICAÇÃO DOS FILTROS
    if (filtroTexto.value) {
      const termo = `%${filtroTexto.value}%`
      query = query.or(`name.ilike.${termo},league.ilike.${termo},category.ilike.${termo}`)
    } 
    else {
      if (abaAtiva.value === 'torcedor') {
        query = query
          .neq('category', 'Kids')
          .neq('category', 'Retrô')
          .neq('category', 'Retro')
          .neq('category', 'Feminino')
          .neq('category', 'Feminina')
          .neq('category', 'Women')
          .neq('category', 'women')
          .not('name', 'ilike', '%Player%')
      }
      else if (abaAtiva.value === 'feminino') {
        query = query.or('category.eq.Feminino,category.eq.Feminina,category.eq.Women,category.eq.women,name.ilike.%Women%,name.ilike.%Feminin%')
      }
      else if (abaAtiva.value === 'kids') {
        query = query.eq('category', 'Kids')
      }
      else if (abaAtiva.value === 'player') {
        query = query.or('category.eq.Player,name.ilike.%Player%')
      }
      else if (abaAtiva.value === 'retro') {
        query = query.or('category.eq.Retrô,category.eq.Retro')
      }

      if (filtroLiga.value) {
        query = query.ilike('league', `%${filtroLiga.value}%`)
      }
    }

    // 3. ORDENAÇÃO
    if (ordenacao.value === 'menor-preco') {
      query = query.order('price_sale', { ascending: true })
    } else if (ordenacao.value === 'maior-preco') {
      query = query.order('price_sale', { ascending: false })
    } else if (ordenacao.value === 'alfabetica') {
      query = query.order('name', { ascending: true })
    }

    const { data, error } = await query

    if (error) throw error

    // Se vier menos itens do que pedimos, significa que acabou o estoque
    if (data.length < itensPorPagina) {
      temMais.value = false
    }

    produtos.value.push(...data)
    pagina.value++

  } catch (err) {
    console.error('Erro ao buscar:', err)
    erro.value = 'Erro ao carregar produtos.'
  } finally {
    carregando.value = false
  }
}

// --- LÓGICA DO INFINITE SCROLL ---
function configurarObserver() {
  const options = {
    root: null, // Janela do navegador
    rootMargin: '100px', // Carrega 100px ANTES de chegar no final
    threshold: 0.1
  }

  observer = new IntersectionObserver((entries) => {
    const target = entries[0]
    // Se o elemento ficou visível E temos mais itens E não estamos carregando
    if (target.isIntersecting && temMais.value && !carregando.value) {
      buscarProdutos(false)
    }
  }, options)

  if (loadTrigger.value) {
    observer.observe(loadTrigger.value)
  }
}

// --- CONTROLE DE URL E ESTADO ---
function lerParametrosURL() {
  let mudouAlgo = false
  if (route.query.q && route.query.q !== filtroTexto.value) {
    filtroTexto.value = route.query.q
    abaAtiva.value = 'todos'
    filtroLiga.value = ''
    mudouAlgo = true
  } 
  else if (route.query.liga && route.query.liga !== filtroLiga.value) {
    filtroLiga.value = route.query.liga
    abaAtiva.value = 'torcedor'
    filtroTexto.value = ''
    mudouAlgo = true
  }

  if (mudouAlgo || produtos.value.length === 0) {
    buscarProdutos(true)
  }
}

function setAba(novaAba) {
  if (abaAtiva.value !== novaAba) {
    abaAtiva.value = novaAba
    filtroTexto.value = ''
  }
}

watch([abaAtiva, filtroLiga, filtroTexto, ordenacao], () => {
  buscarProdutos(true)
})

watch(() => route.query, () => {
  lerParametrosURL()
})

onMounted(() => {
  // 1. Verifica URL ou carrega padrão
  if (!route.query.q && !route.query.liga) {
    buscarProdutos(true)
  } else {
    lerParametrosURL()
  }
  
  // 2. Inicia o "Olheiro" do Scroll
  // setTimeout garante que o DOM renderizou o elemento loadTrigger
  setTimeout(() => {
    configurarObserver()
  }, 500)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<template>
  <div class="min-h-screen bg-atk-dark text-white pb-20 font-sans">
    
    <div class="bg-[#1a1a1a] border-b border-white/10 pt-10 pb-6 mb-8">
      <div class="max-w-7xl mx-auto px-4 text-center">
        
        <div v-if="filtroTexto" class="mb-6 animate-fade-in">
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
            v-for="aba in ['torcedor', 'feminino', 'kids', 'player', 'retro']"
            :key="aba"
            @click="setAba(aba)"
            class="px-6 py-3 rounded-lg font-extrabold uppercase text-xs md:text-sm tracking-widest transition-all border border-transparent"
            :class="abaAtiva === aba 
              ? 'bg-atk-neon text-atk-dark shadow-[0_0_20px_rgba(0,255,194,0.4)] scale-105' 
              : 'bg-[#252525] text-gray-400 hover:text-white hover:border-atk-neon/50'"
          >
            {{ aba }}
          </button>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4">
      
      <div class="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 bg-[#151515] p-4 rounded border border-white/5 shadow-lg">
        
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
            {{ produtos.length }} Exibidos
          </div>
          <select v-model="ordenacao" class="bg-[#2a2a2a] text-white border border-white/10 rounded px-4 py-2 focus:border-atk-neon outline-none cursor-pointer uppercase text-xs font-bold tracking-wide transition hover:border-white/30">
            <option value="padrao">Relevância</option>
            <option value="menor-preco">Menor Preço</option>
            <option value="maior-preco">Maior Preço</option>
            <option value="alfabetica">A - Z</option>
          </select>
        </div>
      </div>

      <div v-if="produtos.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-8">
        <ProductCard 
          v-for="produto in produtos" 
          :key="produto.id" 
          :product="produto" 
        />
      </div>

      <div v-if="!carregando && produtos.length === 0" class="text-center py-24 bg-[#151515] rounded-lg border border-dashed border-white/10">
        <p class="text-3xl mb-4">😶</p>
        <h3 class="text-xl font-bold text-white mb-2">Nenhum produto encontrado</h3>
        <p class="text-gray-400 text-sm">
          {{ filtroTexto ? 'Tente verificar a ortografia.' : 'Tente limpar os filtros.' }}
        </p>
      </div>

      <div ref="loadTrigger" class="py-10 text-center w-full">
        <div v-if="carregando && temMais" class="inline-flex flex-col items-center">
          <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-atk-neon mb-2"></div>
          <span class="text-xs text-gray-500 uppercase tracking-widest">Carregando mais...</span>
        </div>
        
        <div v-if="!temMais && produtos.length > 0" class="text-gray-600 text-xs uppercase tracking-widest mt-4">
          Você chegou ao fim da lista 🏁
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>