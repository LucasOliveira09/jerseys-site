<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../supabase'
import { useCartStore } from '../stores/cart'
import ProductCard from '../components/ProductCard.vue'

const route = useRoute()
const cart = useCartStore()

const produto = ref(null)
const relacionados = ref([])
const carregando = ref(true)
const erro = ref('')

// --- ESTADOS ---
const imagemAtualIndex = ref(0) 
const scrollContainer = ref(null) 

// Opções
const tamanhoSelecionado = ref('')
const versaoSelecionada = ref('torcedor')
const querPersonalizar = ref(false)
const nomePersonalizado = ref('')
const numeroPersonalizado = ref('')
const patchSelecionado = ref('')
const showGuiaMedidas = ref(false)

// Frete
const cep = ref('')
const calculandoFrete = ref(false)
const freteCalculado = ref(null)

const tamanhosPadrao = ['P', 'M', 'G', 'GG', 'XG']
const patchesDisponiveis = ['Nenhum', 'Champions League', 'Libertadores', 'Brasileirão', 'Premier League', 'Mundial FIFA']

// --- CARREGAMENTO ---
async function carregarProduto() {
  try {
    carregando.value = true
    erro.value = ''
    resetarEstados()

    const { data, error } = await supabase
      .from('produtos') 
      .select('*')
      .eq('slug', route.params.slug)
      .single()

    if (error) throw error
    produto.value = data
    imagemAtualIndex.value = 0

    if (produto.value) {
      const termoBusca = produto.value.name.split(' ')[0]
      buscarRelacionados(produto.value.league, termoBusca, produto.value.id)
    }

  } catch (err) {
    console.error(err)
    erro.value = 'Produto não encontrado.'
  } finally {
    carregando.value = false
  }
}

function resetarEstados() {
  tamanhoSelecionado.value = ''
  versaoSelecionada.value = 'torcedor'
  querPersonalizar.value = false
  nomePersonalizado.value = ''
  numeroPersonalizado.value = ''
  patchSelecionado.value = ''
  cep.value = ''
  freteCalculado.value = null
}

async function buscarRelacionados(liga, termoNome, idAtual) {
  const { data } = await supabase
    .from('produtos')
    .select('*')
    .eq('active', true)
    .neq('id', idAtual)
    .or(`league.eq.${liga},name.ilike.%${termoNome}%`)
    .limit(4)
  
  relacionados.value = data || []
}

// --- IMAGENS (CARROSSEL) ---
const todasImagens = computed(() => {
  if (!produto.value) return []
  const capa = produto.value.image_cover
  let lista = [capa]

  if (produto.value.images_gallery) {
    let extras = []
    try {
      if (typeof produto.value.images_gallery === 'string') {
        extras = JSON.parse(produto.value.images_gallery)
      } else if (Array.isArray(produto.value.images_gallery)) {
        extras = produto.value.images_gallery
      }
    } catch (e) {}

    extras.forEach(img => {
      if (img !== capa) lista.push(img)
    })
  }
  return lista
})

function selecionarImagem(index) {
  imagemAtualIndex.value = index
  if (scrollContainer.value) {
    const largura = scrollContainer.value.offsetWidth
    scrollContainer.value.scrollTo({
      left: largura * index,
      behavior: 'smooth'
    })
  }
}

function onScroll() {
  if (scrollContainer.value) {
    const scrollLeft = scrollContainer.value.scrollLeft
    const largura = scrollContainer.value.offsetWidth
    imagemAtualIndex.value = Math.round(scrollLeft / largura)
  }
}

// --- TAMANHOS ---
const listaTamanhos = computed(() => {
  if (!produto.value || !produto.value.sizes) return tamanhosPadrao
  try {
    const parsed = typeof produto.value.sizes === 'string' ? JSON.parse(produto.value.sizes) : produto.value.sizes
    return Array.isArray(parsed) ? parsed : tamanhosPadrao
  } catch (e) { return tamanhosPadrao }
})

// --- PREÇO ---
const precoFinal = computed(() => {
  let total = 0
  if (versaoSelecionada.value === 'jogador') total += 179.90
  else total += 139.90

  if (querPersonalizar.value) total += 17.00
  if (patchSelecionado.value && patchSelecionado.value !== 'Nenhum') total += 6.00

  return total
})

// --- FRETE (CEP & DATA) ---
function formatarCep() {
  let v = cep.value.replace(/\D/g, "")
  if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2")
  cep.value = v
}

function calcularFrete() {
  if (cep.value.length < 9) {
    alert("Digite um CEP válido")
    return
  }
  calculandoFrete.value = true
  freteCalculado.value = null

  // 1. Lógica de Datas (Hoje + 25 e Hoje + 30)
  const hoje = new Date()
  
  const dataMin = new Date(hoje)
  dataMin.setDate(hoje.getDate() + 25)

  const dataMax = new Date(hoje)
  dataMax.setDate(hoje.getDate() + 30)

  // 2. Formatação (Dia/Mês)
  const opcoes = { day: '2-digit', month: '2-digit' }
  const dataMinFormatada = dataMin.toLocaleDateString('pt-BR', opcoes)
  const dataMaxFormatada = dataMax.toLocaleDateString('pt-BR', opcoes)

  setTimeout(() => {
    calculandoFrete.value = false
    freteCalculado.value = {
      // Texto dinâmico: "Chega entre 15/02 e 20/02"
      prazo: `Chega entre ${dataMinFormatada} e ${dataMaxFormatada}`,
      regra: 'Compre 3 camisas e ganhe Frete Grátis!'
    }
  }, 1000)
}

// --- CARRINHO ---
function adicionarAoCarrinho() {
  if (!tamanhoSelecionado.value) {
    alert('Por favor, selecione um tamanho antes de comprar.')
    return
  }
  
  if (querPersonalizar.value && (!nomePersonalizado.value || !numeroPersonalizado.value)) {
    alert('Por favor, preencha o Nome e Número da personalização.')
    return
  }

  const itemParaCarrinho = {
    ...produto.value,
    price_sale: precoFinal.value,
    versao: versaoSelecionada.value,
    patch: patchSelecionado.value !== 'Nenhum' ? patchSelecionado.value : null,
    personalizacao: querPersonalizar.value ? {
      nome: nomePersonalizado.value.toUpperCase(),
      numero: numeroPersonalizado.value
    } : null
  }

  cart.adicionarAoCarrinho(itemParaCarrinho, tamanhoSelecionado.value)
  alert(`Produto adicionado! Total: R$ ${precoFinal.value.toFixed(2)}`)
}

watch(() => route.params.slug, () => carregarProduto())
onMounted(() => carregarProduto())
</script>

<template>
  <div class="min-h-screen bg-atk-dark text-white font-sans pb-20">
    
    <div v-if="carregando" class="flex justify-center items-center h-[80vh]">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-atk-neon"></div>
    </div>

    <div v-else-if="erro || !produto" class="text-center py-20">
      <h2 class="text-2xl font-bold mb-4">😕 Produto Indisponível</h2>
      <router-link to="/produtos" class="text-atk-neon hover:underline">Voltar ao catálogo</router-link>
    </div>

    <div v-else>
      
      <div class="max-w-7xl mx-auto px-4 py-6 text-xs md:text-sm text-gray-500 uppercase tracking-widest flex flex-wrap gap-2">
        <router-link to="/" class="hover:text-white">Home</router-link> / 
        <router-link to="/produtos" class="hover:text-white">Catálogo</router-link> / 
        <span class="text-atk-neon font-bold truncate">{{ produto.name }}</span>
      </div>

      <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
        
        <div class="lg:col-span-7 space-y-4">
          <div class="relative group bg-[#1a1a1a] rounded-xl border border-white/5 aspect-square overflow-hidden">
             <div 
               ref="scrollContainer"
               @scroll="onScroll"
               class="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
             >
               <div 
                 v-for="(img, index) in todasImagens" 
                 :key="index"
                 class="w-full h-full flex-shrink-0 snap-center flex items-center justify-center p-6"
               >
                 <img :src="img" :alt="produto.name" class="max-w-full max-h-full object-contain drop-shadow-2xl" />
               </div>
             </div>

             <div class="absolute top-4 left-4 bg-atk-neon text-atk-dark text-xs font-bold px-3 py-1 rounded uppercase shadow-lg z-10">
               {{ produto.league }}
             </div>

             <button v-if="imagemAtualIndex > 0" @click="selecionarImagem(imagemAtualIndex - 1)" class="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full">❮</button>
             <button v-if="imagemAtualIndex < todasImagens.length - 1" @click="selecionarImagem(imagemAtualIndex + 1)" class="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full">❯</button>

             <div class="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-10">
               <span v-for="(_, idx) in todasImagens" :key="idx" class="block w-2 h-2 rounded-full transition-all" :class="idx === imagemAtualIndex ? 'bg-atk-neon w-4' : 'bg-gray-500'"></span>
             </div>
          </div>

          <div v-if="todasImagens.length > 1" class="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            <button 
              v-for="(img, index) in todasImagens" :key="index"
              @click="selecionarImagem(index)"
              class="w-20 h-20 flex-shrink-0 rounded-lg border-2 overflow-hidden p-1 bg-[#1a1a1a] transition-all"
              :class="imagemAtualIndex === index ? 'border-atk-neon opacity-100' : 'border-transparent opacity-60 hover:opacity-100'"
            >
              <img :src="img" class="w-full h-full object-contain" />
            </button>
          </div>
        </div>

        <div class="lg:col-span-5 flex flex-col gap-6">
          
          <div>
            <h1 class="text-3xl md:text-4xl font-extrabold uppercase leading-none mb-2">{{ produto.name }}</h1>
            <div class="flex items-center gap-4 text-sm">
              <span class="text-gray-400">{{ produto.category }}</span>
              <div class="flex text-yellow-400">★★★★★ <span class="text-gray-600 ml-2">(14 avaliações)</span></div>
            </div>
          </div>

          <div class="bg-[#1a1a1a] p-5 rounded-xl border border-white/10">
            <p class="text-gray-500 text-sm mb-1">Preço Total:</p>
            <div class="flex items-baseline gap-2">
              <span class="text-atk-neon text-5xl font-extrabold tracking-tighter">
                R$ {{ precoFinal.toFixed(2) }}
              </span>
            </div>
            <p class="text-green-500 text-xs font-bold mt-2">em até 3x sem juros ou 5% OFF no PIX</p>
          </div>

          <div>
            <h3 class="font-bold text-white uppercase tracking-wider text-sm mb-3">1. Escolha a Versão</h3>
            <div class="grid grid-cols-2 gap-3">
              <div @click="versaoSelecionada = 'torcedor'" class="border rounded-lg p-3 cursor-pointer transition-all relative" :class="versaoSelecionada === 'torcedor' ? 'border-atk-neon bg-atk-neon/5' : 'border-white/10 bg-[#151515]'">
                <p class="font-bold uppercase text-sm">Torcedor</p>
                <span class="absolute top-3 right-3 font-bold text-white text-xs">R$ 139,90</span>
              </div>
              <div @click="versaoSelecionada = 'jogador'" class="border rounded-lg p-3 cursor-pointer transition-all relative" :class="versaoSelecionada === 'jogador' ? 'border-atk-neon bg-atk-neon/5' : 'border-white/10 bg-[#151515]'">
                <p class="font-bold uppercase text-sm text-atk-neon">Jogador</p>
                <span class="absolute top-3 right-3 font-bold text-white text-xs">R$ 179,90</span>
              </div>
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-3">
              <h3 class="font-bold text-white uppercase tracking-wider text-sm">2. Tamanho</h3>
              <button @click="showGuiaMedidas = true" class="flex items-center gap-2 text-xs font-bold text-atk-neon border border-atk-neon/30 px-3 py-1.5 rounded hover:bg-atk-neon hover:text-atk-dark transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg> Guia
              </button>
            </div>
            <div class="flex flex-wrap gap-3">
              <button v-for="tamanho in listaTamanhos" :key="tamanho" @click="tamanhoSelecionado = tamanho" class="w-12 h-12 rounded border-2 flex items-center justify-center font-bold transition-all" :class="tamanhoSelecionado === tamanho ? 'border-atk-neon bg-atk-neon text-atk-dark shadow-neon' : 'border-gray-700 text-gray-400 hover:border-white hover:text-white'">{{ tamanho }}</button>
            </div>
          </div>

          <div class="bg-[#151515] p-4 rounded-lg border border-dashed border-white/20">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <input type="checkbox" id="personalizar" v-model="querPersonalizar" class="w-4 h-4 accent-atk-neon cursor-pointer">
                <label for="personalizar" class="font-bold uppercase text-sm cursor-pointer select-none">Personalizar (+ R$ 17,00)</label>
              </div>
            </div>
            <div v-if="querPersonalizar" class="grid grid-cols-3 gap-3 mt-4 animate-fade-in-down">
              <div class="col-span-2"><input v-model="nomePersonalizado" type="text" placeholder="NOME" maxlength="12" class="w-full bg-black border border-white/20 rounded p-2 text-white uppercase focus:border-atk-neon outline-none" /></div>
              <div class="col-span-1"><input v-model="numeroPersonalizado" type="number" placeholder="10" max="99" class="w-full bg-black border border-white/20 rounded p-2 text-white text-center focus:border-atk-neon outline-none" /></div>
            </div>
          </div>

          <div>
            <h3 class="font-bold text-white uppercase tracking-wider text-sm mb-2">4. Patch (+ R$ 6,00)</h3>
            <select v-model="patchSelecionado" class="w-full bg-[#151515] border border-white/20 text-white p-3 rounded-lg outline-none focus:border-atk-neon cursor-pointer">
              <option value="" disabled selected>Selecione um patch (Opcional)</option>
              <option v-for="patch in patchesDisponiveis" :key="patch" :value="patch">{{ patch }}</option>
            </select>
          </div>

          <button @click="adicionarAoCarrinho" :disabled="!tamanhoSelecionado" class="w-full bg-atk-neon text-atk-dark py-5 rounded-xl font-extrabold uppercase tracking-widest text-lg hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(0,255,194,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">Adicionar ao Carrinho</button>

          <div class="bg-[#101010] border border-white/10 rounded-lg p-4">
            <h3 class="font-bold text-white text-xs uppercase mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
              Calcular Frete e Prazo
            </h3>
            <div class="flex gap-2 mb-2">
              <input v-model="cep" @input="formatarCep" maxlength="9" type="text" placeholder="00000-000" class="bg-black border border-white/20 text-white px-3 py-2 rounded flex-grow outline-none focus:border-atk-neon text-sm">
              <button @click="calcularFrete" class="bg-gray-700 hover:bg-white hover:text-black text-white px-4 py-2 rounded text-xs font-bold uppercase transition">{{ calculandoFrete ? '...' : 'Calcular' }}</button>
            </div>
            
            <div v-if="freteCalculado" class="text-xs bg-atk-neon/10 border border-atk-neon/30 p-3 rounded mt-2 animate-fade-in-down">
              <p class="text-white font-bold mb-1">
                 📅 <span class="text-atk-neon text-sm">{{ freteCalculado.prazo }}</span>
              </p>
              <div class="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-atk-neon/20 text-center">
                 <div><span class="block text-gray-400 text-[10px]">1 Unid.</span><span class="font-bold">R$ 25,00</span></div>
                 <div><span class="block text-gray-400 text-[10px]">2 Unid.</span><span class="font-bold">R$ 20,00</span></div>
                 <div><span class="block text-gray-400 text-[10px]">3+ Unid.</span><span class="font-extrabold text-green-400">GRÁTIS</span></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 mb-20 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="bg-[#151515] rounded-xl overflow-hidden border border-white/5 relative h-80 md:h-auto">
          <img src="https://images.unsplash.com/photo-1579952363873-27f3bade8f55?q=80&w=2070" class="w-full h-full object-cover grayscale opacity-40" />
          <div class="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black via-black/50 to-transparent">
             <h3 class="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">Tecnologia de <span class="text-atk-neon">Elite</span></h3>
             <p class="text-gray-300 text-sm leading-relaxed">Tecido respirável de alta performance com tecnologia DRI-FIT, garantindo frescor e leveza. Escudo bordado em alta definição e costuras reforçadas para máxima durabilidade.</p>
          </div>
        </div>
        <div class="bg-[#151515] rounded-xl border border-white/5 p-8">
           <h3 class="text-xl font-bold text-white mb-6 uppercase flex items-center gap-2">Cuidados com o Manto</h3>
           <div class="space-y-4">
             <div class="flex items-start gap-4"><div class="bg-white/5 p-2 rounded text-2xl">💧</div><div><p class="font-bold text-sm text-white">Lavar à mão</p><p class="text-xs text-gray-500">Água fria sempre.</p></div></div>
             <div class="flex items-start gap-4"><div class="bg-white/5 p-2 rounded text-2xl">🚫</div><div><p class="font-bold text-sm text-white">Não usar alvejante</p><p class="text-xs text-gray-500">Químicos danificam o tecido.</p></div></div>
             <div class="flex items-start gap-4"><div class="bg-white/5 p-2 rounded text-2xl">🔥</div><div><p class="font-bold text-sm text-white">Não passar ferro na estampa</p><p class="text-xs text-gray-500">Se precisar, use do avesso.</p></div></div>
           </div>
        </div>
      </div>

      <div v-if="relacionados.length > 0" class="max-w-7xl mx-auto px-4 border-t border-white/10 pt-12">
        <h3 class="text-2xl font-extrabold uppercase tracking-tighter mb-8 text-center">Sugestões para <span class="text-atk-neon">você</span></h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <ProductCard v-for="item in relacionados" :key="item.id" :product="item" />
        </div>
      </div>

    </div>

    <div v-if="showGuiaMedidas" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showGuiaMedidas = false">
      <div class="bg-[#1a1a1a] p-6 rounded-xl max-w-2xl w-full border border-atk-neon/30 shadow-2xl relative animate-fade-in-down">
        <button @click="showGuiaMedidas = false" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
        <h3 class="text-2xl font-bold text-center text-white mb-6 uppercase">Guia de Medidas</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-center text-sm">
            <thead>
              <tr class="bg-atk-neon text-atk-dark font-bold uppercase"><th class="p-3">Tamanho</th><th class="p-3">Largura</th><th class="p-3">Altura</th><th class="p-3">Sugestão</th></tr>
            </thead>
            <tbody class="text-gray-300">
              <tr class="border-b border-white/10"><td>P</td><td>48-50 cm</td><td>69-71 cm</td><td>1,62 - 1,70m</td></tr>
              <tr class="border-b border-white/10"><td>M</td><td>53-55 cm</td><td>71-73 cm</td><td>1,70 - 1,76m</td></tr>
              <tr class="border-b border-white/10"><td>G</td><td>56-58 cm</td><td>73-75 cm</td><td>1,76 - 1,82m</td></tr>
              <tr class="border-b border-white/10"><td>GG</td><td>58-60 cm</td><td>75-78 cm</td><td>1,82 - 1,90m</td></tr>
              <tr><td>XG</td><td>60-62 cm</td><td>78-81 cm</td><td>1,90 - 1,95m</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.custom-scrollbar::-webkit-scrollbar { height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
.animate-fade-in-down { animation: fadeInDown 0.3s ease-out; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
</style>