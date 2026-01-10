<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../supabase'
import { useCartStore } from '../stores/cart'
import ProductCard from '../components/ProductCard.vue'

const route = useRoute()
const cart = useCartStore()

const produto = ref(null)
const relacionados = ref([])
const carregando = ref(true)
const tamanhoSelecionado = ref('')
const erro = ref('')

// Estados da Galeria
const imagemAtual = ref('') 

// Estados da Personalização
const nomePersonalizado = ref('')
const numeroPersonalizado = ref('')

// Tamanhos padrão caso falhe tudo
const tamanhosPadrao = ['P', 'M', 'G', 'GG', 'XG']

async function carregarProduto() {
  try {
    carregando.value = true
    erro.value = ''
    tamanhoSelecionado.value = ''
    nomePersonalizado.value = ''
    numeroPersonalizado.value = ''

    // 1. Busca o produto na tabela 'produtos'
    const { data, error } = await supabase
      .from('produtos') 
      .select('*')
      .eq('slug', route.params.slug)
      .single()

    if (error) throw error
    produto.value = data
    
    // Define a imagem principal inicial
    imagemAtual.value = data.image_cover

    if (produto.value) {
      buscarRelacionados(produto.value.league, produto.value.id)
    }

  } catch (err) {
    console.error(err)
    erro.value = 'Produto não encontrado.'
  } finally {
    carregando.value = false
  }
}

async function buscarRelacionados(liga, idAtual) {
  // CORREÇÃO: Usando 'produtos' em vez de 'products'
  const { data } = await supabase
    .from('produtos')
    .select('*')
    .eq('league', liga)
    .neq('id', idAtual)
    .limit(4)
  
  relacionados.value = data || []
}

// LÓGICA SEGURA PARA TAMANHOS (Corrige o erro JSON)
const listaTamanhos = computed(() => {
  if (!produto.value || !produto.value.sizes) return tamanhosPadrao

  const rawSizes = produto.value.sizes

  // 1. Se já for um array, retorna direto
  if (Array.isArray(rawSizes)) return rawSizes

  // 2. Tenta fazer o parse do JSON
  try {
    const parsed = JSON.parse(rawSizes)
    if (Array.isArray(parsed)) return parsed
  } catch (e) {
    // 3. SE DER ERRO (Seu caso atual "P,M,G"), faz split por vírgula
    if (typeof rawSizes === 'string') {
      return rawSizes.split(',').map(s => s.trim()) // Remove espaços extras
    }
  }

  return tamanhosPadrao
})

// LÓGICA SEGURA PARA GALERIA
const todasImagens = computed(() => {
  if (!produto.value) return []
  const lista = [produto.value.image_cover]

  if (produto.value.images_gallery) {
    let fotosExtras = []
    try {
      if (typeof produto.value.images_gallery === 'string') {
        fotosExtras = JSON.parse(produto.value.images_gallery)
      } else if (Array.isArray(produto.value.images_gallery)) {
        fotosExtras = produto.value.images_gallery
      }
    } catch (e) {
      console.error('Erro galeria:', e)
    }
    if (Array.isArray(fotosExtras)) {
      return lista.concat(fotosExtras)
    }
  }
  return lista
})

function adicionarAoCarrinho() {
  if (!tamanhoSelecionado.value) {
    alert('Por favor, selecione um tamanho.')
    return
  }

  const itemParaCarrinho = {
    ...produto.value,
    personalizacao: {
      nome: nomePersonalizado.value.toUpperCase(),
      numero: numeroPersonalizado.value
    }
  }

  cart.adicionarAoCarrinho(itemParaCarrinho, tamanhoSelecionado.value)
  alert('Produto adicionado ao carrinho! 🛒')
}

watch(() => route.params.slug, () => {
  carregarProduto()
})

onMounted(() => {
  carregarProduto()
})
</script>

<template>
  <div class="min-h-screen bg-atk-dark text-white font-sans pb-20">
    
    <div v-if="carregando" class="flex justify-center items-center h-[80vh]">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-atk-neon"></div>
    </div>

    <div v-else-if="erro || !produto" class="text-center py-20">
      <h2 class="text-2xl font-bold mb-4">😕 Ops!</h2>
      <p>{{ erro }}</p>
      <router-link to="/produtos" class="text-atk-neon hover:underline mt-4 block">Voltar para o catálogo</router-link>
    </div>

    <div v-else>
      
      <div class="max-w-7xl mx-auto px-4 py-6 text-sm text-gray-500 uppercase tracking-widest">
        <router-link to="/" class="hover:text-white">Home</router-link> / 
        <router-link to="/produtos" class="hover:text-white">Catálogo</router-link> / 
        <span class="text-atk-neon font-bold">{{ produto.name }}</span>
      </div>

      <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        
        <div class="space-y-4">
          <div class="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 flex items-center justify-center relative group aspect-square overflow-hidden">
            <img 
              :src="imagemAtual" 
              :alt="produto.name" 
              class="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500"
            >
          </div>

          <div v-if="todasImagens.length > 1" class="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            <button 
              v-for="(img, index) in todasImagens" 
              :key="index"
              @click="imagemAtual = img"
              class="w-20 h-20 flex-shrink-0 rounded-lg border-2 overflow-hidden p-1 bg-[#1a1a1a] transition-all"
              :class="imagemAtual === img ? 'border-atk-neon opacity-100' : 'border-transparent opacity-60 hover:opacity-100'"
            >
              <img :src="img" class="w-full h-full object-contain" />
            </button>
          </div>
        </div>

        <div class="flex flex-col">
          <h1 class="text-3xl md:text-4xl font-extrabold uppercase leading-tight mb-2">
            {{ produto.name }}
          </h1>
          
          <div class="flex items-center gap-4 mb-6">
            <p class="text-gray-400 text-sm uppercase tracking-widest bg-white/5 px-2 py-1 rounded">{{ produto.category }} | {{ produto.league }}</p>
            <div class="flex text-yellow-400 text-sm">★★★★★ <span class="text-gray-600 ml-2">(4.9)</span></div>
          </div>

          <div class="mb-8 p-4 bg-[#1a1a1a] rounded-lg border border-white/10 inline-block w-full">
            <div class="flex justify-between items-center">
               <div>
                  <p class="text-gray-500 text-sm line-through mb-1">De R$ {{ (Number(produto.price_cost) + 60).toFixed(2) }}</p>
                  <div class="flex items-baseline gap-2">
                    <span class="text-atk-neon text-4xl font-extrabold">R$ {{ Number(produto.price_sale).toFixed(2) }}</span>
                  </div>
               </div>
               <div class="text-right">
                 <span class="block text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded mb-1">5% OFF no PIX</span>
                 <p class="text-gray-400 text-xs">até 3x sem juros</p>
               </div>
            </div>
          </div>

          <div class="mb-8 border-b border-white/10 pb-8">
            <p class="text-sm font-bold uppercase tracking-widest mb-3 text-gray-300">Escolha o Tamanho:</p>
            <div class="flex flex-wrap gap-3">
              <button 
                v-for="tamanho in listaTamanhos" 
                :key="tamanho"
                @click="tamanhoSelecionado = tamanho"
                class="w-12 h-12 rounded border-2 flex items-center justify-center font-bold transition-all"
                :class="tamanhoSelecionado === tamanho 
                  ? 'border-atk-neon bg-atk-neon text-atk-dark scale-110 shadow-[0_0_10px_#00FFC2]' 
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'"
              >
                {{ tamanho }}
              </button>
            </div>
          </div>

          <div class="mb-8 bg-[#151515] p-5 rounded-lg border border-dashed border-white/20">
            <div class="flex items-center gap-2 mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-atk-neon"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
               <h3 class="font-bold text-white uppercase tracking-wider text-sm">Personalize seu Manto</h3>
               <span class="text-[10px] bg-atk-neon text-atk-dark px-2 py-0.5 rounded font-bold">GRÁTIS</span>
            </div>
            
            <div class="grid grid-cols-3 gap-4">
              <div class="col-span-2">
                <label class="block text-xs text-gray-500 uppercase font-bold mb-1">Nome</label>
                <input v-model="nomePersonalizado" type="text" placeholder="Ex: SEU NOME" maxlength="12" class="w-full bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 rounded focus:border-atk-neon focus:outline-none uppercase placeholder-gray-700 transition" />
              </div>
              <div class="col-span-1">
                <label class="block text-xs text-gray-500 uppercase font-bold mb-1">Número</label>
                <input v-model="numeroPersonalizado" type="number" placeholder="10" max="99" class="w-full bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 rounded focus:border-atk-neon focus:outline-none placeholder-gray-700 transition text-center" />
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <button 
              @click="adicionarAoCarrinho"
              :disabled="!tamanhoSelecionado"
              class="w-full bg-atk-neon text-atk-dark py-4 rounded-lg font-extrabold uppercase tracking-widest text-lg hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,255,194,0.2)] hover:shadow-[0_0_30px_rgba(0,255,194,0.4)]"
            >
              Adicionar ao Carrinho
            </button>
          </div>

          <div class="mt-8 grid grid-cols-2 gap-4 text-xs text-gray-400">
            <div class="flex items-center gap-2"><span class="text-atk-neon">✔</span> Produto Oficial Importado</div>
            <div class="flex items-center gap-2"><span class="text-atk-neon">✔</span> Garantia contra defeitos</div>
          </div>
        </div>
      </div>

      <div v-if="relacionados.length > 0" class="max-w-7xl mx-auto px-4 border-t border-white/10 pt-12">
        <h3 class="text-2xl font-extrabold uppercase tracking-tighter mb-8 text-center">
          Você também pode <span class="text-atk-neon">gostar</span>
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <ProductCard v-for="item in relacionados" :key="item.id" :product="item" />
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
</style>