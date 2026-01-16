<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { supabase } from '../supabase'

const router = useRouter()
const cart = useCartStore()

const loading = ref(true)
const processing = ref(false)
const user = ref(null)
const profile = ref(null)
const paymentMethod = ref('credit_card') 

// Estados visuais
const step = ref(1) // 1: Resumo, 2: Pagamento (QR), 3: Sucesso
const pixQrCode = ref('')
const pixCodeString = ref('')
const cardData = ref({ number: '', holder: '', expiry: '', cvv: '' })

// Listener do Banco de Dados
let realtimeChannel = null

// --- CÁLCULO DO FRETE ---
const subtotal = computed(() => {
  return cart.itens.reduce((acc, item) => acc + (item.price_sale * item.quantidade), 0)
})

const valorFrete = computed(() => {
  const qtd = cart.quantidade
  if (qtd === 0) return 0
  if (qtd >= 3) return 0        
  if (qtd === 2) return 20.00   
  return 25.00                  
})

// Total com 5% de desconto no PIX
const totalGeral = computed(() => {
  const total = subtotal.value + valorFrete.value
  return paymentMethod.value === 'pix' ? total * 0.95 : total
})

// --- CARREGAMENTO INICIAL ---
onMounted(async () => {
  if (cart.quantidade === 0) { router.push('/carrinho'); return }

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) { router.push('/login'); return }
  user.value = currentUser

  const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
  profile.value = data
  loading.value = false
})

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})

// --- REALTIME: ESCUTAR O BANCO ---
function iniciarEscutaPagamento(orderId) {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
  
  realtimeChannel = supabase
    .channel('public:orders')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => {
        if (payload.new.payment_status === 'Aprovado' || payload.new.status === 'Pago') {
          finalizarSucesso()
        }
      }
    )
    .subscribe()
}

// --- MÁSCARAS ---
const maskCard = (e) => cardData.value.number = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19)
const maskDate = (e) => cardData.value.expiry = e.target.value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5)

// --- PROCESSAR PEDIDO ---
async function criarPedido() {
  if (!profile.value?.address || !profile.value?.number) {
    alert('Por favor, cadastre seu endereço de entrega.')
    router.push('/perfil') 
    return
  }

  processing.value = true

  try {
    // 1. Cria o pedido no Banco (Status Pendente)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.value.id,
        total: totalGeral.value,
        shipping_cost: valorFrete.value,
        status: 'Pendente',
        payment_method: paymentMethod.value,
        payment_status: 'Pendente',
        created_at: new Date()
      })
      .select().single()

    if (orderError) throw orderError

    // 2. Salva os Itens
    const items = cart.itens.map(i => ({
      order_id: order.id,
      product_id: i.id,
      quantity: i.quantidade,
      price: i.price_sale,
      size: i.tamanhoEscolhido,
      customization: i.personalizacao
    }))
    await supabase.from('order_items').insert(items)

    // 3. Lógica do PIX
    if (paymentMethod.value === 'pix') {
      
      // Validações e Formatação para o Mercado Pago
      const valorFormatado = Number(totalGeral.value.toFixed(2))
      const emailPagador = user.value.email || 'email_teste_backup@test.com'

      console.log('Enviando para API:', { valor: valorFormatado, email: emailPagador })

      const { data: pixData, error: funcError } = await supabase.functions.invoke('criar-pix', {
        body: {
          transaction_amount: valorFormatado,
          description: `Pedido #${order.id} - Loja`,
          payer_email: emailPagador,
          payer_name: profile.value.full_name || 'Cliente'
        }
      })

      // Tratamento de Erro Detalhado
      if (funcError) {
        console.error("Erro da Função:", funcError)
        
        let msgErro = 'Erro ao comunicar com o servidor de pagamento.'
        // Tenta extrair a mensagem real do JSON de erro
        if (funcError.context && typeof funcError.context.json === 'function') {
           const bodyErro = await funcError.context.json()
           msgErro = bodyErro.error || msgErro
           console.error("Detalhe do Erro:", bodyErro)
        }
        
        throw new Error(msgErro)
      }

      // Sucesso! Atualiza o banco e mostra QR Code
      await supabase.from('orders').update({ 
        transaction_id: String(pixData.payment_id),
        pix_code: pixData.qr_code_copy 
      }).eq('id', order.id)
      
      pixQrCode.value = `data:image/png;base64,${pixData.qr_code}`
      pixCodeString.value = pixData.qr_code_copy
      
      iniciarEscutaPagamento(order.id)
      step.value = 2 // Muda para tela do QR Code

    } else {
      // Cartão (Simulação)
      setTimeout(async () => {
         await supabase.from('orders').update({ payment_status: 'Aprovado', status: 'Pago' }).eq('id', order.id)
         finalizarSucesso()
      }, 3000)
    }

  } catch (err) {
    console.error(err)
    alert('Ops! ' + err.message)
  } finally {
    processing.value = false
  }
}

function finalizarSucesso() {
  step.value = 3
  cart.limparCarrinho()
}

const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] text-white font-sans py-10 px-4">
    
    <div v-if="loading" class="flex justify-center h-[50vh] items-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-atk-neon"></div>
    </div>

    <div v-else-if="step === 1" class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      <div class="lg:col-span-7 space-y-8">
        <section class="bg-[#151515] p-6 rounded-xl border border-white/10">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold uppercase flex items-center gap-2">
              <span class="bg-atk-neon text-atk-dark w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold">1</span>
              Endereço de Entrega
            </h2>
            <button @click="router.push('/perfil')" class="text-xs text-atk-neon font-bold hover:underline">Alterar</button>
          </div>
          <div v-if="profile?.address" class="text-sm text-gray-300 pl-8">
            <p class="font-bold text-white">{{ profile.full_name }}</p>
            <p>{{ profile.address }}, {{ profile.number }} - {{ profile.district }}</p>
            <p>{{ profile.city }} / {{ profile.state }} - CEP: {{ profile.cep }}</p>
          </div>
        </section>

        <section class="bg-[#151515] p-6 rounded-xl border border-white/10">
          <h2 class="text-xl font-bold uppercase mb-6 flex items-center gap-2">
            <span class="bg-atk-neon text-atk-dark w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold">2</span>
            Pagamento
          </h2>

          <div class="space-y-4 pl-8">
            <label class="cursor-pointer border p-4 rounded-lg flex items-center gap-4 transition-all" :class="paymentMethod === 'pix' ? 'border-atk-neon bg-atk-neon/5' : 'border-white/10 hover:border-white/30'">
              <input type="radio" v-model="paymentMethod" value="pix" class="accent-atk-neon w-5 h-5">
              <div class="flex-grow">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-lg">PIX</span>
                  <span class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold">5% DE DESCONTO</span>
                </div>
                <p class="text-xs text-gray-400 mt-1">Aprovação imediata. QR Code gerado na próxima tela.</p>
              </div>
            </label>

            <label class="cursor-pointer border p-4 rounded-lg flex flex-col gap-4 transition-all" :class="paymentMethod === 'credit_card' ? 'border-atk-neon bg-atk-neon/5' : 'border-white/10 hover:border-white/30'">
              <div class="flex items-center gap-4">
                <input type="radio" v-model="paymentMethod" value="credit_card" class="accent-atk-neon w-5 h-5">
                <div>
                  <span class="font-bold text-lg">Cartão de Crédito</span>
                  <p class="text-xs text-gray-400 mt-1">Parcelamento em até 12x.</p>
                </div>
              </div>

              <div v-if="paymentMethod === 'credit_card'" class="grid grid-cols-2 gap-3 mt-2 animate-fade-in pl-9">
                <input :value="cardData.number" @input="maskCard" type="text" placeholder="Número do Cartão" class="col-span-2 bg-black border border-white/20 rounded p-3 text-white outline-none focus:border-atk-neon">
                <input v-model="cardData.holder" type="text" placeholder="Nome Impresso" class="col-span-2 bg-black border border-white/20 rounded p-3 text-white outline-none focus:border-atk-neon uppercase">
                <input :value="cardData.expiry" @input="maskDate" type="text" placeholder="MM/AA" class="bg-black border border-white/20 rounded p-3 text-white outline-none focus:border-atk-neon text-center">
                <input v-model="cardData.cvv" type="text" maxlength="3" placeholder="CVV" class="bg-black border border-white/20 rounded p-3 text-white outline-none focus:border-atk-neon text-center">
              </div>
            </label>
          </div>
        </section>
      </div>

      <div class="lg:col-span-5">
        <div class="bg-[#1a1a1a] p-6 rounded-xl border border-white/10 sticky top-10">
          <h2 class="font-bold text-lg uppercase mb-4 border-b border-white/10 pb-2">Resumo</h2>
          
          <div class="max-h-60 overflow-y-auto space-y-3 mb-4 custom-scrollbar pr-2">
            <div v-for="item in cart.itens" :key="item.cartId" class="flex gap-3">
              <img :src="item.image_cover" class="w-12 h-12 bg-white/5 rounded object-contain p-1">
              <div class="flex-grow">
                <p class="text-xs font-bold line-clamp-1">{{ item.name }}</p>
                <p class="text-[10px] text-gray-400">Tam: {{ item.tamanhoEscolhido }} | Qtd: {{ item.quantidade }}</p>
              </div>
              <p class="text-xs font-bold">{{ formatMoney(item.price_sale * item.quantidade) }}</p>
            </div>
          </div>

          <div class="space-y-2 border-t border-white/10 pt-4 text-sm">
            <div class="flex justify-between text-gray-400"><span>Subtotal</span> <span>{{ formatMoney(subtotal) }}</span></div>
            <div class="flex justify-between text-gray-400">
              <span>Frete</span> 
              <span :class="valorFrete === 0 ? 'text-green-400 font-bold' : 'text-white'">{{ valorFrete === 0 ? 'GRÁTIS' : formatMoney(valorFrete) }}</span>
            </div>
            <div v-if="paymentMethod === 'pix'" class="flex justify-between text-green-400 font-bold">
              <span>Desconto PIX (5%)</span> <span>- {{ formatMoney((subtotal + valorFrete) * 0.05) }}</span>
            </div>
          </div>

          <div class="flex justify-between items-end mt-6 mb-6">
            <span class="font-bold text-lg">Total</span>
            <span class="text-2xl font-extrabold text-atk-neon">{{ formatMoney(totalGeral) }}</span>
          </div>

          <button @click="criarPedido" :disabled="processing" class="w-full bg-green-500 text-white font-extrabold py-4 rounded-lg uppercase tracking-widest hover:bg-green-400 transition shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 flex justify-center items-center gap-2">
            <span v-if="processing" class="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
            {{ processing ? 'Processando...' : 'FINALIZAR COMPRA' }}
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="step === 2" class="max-w-xl mx-auto text-center pt-10 animate-fade-in">
      <div class="bg-[#1a1a1a] p-8 rounded-2xl border border-atk-neon/30 shadow-[0_0_50px_rgba(0,255,194,0.1)]">
        <h2 class="text-2xl font-bold text-white mb-2">Pagamento via PIX</h2>
        <p class="text-gray-400 text-sm mb-6">Escaneie o QR Code abaixo para pagar {{ formatMoney(totalGeral) }}</p>
        
        <div class="bg-white p-4 rounded-xl w-64 h-64 mx-auto mb-6 flex items-center justify-center">
          <img :src="pixQrCode" class="w-full h-full object-contain">
        </div>

        <div class="flex gap-2 mb-6">
          <input :value="pixCodeString" readonly class="w-full bg-black border border-white/10 rounded px-3 py-2 text-xs text-gray-400 outline-none">
          <button @click="navigator.clipboard.writeText(pixCodeString); alert('Copiado!')" class="bg-atk-neon text-atk-dark px-4 py-2 rounded text-xs font-bold uppercase hover:bg-white transition">Copiar</button>
        </div>

        <div class="flex items-center justify-center gap-3 text-atk-neon animate-pulse">
          <div class="w-2 h-2 bg-atk-neon rounded-full"></div>
          <span class="text-sm font-bold">Aguardando confirmação do banco...</span>
        </div>
        <p class="text-[10px] text-gray-500 mt-2">A tela atualizará automaticamente assim que o pagamento cair.</p>
      </div>
    </div>

    <div v-else-if="step === 3" class="max-w-md mx-auto text-center pt-20 animate-fade-in">
      <div class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="white" class="w-12 h-12"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
      </div>
      <h2 class="text-3xl font-extrabold text-white mb-2">Pedido Confirmado!</h2>
      <p class="text-gray-400 mb-8">Recebemos seu pagamento. Já estamos separando seu manto!</p>
      <button @click="router.push('/perfil')" class="bg-atk-neon text-atk-dark px-8 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-white transition">
        Acompanhar Pedido
      </button>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
</style>