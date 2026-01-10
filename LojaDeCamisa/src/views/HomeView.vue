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

/* ===== SEÇÕES ===== */

const destaques = computed(() =>
  produtos.value
    .filter(p => p.is_featured === true) // Filtra os marcados
    .slice(0, 8) // Limita a 8 itens para não quebrar o layout
)

// 2. LANÇAMENTOS (NOVIDADE): Pega os marcados como 'is_new_arrival' OU os últimos adicionados
const lancamentos = computed(() =>
  produtos.value
    .filter(p => p.is_new_arrival === true)
    .slice(0, 4)
)

// 3. BRASILEIRÃO: Continua automático (basta a camisa ter a liga correta)
const brasileirao = computed(() =>
  produtos.value
    .filter(p => p.league === 'Brasileirão')
    .filter(p => p.is_featured === true)
    .slice(0, 4) // Mostra 4 ou 8
)

// 4. SELEÇÕES: Continua automático
const selecoes = computed(() =>
  produtos.value
    .filter(p => p.league === 'Seleções')
    .slice(0, 4)
)

// 5. PROMOÇÕES: Automático (Se o preço de venda for menor que o de custo/tabela)
// const promocoes = computed(() =>
//  produtos.value
// .filter(p => Number(p.price_sale) < Number(p.price_cost + 50)) // Exemplo de lógica
//   .slice(0, 8)
//)
</script>

<template>
  <!-- HERO -->
  <section class="relative h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden bg-atk-dark">
    <div class="absolute inset-0  bg-cover bg-center opacity-30 grayscale mix-blend-luminosity"></div>
    <div class="absolute inset-0 bg-gradient-to-t from-atk-dark via-atk-dark/60 to-transparent"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-6 text-center">
      <h1 class="text-5xl md:text-8xl font-extrabold mb-6 uppercase italic tracking-tighter leading-none drop-shadow-2xl">
        Mantos da <br>
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-atk-neon to-white">Temporada</span>
      </h1>
      <p class="text-gray-300 text-xl md:text-2xl mb-10 font-medium tracking-wider uppercase">
        Vista a paixão. O jogo começou.
      </p>
      <button class="bg-atk-neon text-atk-dark font-extrabold text-xl px-12 py-5 rounded-full uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-lg shadow-atk-neon/20">
        Comprar Agora
      </button>
    </div>
  </section>

  <!-- LOADING -->
  <div v-if="carregando" class="text-center py-20 text-gray-500">
    Carregando produtos...
  </div>

  <template v-else>
    <Section id="destaques" title="🔥 Destaques da Temporada" :items="destaques" />
    <Section title="Queridinhas" :items="premierleague" />
    <Section title="🇧🇷 Brasileirão" :items="brasileirao" />
    <Section title="🌍 Seleções" :items="selecoes" />
    <!-- ><Section title="💸 Promoções" :items="promocoes" /> -->
  </template>
</template>
