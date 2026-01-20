<script setup>
import { RouterLink } from 'vue-router'
import { computed } from 'vue'

const props = defineProps({
  product: Object
})

// Lógica do Preço Riscado (DE: R$ ...)
const precoOriginal = computed(() => {
  if (!props.product) return 0
  
  // Normaliza textos para facilitar a busca (tudo minúsculo)
  const categoria = props.product.category ? props.product.category.toLowerCase() : ''
  const nome = props.product.name ? props.product.name.toLowerCase() : ''

  // 1. Regra para KIDS
  if (categoria.includes('kids') || categoria.includes('infantil')) {
    return 179.90
  }

  // 2. Regra para RETRÔ ou PLAYER (Jogador)
  if (
    categoria.includes('retro') || 
    categoria.includes('retrô') || 
    nome.includes('jogador') || 
    nome.includes('player')
  ) {
    return 199.90
  }

  // 3. Regra Padrão (Torcedor Comum)
  // Define um preço base para que o desconto pareça real (ex: De 189 por 139)
  return 189.90
})
</script>

<template>
  <div class="bg-atk-card rounded-xl overflow-hidden group hover:shadow-neon transition-all duration-300 h-full flex flex-col">
    
    <RouterLink :to="`/produto/${product.slug}`" class="relative block overflow-hidden bg-[#2a2a2a] p-4">
      <img
        :src="product.image_cover"
        :alt="product.name"
        class="w-full h-64 object-contain group-hover:scale-110 transition-transform duration-500"
      />
      <span class="absolute top-3 right-3 bg-atk-dark/80 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
        {{ product.league }}
      </span>
    </RouterLink>

    <div class="p-5 flex flex-col flex-grow text-center">
      <p class="text-xs text-gray-400 mb-2 uppercase tracking-widest">{{ product.category }}</p>
      
      <h3 class="text-sm font-bold text-white line-clamp-2 mb-4 flex-grow uppercase leading-tight">
        <RouterLink :to="`/produto/${product.slug}`" class="hover:text-atk-neon transition">
          {{ product.name }}
        </RouterLink>
      </h3>

      <div class="mt-auto space-y-4">
        <div class="flex items-center justify-center gap-3 font-bold">
          <span class="text-gray-500 line-through text-sm">
            R$ {{ precoOriginal.toFixed(2).replace('.', ',') }}
          </span>
          <span class="text-atk-neon text-2xl">
            R$ {{ product.price_sale.toFixed(2).replace('.', ',') }}
          </span>
        </div>

        <RouterLink
          :to="`/produto/${product.slug}`"
          class="block w-full bg-atk-neon text-atk-dark font-extrabold uppercase py-3 rounded-lg hover:bg-white hover:scale-[1.02] transition-all duration-200"
        >
          Adicionar ao Carrinho
        </RouterLink>
      </div>
    </div>
  </div>
</template>