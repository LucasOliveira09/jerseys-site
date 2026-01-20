<script setup>
import { useCartStore } from '../stores/cart'
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const cart = useCartStore()
const router = useRouter()

// Apenas o Subtotal é calculado aqui para conferência.
// O Frete e o Total Final são calculados na página de Checkout (Pagamento).
const subtotal = computed(() => {
  return cart.itens.reduce((acc, item) => acc + (item.price_sale * item.quantidade), 0)
})

// Formatar moeda
const formatPrice = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

if (cart.itens === 1){
  console.log('1');
}
</script>

<template>
  <div class="min-h-screen bg-atk-dark text-white font-sans py-12 px-4">
    <div class="max-w-7xl mx-auto">
      
      <h1 class="text-3xl md:text-4xl font-extrabold uppercase tracking-tighter mb-8 border-b border-white/10 pb-4">
        Seu Carrinho <span class="text-atk-neon">({{ cart.quantidade }} itens)</span>
      </h1>

      <div v-if="cart.itens.length === 0" class="text-center py-20 bg-[#151515] rounded-xl border border-dashed border-white/10">
        <p class="text-6xl mb-4">🛒</p>
        <h2 class="text-xl font-bold mb-2">Seu carrinho está vazio</h2>
        <p class="text-gray-400 mb-6">Que tal dar uma olhada nos lançamentos?</p>
        <button @click="router.push('/produtos')" class="bg-atk-neon text-atk-dark font-bold px-8 py-3 rounded-full hover:bg-white transition uppercase tracking-wide">
          Ver Produtos
        </button>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div class="lg:col-span-2 space-y-4">
          <div v-for="item in cart.itens" :key="item.cartId" class="bg-[#1a1a1a] p-4 rounded-lg flex gap-4 border border-white/5 relative group">
            
            <div class="w-24 h-24 bg-white/5 rounded-md flex items-center justify-center shrink-0">
              <img :src="item.image_cover" :alt="item.name" class="w-full h-full object-contain p-2">
            </div>

            <div class="flex-grow flex flex-col justify-between">
              <div>
                <h3 class="font-bold text-sm md:text-base uppercase leading-tight pr-8">{{ item.name }}</h3>
                <p class="text-gray-400 text-xs mt-1">Tamanho: <span class="text-white font-bold">{{ item.tamanhoEscolhido }}</span></p>
                <p class="text-gray-400 text-xs" v-if="item.versao">Versão: {{ item.versao }}</p>
                
                <div v-if="item.personalizacao" class="text-[10px] text-atk-neon mt-1 bg-atk-neon/10 inline-block px-2 py-0.5 rounded">
                  Personalizado: {{ item.personalizacao.nome }} #{{ item.personalizacao.numero }}
                </div>
              </div>

              <div class="flex justify-between items-end mt-2">
                <div class="flex items-center border border-white/20 rounded-md">
                  <button @click="cart.diminuirQuantidade(item.cartId)" class="px-3 py-1 hover:bg-white/10 text-gray-400 font-bold">-</button>
                  <span class="px-2 text-sm font-bold w-8 text-center">{{ item.quantidade }}</span>
                  <button @click="cart.aumentarQuantidade(item.cartId)" class="px-3 py-1 hover:bg-white/10 text-atk-neon font-bold">+</button>
                </div>
                
                <div class="text-right">
                  <p class="font-bold text-lg text-atk-neon">{{ formatPrice(item.price_sale * item.quantidade) }}</p>
                  <p class="text-[10px] text-gray-500" v-if="item.quantidade > 1">{{ formatPrice(item.price_sale) }} cada</p>
                </div>
              </div>
            </div>

            <button @click="cart.removerItem(item.cartId)" class="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition" title="Remover item">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        </div>

        <div class="lg:col-span-1">
          <div class="bg-[#1a1a1a] p-6 rounded-xl border border-white/10 sticky top-24">
            <h2 class="font-bold text-xl uppercase mb-6 tracking-wide">Resumo</h2>
            
            <div class="space-y-3 border-b border-white/10 pb-6 mb-6 text-sm">
              <div class="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>{{ formatPrice(subtotal) }}</span>
              </div>
              <div class="flex justify-between text-gray-400">
                <span>Entrega</span>
                <span v-if="cart.itens.length === 1" class="text-xs">R$ 25,00</span>
                <span v-if="cart.itens.length === 2" class="text-xs">R$ 20,00</span>
                <span v-if="cart.itens.length === 3" class="text-xs">Gratis</span>

              </div>
            </div>

            <div class="flex justify-between items-end mb-6">
              <span class="font-bold text-lg">Subtotal</span>
              <div class="text-right">
                <span class="block text-2xl font-extrabold text-atk-neon">{{ formatPrice(subtotal) }}</span>
                <span class="text-xs text-gray-500"></span>
              </div>
            </div>

            <button 
              @click="router.push('/checkout')" 
              class="w-full bg-atk-neon text-atk-dark font-extrabold py-4 rounded-lg uppercase tracking-widest hover:bg-white transition shadow-[0_0_15px_rgba(0,255,194,0.4)] flex justify-center items-center gap-2"
            >
              Ir para Pagamento 
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>

            <button @click="router.push('/produtos')" class="w-full text-gray-500 text-xs font-bold uppercase mt-4 hover:text-white transition">
              Continuar Comprando
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>