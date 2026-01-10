<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const camisas = ref([])
const carregando = ref(true)

async function buscarCamisas() {
  try {
    carregando.value = true
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('active', true) // Filtra apenas ativos

    if (error) throw error
    camisas.value = data
  } catch (erro) {
    console.error(erro)
  } finally {
    carregando.value = false
  }
}

onMounted(() => {
  buscarCamisas()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-8 text-center">
      Destaques da Temporada ⚽
    </h1>

    <div v-if="carregando" class="text-center text-gray-500 py-10">
      Carregando estoque...
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div 
        v-for="camisa in camisas" 
        :key="camisa.id" 
        class="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100"
      >
        <div class="relative h-64 w-full bg-gray-50">
          <img 
            :src="camisa.image_cover" 
            :alt="camisa.name" 
            class="h-full w-full object-contain p-4 mix-blend-multiply"
          />
          <span v-if="camisa.league === 'Seleções'" class="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
            Copa 🏆
          </span>
        </div>

        <div class="p-4">
          <p class="text-sm text-gray-500 mb-1">{{ camisa.category }}</p>
          <h2 class="text-lg font-semibold text-gray-800 leading-tight mb-2 line-clamp-2 h-14">
            {{ camisa.name }}
          </h2>
          
          <div class="flex items-center justify-between mt-4">
            <div class="flex flex-col">
              <span class="text-xs text-gray-400 line-through">R$ {{ camisa.price_cost + 50 }}</span>
              <span class="text-xl font-bold text-green-600">R$ {{ camisa.price_sale }}</span>
            </div>
            <RouterLink 
              :to="`/produto/${camisa.slug}`"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Comprar
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>