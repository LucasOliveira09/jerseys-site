<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase'
import Section from '../components/Section.vue'

const produtos = ref([])
const carregando = ref(true)

async function buscarProdutos() {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('active', true)

    if (error) throw error
    produtos.value = data
  } catch (err) {
    console.error('Erro ao buscar produtos:', err)
  } finally {
    carregando.value = false
  }
}

onMounted(buscarProdutos)

/* ===== LÓGICA DE FILTROS PELOS CHECKBOXES ===== */

// 1. DESTAQUES (Topo) - Checkbox: is_featured
const destaques = computed(() =>
  produtos.value.filter(p => p.is_featured).slice(0, 8)
)

// 2. QUERIDINHAS - Checkbox: is_trending
const queridinhas = computed(() =>
  produtos.value.filter(p => p.is_trending).slice(0, 8)
)

// 3. BRASILEIRÃO - Checkbox: is_brasileirao_featured
const brasileirao = computed(() =>
  produtos.value.filter(p => p.is_brasileirao_featured).slice(0, 4) // Pega 4 para o Grid
)

// 4. SELEÇÕES - Checkbox: is_selecoes_featured
const selecoes = computed(() =>
  produtos.value.filter(p => p.is_selecoes_featured).slice(0, 4) // Pega 4 para o Grid
)
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] text-white overflow-x-hidden font-sans">
    
    <div class="bg-atk-neon text-atk-dark py-2 overflow-hidden relative z-20">
      <div class="animate-marquee whitespace-nowrap flex gap-10 font-bold uppercase text-xs tracking-widest">
        <span>⚡ Frete Grátis para todo Brasil em compras acima de R$ 399</span>
        <span>🔥 Personalização Grátis na primeira compra</span>
        <span>💳 Parcelamento em até 12x no cartão</span>
        <span>⚽ Lançamentos da temporada 24/25 já disponíveis</span>
        <span>⚡ Frete Grátis para todo Brasil em compras acima de R$ 399</span>
      </div>
    </div>

    <section class="relative h-[600px] lg:h-[750px] flex items-center justify-center overflow-hidden group">
      <div class="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] ease-linear group-hover:scale-110 opacity-40" 
           style="background-image: url('https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2000&auto=format&fit=crop')">
      </div>
      <div class="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-[#0f0f0f]/80 via-transparent to-[#0f0f0f]/80"></div>

      <div class="relative z-10 max-w-7xl mx-auto px-6 text-center flex flex-col items-center">
        <span class="inline-block py-1 px-3 rounded-full border border-atk-neon/50 text-atk-neon text-xs font-bold uppercase tracking-[0.2em] mb-4 bg-atk-neon/10 backdrop-blur-md animate-fade-in-up">
          Nova Coleção 2025
        </span>
        <h1 class="text-6xl md:text-8xl lg:text-9xl font-extrabold mb-6 uppercase italic tracking-tighter leading-[0.9] text-white drop-shadow-2xl animate-fade-in-up" style="animation-delay: 0.1s">
          Vista a <br>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-atk-neon via-white to-atk-neon bg-[length:200%_auto] animate-shine">
            Grandeza
          </span>
        </h1>
        <p class="text-gray-300 text-lg md:text-xl mb-10 font-medium tracking-wide max-w-2xl animate-fade-in-up" style="animation-delay: 0.2s">
          A maior seleção de mantos oficiais, retrôs e exclusivos. Qualidade de jogador, preço de torcedor.
        </p>
        <div class="flex gap-4 animate-fade-in-up" style="animation-delay: 0.3s">
          <RouterLink to="/produtos" class="group relative bg-atk-neon text-atk-dark font-extrabold text-lg px-10 py-4 rounded hover:bg-white transition-all duration-300 shadow-[0_0_40px_rgba(0,255,194,0.4)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)]">
            <span class="relative z-10">VER CATÁLOGO</span>
            <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </RouterLink>
        </div>
      </div>
    </section>

    <div v-if="carregando" class="flex flex-col justify-center items-center py-40">
      <div class="w-16 h-16 border-4 border-white/10 border-t-atk-neon rounded-full animate-spin mb-4"></div>
      <p class="text-gray-500 text-xs uppercase tracking-widest animate-pulse">Carregando estoque...</p>
    </div>

    <template v-else>
      
      <div class="relative py-10">
        <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-atk-neon/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
        <Section v-if="destaques.length > 0" id="destaques" title="🔥 Destaques da Temporada" :items="destaques" />
      </div>

      <section class="my-16 relative h-[400px] flex items-center overflow-hidden border-y border-white/5">
        <div class="absolute inset-0 bg-fixed bg-cover bg-center grayscale opacity-20" style="background-image: url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1936&auto=format&fit=crop')"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-atk-dark via-atk-dark/80 to-transparent"></div>
        <div class="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 items-center w-full">
          <div>
            <h3 class="text-atk-neon font-bold uppercase tracking-widest mb-2 text-sm">Personalização Exclusiva</h3>
            <h2 class="text-4xl md:text-6xl font-extrabold uppercase italic leading-none mb-6">
              Seu Nome.<br>Seu Número.<br>Sua História.
            </h2>
            <p class="text-gray-300 mb-8 max-w-md">
              Adicione personalização oficial da liga em qualquer camisa. Fontes originais da Premier League, La Liga e muito mais.
            </p>
            <RouterLink to="/produtos" class="inline-flex items-center gap-2 border border-white/20 hover:border-atk-neon hover:text-atk-neon text-white px-8 py-3 rounded uppercase font-bold text-sm transition-all group">
              Personalizar Agora <span class="group-hover:translate-x-1 transition-transform">→</span>
            </RouterLink>
          </div>
        </div>
      </section>

      <div class="py-10 bg-[#121212]">
        <Section v-if="queridinhas.length > 0" title="💜 Queridinhas da Galera" :items="queridinhas" />
      </div>

      <div class="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
         
         <div v-if="brasileirao.length > 0" class="bg-[#151515] rounded-2xl border border-white/5 p-6 md:p-8 flex flex-col h-full">
            <div class="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
               <h3 class="text-2xl font-bold uppercase italic text-yellow-400">🇧🇷 Brasileirão</h3>
               <RouterLink to="/produtos" class="text-xs text-gray-500 hover:text-white uppercase font-bold">Ver todos</RouterLink>
            </div>
            <div class="grid grid-cols-2 gap-4 flex-grow">
               <RouterLink :to="`/produto/${item.slug}`" v-for="item in brasileirao" :key="item.id" class="group block">
                  <div class="bg-black/40 rounded-lg p-4 mb-2 group-hover:bg-white/5 transition border border-transparent group-hover:border-white/10 aspect-square flex items-center justify-center">
                     <img :src="item.image_cover" class="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300">
                  </div>
                  <p class="text-xs font-bold text-white truncate">{{ item.name }}</p>
                  <p class="text-xs text-atk-neon">R$ {{ item.price_sale.toFixed(2) }}</p>
               </RouterLink>
            </div>
         </div>

         <div v-if="selecoes.length > 0" class="bg-[#151515] rounded-2xl border border-white/5 p-6 md:p-8 flex flex-col h-full">
            <div class="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
               <h3 class="text-2xl font-bold uppercase italic text-blue-400">🌍 Seleções</h3>
               <RouterLink to="/produtos" class="text-xs text-gray-500 hover:text-white uppercase font-bold">Ver todos</RouterLink>
            </div>
            <div class="grid grid-cols-2 gap-4 flex-grow">
               <RouterLink :to="`/produto/${item.slug}`" v-for="item in selecoes" :key="item.id" class="group block">
                  <div class="bg-black/40 rounded-lg p-4 mb-2 group-hover:bg-white/5 transition border border-transparent group-hover:border-white/10 aspect-square flex items-center justify-center">
                     <img :src="item.image_cover" class="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300">
                  </div>
                  <p class="text-xs font-bold text-white truncate">{{ item.name }}</p>
                  <p class="text-xs text-atk-neon">R$ {{ item.price_sale.toFixed(2) }}</p>
               </RouterLink>
            </div>
         </div>

      </div>

    </template>
  </div>
</template>

<style scoped>
@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
.animate-marquee { animation: marquee 20s linear infinite; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { opacity: 0; animation: fadeInUp 0.8s ease-out forwards; }

@keyframes shine { to { background-position: 200% center; } }
.animate-shine { animation: shine 3s linear infinite; }
</style>