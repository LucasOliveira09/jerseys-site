<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useCartStore } from '../stores/cart'
import ProductCard from '../components/ProductCard.vue'
import Swal from 'sweetalert2'
import { useHead } from '@vueuse/head'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const produto = ref(null)
const relacionados = ref([])
const reviews = ref([]) 
const user = ref(null) 
const carregando = ref(true)
const erro = ref('')

const relatedContainer = ref(null)

// --- SEO ---
useHead({
  title: computed(() => produto.value ? `${produto.value.name} | LGA Sports` : 'Carregando...'),
  meta: [
    { name: 'description', content: computed(() => produto.value ? `Compre ${produto.value.name}.` : '') },
    { property: 'og:image', content: computed(() => produto.value ? produto.value.image_cover : '') }
  ]
})

const imagemAtualIndex = ref(0) 
const scrollContainer = ref(null) 
const showGuiaMedidas = ref(false)

// --- OPÇÕES ---
const tamanhoSelecionado = ref('')
const versaoSelecionada = ref('torcedor')
const querPersonalizar = ref(false)
const nomePersonalizado = ref('')
const numeroPersonalizado = ref('')
const patchSelecionado = ref('')

// --- AVALIAÇÃO ---
const novaAvaliacao = ref({ rating: 5, comment: '' })
const enviandoReview = ref(false)

// --- FRETE ---
const cep = ref('')
const calculandoFrete = ref(false)
const freteCalculado = ref(null)

const tamanhosPadrao = ['P', 'M', 'G', 'GG', 'XG']
const patchesDisponiveis = ['Nenhum', 'Champions League', 'Libertadores', 'Brasileirão', 'Premier League', 'Mundial FIFA']

const showAlert = (title, text, icon = 'info') => Swal.fire({ title, text, icon, background: '#151515', color: '#fff', confirmButtonColor: '#00ffc2' })

// --- MEDIDAS ---
const tabelasMedidas = {
  torcedor: { titulo: 'Versão Fan (Torcedor)', headers: ['Tam.', 'Largura', 'Comp.', 'Altura'], rows: [{ t: 'P', l: '53-55', c: '69-71', a: '162-170' }, { t: 'M', l: '55-57', c: '71-73', a: '170-176' }, { t: 'G', l: '57-58', c: '73-75', a: '176-182' }, { t: 'GG', l: '58-60', c: '75-78', a: '182-190' }, { t: '2XL', l: '60-62', c: '78-81', a: '190-195' }] },
  jogador: { titulo: 'Versão Player (Jogador)', headers: ['Tam.', 'Largura', 'Comp.', 'Altura'], rows: [{ t: 'P', l: '49-51', c: '67-69', a: '162-170' }, { t: 'M', l: '51-53', c: '69-71', a: '170-175' }, { t: 'G', l: '53-55', c: '71-73', a: '175-180' }, { t: 'GG', l: '55-57', c: '73-76', a: '180-185' }, { t: '2XL', l: '57-60', c: '76-78', a: '185-190' }] },
  infantil: { titulo: 'Kit Infantil', headers: ['Tam.', 'Idade', 'Largura', 'Comp.'], rows: [{ t: '16', i: '3-4 anos', l: '35', c: '44' }, { t: '22', i: '6-7 anos', l: '41', c: '53' }, { t: '28', i: '12-13 anos', l: '47', c: '62' }] }
}

// LÓGICA NOVA: Verifica se é produto especial (Kids, Retro, Player)
const ehVersaoUnica = computed(() => {
  if (!produto.value) return false
  const cat = (produto.value.category || '').toLowerCase()
  const nome = (produto.value.name || '').toLowerCase()
  
  return cat.includes('kid') || cat.includes('infantil') || 
         cat.includes('retr') || cat.includes('retro') ||
         nome.includes('player') || nome.includes('jogador')
})

const tabelaAtiva = computed(() => {
  if (!produto.value) return tabelasMedidas.torcedor
  const cat = (produto.value.category || '').toLowerCase()
  if (cat.includes('kid') || cat.includes('infantil')) return tabelasMedidas.infantil
  if (versaoSelecionada.value === 'jogador') return tabelasMedidas.jogador
  return tabelasMedidas.torcedor
})

const mediaEstrelas = computed(() => {
  if (!reviews.value?.length) return 5.0
  const total = reviews.value.reduce((acc, r) => acc + (r.rating || 0), 0)
  return (total / reviews.value.length).toFixed(1)
})

// --- CARREGAMENTO ---
async function carregarProduto() {
  try {
    carregando.value = true
    erro.value = ''
    resetarEstados()

    const { data: userData } = await supabase.auth.getUser()
    user.value = userData.user

    const { data, error } = await supabase.from('produtos').select('*').eq('slug', route.params.slug).single()
    if (error) throw error
    produto.value = data
    imagemAtualIndex.value = 0

    const { data: reviewsData } = await supabase.from('reviews')
      .select('id, rating, comment, created_at, profiles ( full_name )') 
      .eq('product_id', data.id).order('created_at', { ascending: false })
    reviews.value = reviewsData || []

    if (produto.value) {
      const termoBusca = produto.value.name.split(' ')[1] || produto.value.name.split(' ')[0]
      buscarRelacionados(produto.value.league, termoBusca, produto.value.category, produto.value.id)
    }
  } catch (err) {
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
  showGuiaMedidas.value = false
  novaAvaliacao.value = { rating: 5, comment: '' }
}

async function buscarRelacionados(liga, termoNome, categoria, idAtual) {
  const { data } = await supabase.from('produtos').select('*').eq('active', true).eq('category', categoria).neq('id', idAtual).or(`league.eq.${liga},name.ilike.%${termoNome}%`).limit(12)
  relacionados.value = data || []
}

// --- PREÇO (ATUALIZADO COM TRAVA) ---
const precoFinal = computed(() => {
  if (!produto.value) return 0
  let total = Number(produto.value.price_sale) > 0 ? Number(produto.value.price_sale) : Number(produto.value.price)

  // Só adiciona valor de jogador se NÃO for versão única
  if (!ehVersaoUnica.value && versaoSelecionada.value === 'jogador') {
    total += 40.00 
  }

  if (querPersonalizar.value) total += 17.00
  if (patchSelecionado.value && patchSelecionado.value !== 'Nenhum') total += 6.00
  return total
})

// --- CARRINHO ---
function adicionarAoCarrinho() {
  if (!tamanhoSelecionado.value) return showAlert('Atenção', 'Selecione um tamanho.', 'warning')
  if (querPersonalizar.value && (!nomePersonalizado.value || !numeroPersonalizado.value)) return showAlert('Incompleto', 'Preencha a personalização.', 'warning')

  const itemParaCarrinho = {
    ...produto.value, price_sale: precoFinal.value, 
    // Se for versão única, força 'torcedor' (ou padrão) para evitar erro no banco/texto
    versao: ehVersaoUnica.value ? 'padrão' : versaoSelecionada.value,
    patch: patchSelecionado.value !== 'Nenhum' ? patchSelecionado.value : null,
    personalizacao: querPersonalizar.value ? { nome: nomePersonalizado.value.toUpperCase(), numero: numeroPersonalizado.value } : null
  }
  cart.adicionarAoCarrinho(itemParaCarrinho, tamanhoSelecionado.value)
  Swal.fire({
    title: 'Adicionado!', text: `${produto.value.name} está no carrinho.`, icon: 'success',
    showCancelButton: true, confirmButtonText: 'Ir para o Carrinho', cancelButtonText: 'Continuar Comprando',
    confirmButtonColor: '#00ffc2', cancelButtonColor: '#333', background: '#151515', color: '#fff'
  }).then((r) => { if (r.isConfirmed) router.push('/carrinho') })
}

// --- UTILS ---
function scrollRelacionados(direcao) {
  if (relatedContainer.value) relatedContainer.value.scrollBy({ left: direcao === 'dir' ? 300 : -300, behavior: 'smooth' })
}
async function enviarAvaliacao() {
  // ... (mesma lógica anterior)
}
const todasImagens = computed(() => {
  if (!produto.value) return []
  const capa = produto.value.image_cover
  let lista = [capa]
  if (produto.value.images_gallery) {
    let extras = []
    try {
      if (typeof produto.value.images_gallery === 'string') extras = JSON.parse(produto.value.images_gallery)
      else if (Array.isArray(produto.value.images_gallery)) extras = produto.value.images_gallery
    } catch (e) {}
    extras.forEach(img => { if (img !== capa) lista.push(img) })
  }
  return lista
})
function selecionarImagem(index) { imagemAtualIndex.value = index; if (scrollContainer.value) scrollContainer.value.scrollTo({ left: scrollContainer.value.offsetWidth * index, behavior: 'smooth' }) }
function onScroll() { if (scrollContainer.value) imagemAtualIndex.value = Math.round(scrollContainer.value.scrollLeft / scrollContainer.value.offsetWidth) }
const listaTamanhos = computed(() => {
  if (!produto.value?.sizes) return tamanhosPadrao
  try {
    const parsed = typeof produto.value.sizes === 'string' ? JSON.parse(produto.value.sizes) : produto.value.sizes
    return Array.isArray(parsed) ? parsed : tamanhosPadrao
  } catch (e) { return tamanhosPadrao }
})
function formatarCep() { let v = cep.value.replace(/\D/g, ""); if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2"); cep.value = v }
function calcularFrete() { 
  if (cep.value.length < 9) { showAlert('CEP Inválido', 'Digite o CEP completo.', 'warning'); return }
  calculandoFrete.value = true; freteCalculado.value = null
  setTimeout(() => { calculandoFrete.value = false; freteCalculado.value = { prazo: '15-25 dias úteis', regra: 'Frete Grátis na compra de 3 peças!' } }, 1000)
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
              <div ref="scrollContainer" @scroll="onScroll" class="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar">
                <div v-for="(img, index) in todasImagens" :key="index" class="w-full h-full flex-shrink-0 snap-center flex items-center justify-center p-6">
                  <img :src="img" :alt="produto.name" class="max-w-full max-h-full object-contain drop-shadow-2xl" />
                </div>
              </div>
              <button v-if="imagemAtualIndex > 0" @click="selecionarImagem(imagemAtualIndex - 1)" class="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full z-20">❮</button>
              <button v-if="imagemAtualIndex < todasImagens.length - 1" @click="selecionarImagem(imagemAtualIndex + 1)" class="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full z-20">❯</button>
              <div class="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-10">
                <span v-for="(_, idx) in todasImagens" :key="idx" class="block w-2 h-2 rounded-full transition-all" :class="idx === imagemAtualIndex ? 'bg-atk-neon w-4' : 'bg-gray-500'"></span>
              </div>
          </div>
          <div v-if="todasImagens.length > 1" class="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            <button v-for="(img, index) in todasImagens" :key="index" @click="selecionarImagem(index)" class="w-20 h-20 flex-shrink-0 rounded-lg border-2 overflow-hidden p-1 bg-[#1a1a1a] transition-all" :class="imagemAtualIndex === index ? 'border-atk-neon opacity-100' : 'border-transparent opacity-60 hover:opacity-100'">
              <img :src="img" class="w-full h-full object-contain" />
            </button>
          </div>
        </div>

        <div class="lg:col-span-5 flex flex-col gap-6">
          <div>
            <h1 class="text-3xl md:text-4xl font-extrabold uppercase leading-none mb-2">{{ produto.name }}</h1>
            <div class="flex items-center gap-4 text-sm">
              <span class="text-gray-400">{{ produto.category }}</span>
              <div class="flex items-center text-yellow-400 font-bold"><span class="text-lg mr-1">★</span> {{ mediaEstrelas }} <span class="text-gray-500 font-normal ml-2">({{ reviews.length }} avaliações)</span></div>
            </div>
          </div>

          <div class="bg-[#1a1a1a] p-5 rounded-xl border border-white/10">
            <div class="flex items-baseline gap-2"><span class="text-atk-neon text-5xl font-extrabold tracking-tighter">R$ {{ precoFinal.toFixed(2) }}</span></div>
            <p class="text-green-500 text-xs font-bold mt-2">em até 2x sem juros ou 2% OFF no PIX</p>
          </div>

          <div v-if="!ehVersaoUnica">
            <h3 class="font-bold text-white uppercase tracking-wider text-sm mb-3">1. Escolha a Versão</h3>
            <div class="grid grid-cols-2 gap-3">
              <div @click="versaoSelecionada = 'torcedor'" class="border rounded-lg p-3 cursor-pointer transition-all relative" :class="versaoSelecionada === 'torcedor' ? 'border-atk-neon bg-atk-neon/5' : 'border-white/10 bg-[#151515]'">
                <p class="font-bold uppercase text-sm">Torcedor</p><span class="absolute top-3 right-3 font-bold text-white text-xs">Padrão</span>
              </div>
              <div @click="versaoSelecionada = 'jogador'" class="border rounded-lg p-3 cursor-pointer transition-all relative" :class="versaoSelecionada === 'jogador' ? 'border-atk-neon bg-atk-neon/5' : 'border-white/10 bg-[#151515]'">
                <p class="font-bold uppercase text-sm text-atk-neon">Jogador</p><span class="absolute top-3 right-3 font-bold text-white text-xs">+ R$ 40,00</span>
              </div>
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-3">
              <h3 class="font-bold text-white uppercase tracking-wider text-sm">2. Tamanho</h3>
              <button @click="showGuiaMedidas = true" class="flex items-center gap-2 text-xs font-bold text-atk-neon border border-atk-neon/30 px-3 py-1.5 rounded hover:bg-atk-neon hover:text-atk-dark transition">!- Tabela de Medidas -!</button>
            </div>
            <div class="flex flex-wrap gap-3">
              <button v-for="tamanho in listaTamanhos" :key="tamanho" @click="tamanhoSelecionado = tamanho" class="w-12 h-12 rounded border-2 flex items-center justify-center font-bold transition-all" :class="tamanhoSelecionado === tamanho ? 'border-atk-neon bg-atk-neon text-atk-dark shadow-neon' : 'border-gray-700 text-gray-400 hover:border-white hover:text-white'">{{ tamanho }}</button>
            </div>
          </div>

          <div class="bg-[#151515] p-4 rounded-lg border border-dashed border-white/20">
            <div class="flex items-center gap-2 mb-2">
               <input type="checkbox" id="personalizar" v-model="querPersonalizar" class="w-4 h-4 accent-atk-neon"><label for="personalizar" class="font-bold uppercase text-sm">Personalizar (+ R$ 17,00)</label>
            </div>
            <div v-if="querPersonalizar" class="grid grid-cols-3 gap-3 mt-4 animate-fade-in-down">
               <div class="col-span-2"><input v-model="nomePersonalizado" type="text" placeholder="NOME" class="w-full bg-black border border-white/20 rounded p-2 text-white uppercase outline-none focus:border-atk-neon" /></div>
               <div class="col-span-1"><input v-model="numeroPersonalizado" type="number" placeholder="10" class="w-full bg-black border border-white/20 rounded p-2 text-white text-center outline-none focus:border-atk-neon" /></div>
            </div>
          </div>

          <div>
            <h3 class="font-bold text-white uppercase tracking-wider text-sm mb-2">4. Patch (+ R$ 6,00)</h3>
            <select v-model="patchSelecionado" class="w-full bg-[#151515] border border-white/20 text-white p-3 rounded-lg outline-none focus:border-atk-neon"><option value="" disabled selected>Selecione (Opcional)</option><option v-for="patch in patchesDisponiveis" :key="patch" :value="patch">{{ patch }}</option></select>
          </div>

          <button @click="adicionarAoCarrinho" :disabled="!tamanhoSelecionado" class="w-full bg-atk-neon text-atk-dark py-5 rounded-xl font-extrabold uppercase tracking-widest text-lg hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(0,255,194,0.3)] disabled:opacity-50">Adicionar ao Carrinho</button>
          
          <div class="bg-[#101010] border border-white/10 rounded-lg p-4">
              <div class="flex gap-2 mb-2">
                <input v-model="cep" @input="formatarCep" maxlength="9" type="text" placeholder="00000-000" class="bg-black border border-white/20 text-white px-3 py-2 rounded flex-grow outline-none focus:border-atk-neon text-sm">
                <button @click="calcularFrete" class="bg-gray-700 hover:bg-white hover:text-black text-white px-4 py-2 rounded text-xs font-bold uppercase transition">{{ calculandoFrete ? '...' : 'Calcular' }}</button>
              </div>
              <div v-if="freteCalculado" class="text-xs bg-atk-neon/10 border border-atk-neon/30 p-3 rounded mt-2 animate-fade-in-down"><p class="text-white font-bold">📅 <span class="text-atk-neon text-sm">{{ freteCalculado.prazo }}</span></p></div>
          </div>
        </div>
      </div>

      </div>

    <div v-if="showGuiaMedidas" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showGuiaMedidas = false">
       <div class="bg-[#1a1a1a] p-6 rounded-xl max-w-2xl w-full border border-atk-neon/30 shadow-2xl relative animate-fade-in-down">
          <button @click="showGuiaMedidas = false" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
          <h3 class="text-2xl font-bold text-center text-white mb-2 uppercase">Guia de Medidas</h3>
          <p class="text-center text-atk-neon text-sm font-bold mb-6 uppercase tracking-wider">{{ tabelaAtiva.titulo }}</p>
          <div class="overflow-x-auto">
             <table class="w-full text-center text-sm">
               <thead><tr class="bg-atk-neon text-atk-dark font-bold uppercase"><th v-for="header in tabelaAtiva.headers" :key="header" class="p-3">{{ header }}</th></tr></thead>
               <tbody class="text-gray-300">
                  <tr v-for="(row, idx) in tabelaAtiva.rows" :key="idx" class="border-b border-white/10 hover:bg-white/5 transition">
                     <td class="p-3 font-bold text-white">{{ row.t }}</td>
                     <template v-if="tabelaAtiva === tabelasMedidas.infantil"><td>{{ row.i }}</td><td>{{ row.l }}</td><td>{{ row.c }}</td></template>
                     <template v-else><td>{{ row.l }}</td><td>{{ row.c }}</td><td>{{ row.a }}</td></template>
                  </tr>
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