<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useCartStore } from '../stores/cart'
import ProductCard from '../components/ProductCard.vue'
import Swal from 'sweetalert2'
import { useHead } from '@vueuse/head' // <--- 1. IMPORT NOVO

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const produto = ref(null)
const relacionados = ref([])
const reviews = ref([]) 
const user = ref(null) 
const carregando = ref(true)
const erro = ref('')

// --- SEO DINÂMICO (NOVO) ---
// Isso atualiza a aba e o Google automaticamente
useHead({
  title: computed(() => produto.value ? `${produto.value.name} | LGA Sports` : 'Carregando... | LGA Sports'),
  meta: [
    {
      name: 'description',
      content: computed(() => produto.value 
        ? `Compre agora ${produto.value.name}. Versão ${produto.value.category || 'Oficial'}. Personalize com seu nome e número. Entrega garantida para todo o Brasil.` 
        : 'Loja de artigos esportivos')
    },
    // Tags para WhatsApp / Facebook (Open Graph)
    {
      property: 'og:title',
      content: computed(() => produto.value ? produto.value.name : 'LGA Sports')
    },
    {
      property: 'og:description',
      content: computed(() => produto.value 
        ? `Garanta seu manto ${produto.value.name} com o melhor preço. Acesse!` 
        : 'Confira nossos produtos.')
    },
    {
      property: 'og:image',
      content: computed(() => produto.value ? produto.value.image_cover : '')
    },
    {
      property: 'og:url',
      content: computed(() => window.location.href)
    }
  ]
})

// --- RESTANTE DO SEU CÓDIGO (Mantido igual) ---
const imagemAtualIndex = ref(0) 
const scrollContainer = ref(null) 
const showGuiaMedidas = ref(false)

// ... (Copie o resto das suas variáveis: tamanhoSelecionado, versaoSelecionada, tabelasMedidas, etc.)
const tamanhoSelecionado = ref('')
const versaoSelecionada = ref('torcedor')
const querPersonalizar = ref(false)
const nomePersonalizado = ref('')
const numeroPersonalizado = ref('')
const patchSelecionado = ref('')
const novaAvaliacao = ref({ rating: 5, comment: '' })
const enviandoReview = ref(false)
const cep = ref('')
const calculandoFrete = ref(false)
const freteCalculado = ref(null)
const tamanhosPadrao = ['P', 'M', 'G', 'GG', 'XG']
const patchesDisponiveis = ['Nenhum', 'Champions League', 'Libertadores', 'Brasileirão', 'Premier League', 'Mundial FIFA']

// Mantenha suas funções auxiliares (showAlert, tabelasMedidas, computed properties, etc.)
// ...
const showAlert = (title, text, icon = 'info') => {
  return Swal.fire({
    title: title, text: text, icon: icon,
    background: '#151515', color: '#fff', confirmButtonColor: '#00ffc2', confirmButtonText: 'OK'
  })
}

// (Mantenha tabelasMedidas e tabelaAtiva aqui...)
// ...

const mediaEstrelas = computed(() => {
  if (!reviews.value || reviews.value.length === 0) return 5.0
  const total = reviews.value.reduce((acc, r) => acc + (r.rating || 0), 0)
  return (total / reviews.value.length).toFixed(1)
})

async function carregarProduto() {
  try {
    carregando.value = true
    erro.value = ''
    resetarEstados()

    const { data: userData } = await supabase.auth.getUser()
    user.value = userData.user

    const { data, error } = await supabase
      .from('produtos') 
      .select('*')
      .eq('slug', route.params.slug)
      .single()

    if (error) throw error
    produto.value = data
    imagemAtualIndex.value = 0

    // Busca Reviews
    const { data: reviewsData } = await supabase.from('reviews')
      .select('id, rating, comment, created_at, profiles (full_name)') 
      .eq('product_id', data.id).order('created_at', { ascending: false })
    reviews.value = reviewsData || []

    // Busca Relacionados
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

// ... (Mantenha o restante das funções: resetarEstados, buscarRelacionados, enviarAvaliacao, todasImagens, etc.)
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

async function buscarRelacionados(liga, termoNome, idAtual) {
  const { data } = await supabase.from('produtos').select('*').eq('active', true).neq('id', idAtual)
    .or(`league.eq.${liga},name.ilike.%${termoNome}%`).limit(4)
  relacionados.value = data || []
}

async function enviarAvaliacao() {
  if (!user.value) { router.push('/login'); return }
  if (!novaAvaliacao.value.comment.trim()) { showAlert('Ops...', 'Escreva um comentário.', 'warning'); return }
  enviandoReview.value = true
  try {
    const { error } = await supabase.from('reviews').insert({
      product_id: produto.value.id, user_id: user.value.id,
      rating: novaAvaliacao.value.rating, comment: novaAvaliacao.value.comment
    })
    if (error) throw error
    await carregarProduto() 
    showAlert('Sucesso!', 'Avaliação publicada.', 'success')
    novaAvaliacao.value.comment = ''; novaAvaliacao.value.rating = 5
  } catch (err) {
    showAlert('Erro', 'Não foi possível enviar.', 'error')
  } finally {
    enviandoReview.value = false
  }
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

function selecionarImagem(index) {
  imagemAtualIndex.value = index
  if (scrollContainer.value) scrollContainer.value.scrollTo({ left: scrollContainer.value.offsetWidth * index, behavior: 'smooth' })
}
function onScroll() {
  if (scrollContainer.value) imagemAtualIndex.value = Math.round(scrollContainer.value.scrollLeft / scrollContainer.value.offsetWidth)
}

const listaTamanhos = computed(() => {
  if (!produto.value || !produto.value.sizes) return tamanhosPadrao
  try {
    const parsed = typeof produto.value.sizes === 'string' ? JSON.parse(produto.value.sizes) : produto.value.sizes
    return Array.isArray(parsed) ? parsed : tamanhosPadrao
  } catch (e) { return tamanhosPadrao }
})

const precoFinal = computed(() => {
  let total = 0
  if (versaoSelecionada.value === 'jogador') total += 179.90
  else total += 139.90
  if (querPersonalizar.value) total += 17.00
  if (patchSelecionado.value && patchSelecionado.value !== 'Nenhum') total += 6.00
  return total
})

function formatarCep() {
  let v = cep.value.replace(/\D/g, "")
  if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2")
  cep.value = v
}

function calcularFrete() {
  if (cep.value.length < 9) { showAlert('CEP Inválido', 'Digite o CEP completo.', 'warning'); return }
  calculandoFrete.value = true; freteCalculado.value = null
  const hoje = new Date(); const dataMin = new Date(hoje); dataMin.setDate(hoje.getDate() + 25)
  const dataMax = new Date(hoje); dataMax.setDate(hoje.getDate() + 30)
  const opcoes = { day: '2-digit', month: '2-digit' }
  setTimeout(() => {
    calculandoFrete.value = false
    freteCalculado.value = { prazo: `Chega entre ${dataMin.toLocaleDateString('pt-BR', opcoes)} e ${dataMax.toLocaleDateString('pt-BR', opcoes)}`, regra: 'Compre 3 camisas e ganhe Frete Grátis!' }
  }, 1000)
}

function adicionarAoCarrinho() {
  if (!tamanhoSelecionado.value) return showAlert('Atenção', 'Selecione um tamanho.', 'warning')
  if (querPersonalizar.value && (!nomePersonalizado.value || !numeroPersonalizado.value)) return showAlert('Incompleto', 'Preencha a personalização.', 'warning')

  const itemParaCarrinho = {
    ...produto.value, price_sale: precoFinal.value, versao: versaoSelecionada.value,
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
                  </div>
               </div>
            
            <div class="lg:col-span-5 flex flex-col gap-6">
               <div>
                  <h1 class="text-3xl md:text-4xl font-extrabold uppercase leading-none mb-2">{{ produto.name }}</h1>
                  </div>
               <div class="bg-[#1a1a1a] p-5 rounded-xl border border-white/10">
                  <div class="flex items-baseline gap-2"><span class="text-atk-neon text-5xl font-extrabold tracking-tighter">R$ {{ precoFinal.toFixed(2) }}</span></div>
                  <p class="text-green-500 text-xs font-bold mt-2">em até 3x sem juros ou 5% OFF no PIX</p>
               </div>
               
               <div>
                  <h3 class="font-bold text-white uppercase tracking-wider text-sm mb-3">1. Escolha a Versão</h3>
                  <div class="grid grid-cols-2 gap-3">
                    <div @click="versaoSelecionada = 'torcedor'" class="border rounded-lg p-3 cursor-pointer transition-all relative" :class="versaoSelecionada === 'torcedor' ? 'border-atk-neon bg-atk-neon/5' : 'border-white/10 bg-[#151515]'">
                      <p class="font-bold uppercase text-sm">Torcedor</p><span class="absolute top-3 right-3 font-bold text-white text-xs">R$ 139,90</span>
                    </div>
                    <div @click="versaoSelecionada = 'jogador'" class="border rounded-lg p-3 cursor-pointer transition-all relative" :class="versaoSelecionada === 'jogador' ? 'border-atk-neon bg-atk-neon/5' : 'border-white/10 bg-[#151515]'">
                      <p class="font-bold uppercase text-sm text-atk-neon">Jogador</p><span class="absolute top-3 right-3 font-bold text-white text-xs">R$ 179,90</span>
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
        
        <div class="max-w-7xl mx-auto px-4 mb-20">
           <h2 class="text-2xl font-bold uppercase mb-8 border-b border-white/10 pb-4 flex items-center gap-2">
             Avaliações dos Torcedores <span class="text-sm bg-white/10 px-2 py-1 rounded text-atk-neon font-mono">{{ reviews.length }}</span>
           </h2>
           <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div class="bg-[#151515] p-6 rounded-xl border border-white/10 h-fit">
                 <h3 class="font-bold text-white mb-4">Deixe sua opinião</h3>
                 <div v-if="user">
                    <div class="flex gap-1 mb-4">
                      <button v-for="star in 5" :key="star" @click="novaAvaliacao.rating = star" class="text-2xl transition hover:scale-110" :class="star <= novaAvaliacao.rating ? 'text-yellow-400' : 'text-gray-600'">★</button>
                    </div>
                    <textarea v-model="novaAvaliacao.comment" rows="4" placeholder="O que achou do manto?" class="w-full bg-black border border-white/20 rounded p-3 text-white text-sm mb-4 outline-none focus:border-atk-neon"></textarea>
                    <button @click="enviarAvaliacao" :disabled="enviandoReview" class="w-full bg-white text-black font-bold py-2 rounded hover:bg-atk-neon hover:text-black transition uppercase text-xs">
                      {{ enviandoReview ? 'Enviando...' : 'Publicar Avaliação' }}
                    </button>
                 </div>
                 <div v-else class="text-center py-6">
                    <p class="text-gray-400 text-sm mb-4">Faça login para avaliar este produto.</p>
                    <router-link to="/login" class="text-atk-neon font-bold border border-atk-neon px-4 py-2 rounded uppercase text-xs hover:bg-atk-neon hover:text-black transition">Entrar</router-link>
                 </div>
              </div>
              <div class="md:col-span-2 space-y-4">
                 <div v-if="reviews.length === 0" class="text-gray-500 italic">Seja o primeiro a avaliar este manto!</div>
                 <div v-for="review in reviews" :key="review.id" class="bg-[#1a1a1a] p-4 rounded-lg border border-white/5 animate-fade-in">
                    <div class="flex justify-between items-start mb-2">
                       <div class="flex items-center gap-2">
                          <div class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center font-bold text-xs text-atk-neon">
                             {{ review.profiles?.full_name ? review.profiles.full_name[0].toUpperCase() : '?' }}
                          </div>
                          <div>
                             <p class="text-sm font-bold text-white">{{ review.profiles?.full_name || 'Torcedor Anônimo' }}</p>
                             <div class="flex text-yellow-400 text-xs"><span v-for="n in review.rating" :key="n">★</span></div>
                          </div>
                       </div>
                       <span class="text-[10px] text-gray-600">{{ new Date(review.created_at).toLocaleDateString() }}</span>
                    </div>
                    <p class="text-gray-300 text-sm leading-relaxed">"{{ review.comment }}"</p>
                 </div>
              </div>
           </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 mb-20 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div class="bg-[#151515] rounded-xl overflow-hidden border border-white/5 relative h-80 md:h-auto">
              <img src="https://images.unsplash.com/photo-1579952363873-27f3bade8f55?q=80&w=2070" class="w-full h-full object-cover grayscale opacity-40" />
              <div class="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black via-black/50 to-transparent">
                 <h3 class="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">Tecnologia de <span class="text-atk-neon">Elite</span></h3>
                 <p class="text-gray-300 text-sm leading-relaxed">Tecido respirável de alta performance com tecnologia DRI-FIT, garantindo frescor e leveza. Escudo bordado em alta definição e costuras reforçadas.</p>
              </div>
           </div>
           <div class="bg-[#151515] rounded-xl border border-white/5 p-8">
              <h3 class="text-xl font-bold text-white mb-6 uppercase flex items-center gap-2">Cuidados com o Manto</h3>
              <div class="space-y-4">
                 <div class="flex items-start gap-4"><div class="bg-white/5 p-2 rounded text-2xl">💧</div><div><p class="font-bold text-sm text-white">Lavar à mão</p><p class="text-xs text-gray-500">Água fria sempre.</p></div></div>
                 <div class="flex items-start gap-4"><div class="bg-white/5 p-2 rounded text-2xl">🚫</div><div><p class="font-bold text-sm text-white">Não usar alvejante</p><p class="text-xs text-gray-500">Químicos danificam.</p></div></div>
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
          <h3 class="text-2xl font-bold text-center text-white mb-2 uppercase">Guia de Medidas</h3>
          <p class="text-center text-atk-neon text-sm font-bold mb-6 uppercase tracking-wider">{{ tabelaAtiva.titulo }}</p>
          <div class="overflow-x-auto">
             <table class="w-full text-center text-sm">
                <thead><tr class="bg-atk-neon text-atk-dark font-bold uppercase"><th v-for="header in tabelaAtiva.headers" :key="header" class="p-3">{{ header }}</th></tr></thead>
                <tbody class="text-gray-300">
                   <tr v-for="(row, idx) in tabelaAtiva.rows" :key="idx" class="border-b border-white/10 hover:bg-white/5 transition">
                      <td class="p-3 font-bold text-white">{{ row.t }}</td>
                      <template v-if="tabelaAtiva === tabelasMedidas.infantil"><td>{{ row.i }}</td><td>{{ row.a }}</td><td>{{ row.l }}</td><td>{{ row.c }}</td></template>
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
/* Estilos mantidos do seu arquivo anterior */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.custom-scrollbar::-webkit-scrollbar { height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
.animate-fade-in-down { animation: fadeInDown 0.3s ease-out; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>