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

const avisos = [
  "⚡ Frete Grátis acima de 2 peças",
  "🔥 2% off no pix",
  "💳 Até 6x no cartão",
  "⚽ Lançamentos da temporada 26/27",
  "📦 Envio para todo o Brasil",
  "🔒 Compra 100% Segura"
]

onMounted(buscarProdutos)

/* ===== LÓGICA DE VITRINES ===== */
const destaques = computed(() => produtos.value.filter(p => p.is_featured).slice(0, 8))
const queridinhas = computed(() => produtos.value.filter(p => p.is_trending).slice(0, 8))
const brasileirao = computed(() => produtos.value.filter(p => p.is_brasileirao_featured).slice(0, 4))
const selecoes = computed(() => produtos.value.filter(p => p.is_selecoes_featured).slice(0, 4))
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] text-white overflow-x-hidden font-sans pb-20 md:pb-0">
    
    <div class="bg-atk-neon text-atk-dark py-2.5 overflow-hidden relative z-20 shadow-md shadow-atk-neon/10 flex select-none">
      <div class="animate-marquee whitespace-nowrap flex items-center">
        <span v-for="(aviso, index) in avisos" :key="index" class="mx-8 text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          {{ aviso }}
        </span>
      </div>
      <div class="animate-marquee whitespace-nowrap flex items-center" aria-hidden="true">
        <span v-for="(aviso, index) in avisos" :key="index + 'dup'" class="mx-8 text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          {{ aviso }}
        </span>
      </div>
    </div>

    <section class="relative h-[85vh] md:h-[700px] lg:h-[800px] flex items-center justify-center overflow-hidden group">
      <div class="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-linear group-hover:scale-110 opacity-50 md:opacity-40" 
           style="background-image: url('https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2000&auto=format&fit=crop')">
      </div>
      <div class="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/20 to-transparent"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-[#0f0f0f]/90 via-transparent to-[#0f0f0f]/90"></div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 text-center flex flex-col items-center justify-center h-full pb-16">
        <span class="inline-block py-1.5 px-4 rounded-full border border-atk-neon/50 text-atk-neon text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6 bg-black/50 backdrop-blur-md animate-fade-in-up shadow-[0_0_15px_rgba(0,255,194,0.15)]">
          Nova Coleção 2026
        </span>
        <h1 class="text-5xl md:text-8xl lg:text-9xl font-extrabold mb-6 uppercase italic tracking-tighter leading-[0.9] text-white drop-shadow-2xl animate-fade-in-up" style="animation-delay: 0.1s">
          Vista a <br>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-atk-neon via-white to-atk-neon bg-[length:200%_auto] animate-shine">
            Grandeza
          </span>
        </h1>
        <p class="text-gray-300 text-sm md:text-xl mb-10 font-medium tracking-wide max-w-md md:max-w-2xl px-4 animate-fade-in-up leading-relaxed" style="animation-delay: 0.2s">
          A maior seleção de mantos oficiais e exclusivos. <br class="hidden md:block">Qualidade de jogador, preço de torcedor.
        </p>
        <div class="flex flex-col md:flex-row gap-4 w-full md:w-auto px-6 animate-fade-in-up" style="animation-delay: 0.3s">
          <RouterLink to="/produtos" class="w-full md:w-auto bg-atk-neon text-atk-dark font-extrabold text-base md:text-lg px-10 py-4 rounded hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(0,255,194,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] active:scale-95 flex items-center justify-center">
            VER TODAS
          </RouterLink>
        </div>
      </div>
    </section>

    <div v-if="carregando" class="flex flex-col justify-center items-center py-40">
      <div class="w-12 h-12 border-4 border-white/10 border-t-atk-neon rounded-full animate-spin mb-4"></div>
      <p class="text-gray-500 text-[10px] uppercase tracking-widest animate-pulse">Carregando...</p>
    </div>

    <template v-else>
      
      <div class="bg-[#151515] border-y border-white/5 py-8 md:py-10">
         <div class="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
            <div class="flex flex-col md:flex-row items-center md:items-start gap-3 text-center md:text-left group">
               <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-atk-neon/10 flex items-center justify-center text-xl md:text-2xl group-hover:bg-atk-neon group-hover:text-atk-dark transition-colors duration-300">🔒</div>
               <div><h4 class="font-bold text-white text-xs md:text-sm uppercase tracking-wider mb-1">Compra Segura</h4><p class="text-[10px] md:text-xs text-gray-500">Dados 100% criptografados</p></div>
            </div>
            <div class="flex flex-col md:flex-row items-center md:items-start gap-3 text-center md:text-left group">
               <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-atk-neon/10 flex items-center justify-center text-xl md:text-2xl group-hover:bg-atk-neon group-hover:text-atk-dark transition-colors duration-300">📦</div>
               <div><h4 class="font-bold text-white text-xs md:text-sm uppercase tracking-wider mb-1">Envio Rastreado</h4><p class="text-[10px] md:text-xs text-gray-500">Acompanhe seu pedido</p></div>
            </div>
            <div class="flex flex-col md:flex-row items-center md:items-start gap-3 text-center md:text-left group">
               <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-atk-neon/10 flex items-center justify-center text-xl md:text-2xl group-hover:bg-atk-neon group-hover:text-atk-dark transition-colors duration-300">💳</div>
               <div><h4 class="font-bold text-white text-xs md:text-sm uppercase tracking-wider mb-1">Até 6x no Cartão</h4><p class="text-[10px] md:text-xs text-gray-500">Ou 2% OFF no PIX</p></div>
            </div>
            <div class="flex flex-col md:flex-row items-center md:items-start gap-3 text-center md:text-left group">
               <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-atk-neon/10 flex items-center justify-center text-xl md:text-2xl group-hover:bg-atk-neon group-hover:text-atk-dark transition-colors duration-300">🛡️</div>
               <div><h4 class="font-bold text-white text-xs md:text-sm uppercase tracking-wider mb-1">Garantia Total</h4><p class="text-[10px] md:text-xs text-gray-500">Troca caso tenha defeitos</p></div>
            </div>
         </div>
      </div>

      <div class="bg-[#121212] py-4 border-b border-white/5">
        <div class="max-w-7xl mx-auto px-4 flex justify-center">
           <a href="https://wa.me/5514982200278" target="_blank" class="group flex items-center gap-3 bg-[#1a1a1a] border border-white/10 px-6 py-3 rounded-full hover:border-green-500/50 hover:bg-green-500/10 transition-all duration-300">
              <span class="text-2xl animate-pulse">💬</span>
              <div class="text-center md:text-left">
                 <p class="text-xs text-gray-400 group-hover:text-green-400 transition-colors uppercase font-bold tracking-wider">Não achou o que procura?</p>
                 <p class="text-sm font-bold text-white">Chame no WhatsApp: <span class="text-green-500">(14) 98220-0278</span></p>
              </div>
           </a>
        </div>
      </div>

      <div class="relative py-8 md:py-16">
        <Section v-if="destaques.length > 0" id="destaques" title="🔥 Destaques da Temporada" :items="destaques" />
      </div>

      <section class="my-8 md:my-16 relative h-auto md:h-[450px] flex items-center overflow-hidden border-y border-white/5 py-16 md:py-0">
        <div class="absolute inset-0 bg-fixed bg-cover bg-center grayscale opacity-20" style="background-image: url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1936&auto=format&fit=crop')"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-atk-dark via-atk-dark/90 to-transparent"></div>
        <div class="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 items-center w-full text-center md:text-left">
          <div>
            <h3 class="text-atk-neon font-bold uppercase tracking-widest mb-3 text-xs md:text-sm">Personalização Exclusiva</h3>
            <h2 class="text-3xl md:text-6xl font-extrabold uppercase italic leading-none mb-6">Seu Nome.<br>Seu Número.</h2>
            <p class="text-gray-400 mb-8 max-w-md mx-auto md:mx-0 text-sm md:text-base leading-relaxed">Adicione personalização oficial da liga em qualquer camisa. Fontes originais da Premier League, La Liga e muito mais.</p>
            <RouterLink to="/produtos" class="inline-flex items-center gap-2 border border-white/20 hover:border-atk-neon hover:text-atk-neon text-white px-8 py-3.5 rounded uppercase font-bold text-xs md:text-sm transition-all group backdrop-blur-sm bg-black/20">
              Personalizar Agora <span class="group-hover:translate-x-1 transition-transform">→</span>
            </RouterLink>
          </div>
        </div>
      </section>

      <div class="py-10 bg-[#121212]">
        <Section v-if="queridinhas.length > 0" title="💜 Queridinhas da Galera" :items="queridinhas" />
      </div>

      <div class="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
         <div v-if="brasileirao.length > 0" class="bg-[#151515] rounded-2xl border border-white/5 p-5 md:p-8 flex flex-col shadow-lg">
            <div class="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
               <h3 class="text-xl md:text-2xl font-bold uppercase italic text-yellow-400 flex items-center gap-2"><span class="text-2xl">🇧🇷</span> Brasileirão</h3>
               <RouterLink to="/produtos" class="text-[10px] md:text-xs text-gray-500 hover:text-white uppercase font-bold tracking-wider border border-white/10 px-3 py-1 rounded-full hover:bg-white/5 transition">Ver todos</RouterLink>
            </div>
            <div class="grid grid-cols-2 gap-3 md:gap-4 flex-grow">
               <RouterLink :to="`/produto/${item.slug}`" v-for="item in brasileirao" :key="item.id" class="group block relative overflow-hidden rounded-lg bg-black/40 border border-white/5 hover:border-white/20 transition-all">
                  <div class="p-4 flex items-center justify-center aspect-[4/5]"><img :src="item.image_cover" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-xl"></div>
                  <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-6">
                     <p class="text-[10px] md:text-xs font-bold text-white truncate uppercase">{{ item.name }}</p>
                     <p class="text-[10px] md:text-xs text-atk-neon font-mono">R$ {{ item.price_sale.toFixed(2) }}</p>
                  </div>
               </RouterLink>
            </div>
         </div>
         <div v-if="selecoes.length > 0" class="bg-[#151515] rounded-2xl border border-white/5 p-5 md:p-8 flex flex-col shadow-lg">
            <div class="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
               <h3 class="text-xl md:text-2xl font-bold uppercase italic text-blue-400 flex items-center gap-2"><span class="text-2xl">🌍</span> Seleções</h3>
               <RouterLink to="/produtos" class="text-[10px] md:text-xs text-gray-500 hover:text-white uppercase font-bold tracking-wider border border-white/10 px-3 py-1 rounded-full hover:bg-white/5 transition">Ver todos</RouterLink>
            </div>
            <div class="grid grid-cols-2 gap-3 md:gap-4 flex-grow">
               <RouterLink :to="`/produto/${item.slug}`" v-for="item in selecoes" :key="item.id" class="group block relative overflow-hidden rounded-lg bg-black/40 border border-white/5 hover:border-white/20 transition-all">
                  <div class="p-4 flex items-center justify-center aspect-[4/5]"><img :src="item.image_cover" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-xl"></div>
                  <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-6">
                     <p class="text-[10px] md:text-xs font-bold text-white truncate uppercase">{{ item.name }}</p>
                     <p class="text-[10px] md:text-xs text-atk-neon font-mono">R$ {{ item.price_sale.toFixed(2) }}</p>
                  </div>
               </RouterLink>
            </div>
         </div>
      </div>

    </template>
  </div>
</template>

<style scoped>
@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
.animate-marquee { animation: marquee 40s linear infinite; min-width: 100%; display: flex; justify-content: space-around; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes shine { to { background-position: 200% center; } }
.animate-shine { animation: shine 4s linear infinite; }
</style>