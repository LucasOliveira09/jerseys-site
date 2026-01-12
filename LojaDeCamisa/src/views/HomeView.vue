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

/* ===== SEÇÕES MANUAIS ===== */

// 1. DESTAQUES (Topo) - Marcados com ⭐
const destaques = computed(() =>
  produtos.value
    .filter(p => p.is_featured === true)
    .slice(0, 8)
)

// 2. QUERIDINHAS - Marcados com 💜
const queridinhas = computed(() =>
  produtos.value
    .filter(p => p.is_trending === true)
    .slice(0, 8)
)

// 3. BRASILEIRÃO - Marcados com 🇧🇷
const brasileirao = computed(() =>
  produtos.value
    .filter(p => p.is_brasileirao_featured === true)
    .slice(0, 8)
)

// 4. SELEÇÕES - Marcados com 🌍
const selecoes = computed(() =>
  produtos.value
    .filter(p => p.is_selecoes_featured === true)
    .slice(0, 8)
)
</script>

<template>
  <section class="relative h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden bg-atk-dark">
    <div class="absolute inset-0 bg-cover bg-center opacity-30 grayscale mix-blend-luminosity" style="background-image: url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop')"></div>
    <div class="absolute inset-0 bg-gradient-to-t from-atk-dark via-atk-dark/60 to-transparent"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-6 text-center">
      <h1 class="text-5xl md:text-8xl font-extrabold mb-6 uppercase italic tracking-tighter leading-none drop-shadow-2xl text-white">
        Mantos da <br>
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-atk-neon to-white">Temporada</span>
      </h1>
      <p class="text-gray-300 text-xl md:text-2xl mb-10 font-medium tracking-wider uppercase">
        Vista a paixão. O jogo começou.
      </p>
      <RouterLink to="/produtos" class="bg-atk-neon text-atk-dark font-extrabold text-xl px-12 py-5 rounded-full uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-lg shadow-atk-neon/20">
        Ver Catálogo
      </RouterLink>
    </div>
  </section>

  <div v-if="carregando" class="text-center py-20 text-gray-500">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-atk-neon mx-auto mb-4"></div>
  </div>

  <template v-else>
    <Section v-if="destaques.length > 0" id="destaques" title="🔥 Destaques da Temporada" :items="destaques" />
    
    <Section v-if="queridinhas.length > 0" title="💜 Queridinhas da Galera" :items="queridinhas" />
    
    <Section v-if="brasileirao.length > 0" title="🇧🇷 Destaques do Brasileirão" :items="brasileirao" />
    
    <Section v-if="selecoes.length > 0" title="🌍 Destaques Seleções" :items="selecoes" />
  </template>
</template>