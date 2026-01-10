<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../supabase'

const route = useRoute()
const produto = ref(null)
const carregando = ref(true)
const imagemAtual = ref('')
const tamanhoSelecionado = ref(null)

async function carregarProduto() {
  // Pega o slug da URL (ex: '2025-kids-italy...')
  const slug = route.params.slug

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single() // Traz apenas 1 item

  if (data) {
    produto.value = data
    imagemAtual.value = data.image_cover // Define a capa como primeira imagem
  }
  carregando.value = false
}

onMounted(() => {
  carregarProduto()
})
</script>

<template>
  <div v-if="carregando" class="text-center py-20 text-gray-500">
    Carregando detalhes...
  </div>

  <div v-else-if="produto" class="container mx-auto px-4 py-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
      
      <div>
        <div class="bg-gray-100 rounded-xl p-4 mb-4 h-96 flex items-center justify-center">
          <img :src="imagemAtual" :alt="produto.name" class="max-h-full object-contain mix-blend-multiply">
        </div>
        
        <div class="flex gap-2 overflow-x-auto pb-2">
          <button 
            @click="imagemAtual = produto.image_cover"
            class="w-20 h-20 border-2 rounded-lg overflow-hidden flex-shrink-0"
            :class="imagemAtual === produto.image_cover ? 'border-blue-500' : 'border-gray-200'"
          >
            <img :src="produto.image_cover" class="w-full h-full object-cover">
          </button>

          <button 
            v-for="img in produto.images_gallery" 
            :key="img"
            @click="imagemAtual = img"
            class="w-20 h-20 border-2 rounded-lg overflow-hidden flex-shrink-0"
            :class="imagemAtual === img ? 'border-blue-500' : 'border-gray-200'"
          >
            <img :src="img" class="w-full h-full object-cover">
          </button>
        </div>
      </div>

      <div>
        <span class="text-sm text-blue-600 font-bold uppercase tracking-wide">
          {{ produto.league }} • {{ produto.category }}
        </span>
        
        <h1 class="text-3xl font-bold text-gray-900 mt-2 mb-4">{{ produto.name }}</h1>
        
        <div class="flex items-end gap-3 mb-6">
          <span class="text-3xl font-bold text-green-600">R$ {{ produto.price_sale }}</span>
          <span class="text-gray-400 line-through mb-1">R$ {{ produto.price_cost + 60 }}</span>
        </div>

        <p class="text-gray-600 mb-6 leading-relaxed">
          {{ produto.description }}
        </p>

        <div class="mb-8">
          <h3 class="text-sm font-bold text-gray-900 mb-3">Escolha o Tamanho:</h3>
          <div class="flex flex-wrap gap-3">
            <button 
              v-for="tamanho in produto.sizes" 
              :key="tamanho"
              @click="tamanhoSelecionado = tamanho"
              class="w-12 h-12 rounded border flex items-center justify-center font-medium transition-all"
              :class="tamanhoSelecionado === tamanho 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-gray-900 border-gray-300 hover:border-black'"
            >
              {{ tamanho }}
            </button>
          </div>
          <p v-if="!tamanhoSelecionado" class="text-red-500 text-sm mt-2">
            * Selecione um tamanho
          </p>
        </div>

        <button 
          class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg transition-colors shadow-lg flex items-center justify-center gap-2"
          :disabled="!tamanhoSelecionado"
          :class="!tamanhoSelecionado ? 'opacity-50 cursor-not-allowed' : ''"
        >
          <span v-if="tamanhoSelecionado">Adicionar ao Carrinho</span>
          <span v-else>Escolha um tamanho para comprar</span>
        </button>

      </div>
    </div>
  </div>
</template>