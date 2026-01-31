<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../supabase'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const order = ref(null)
const timeRemaining = ref(15 * 60) // 15 min para PIX
let timer = null

const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

// --- LÓGICA INTELIGENTE PARA SABER O TIPO DE PAGAMENTO ---
const isPix = computed(() => {
  if (!order.value) return false
  // É Pix se o método for 'pix' OU se tiver um código Pix (QR Code) salvo no banco
  return order.value.payment_method === 'pix' || (order.value.pix_code && !order.value.pix_code.startsWith('http'))
})

const isCreditCard = computed(() => {
  if (!order.value) return false
  // É cartão se o método for 'credit_card' ou 'infinitepay', OU se o pix_code for um Link (http)
  return order.value.payment_method === 'credit_card' || 
         order.value.payment_method === 'infinitepay' || 
         (order.value.pix_code && order.value.pix_code.startsWith('http'))
})

onMounted(async () => {
  let rawId = route.params.id || route.query.order_nsu || route.query.order_id
  
  if (!rawId) { 
      router.push('/')
      return 
  }

  const orderId = rawId.includes('_') ? rawId.split('_')[0] : rawId

  const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single()

  if (error || !data) {
    Swal.fire('Erro', 'Pedido não encontrado.', 'error')
    router.push('/')
    return
  }

  order.value = data
  loading.value = false

  // Se for PIX pendente, inicia timer
  if (order.value.status === 'Pendente' && isPix.value) {
    startTimer()
  }
  
  verificarPagamentoEmTempoReal()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  supabase.removeAllChannels()
})

function startTimer() {
  timer = setInterval(() => {
    if (timeRemaining.value > 0) timeRemaining.value--
    else clearInterval(timer)
  }, 1000)
}

const formattedTime = () => {
  const m = Math.floor(timeRemaining.value / 60)
  const s = timeRemaining.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const copiarPix = () => {
  if (!order.value?.pix_code) return
  navigator.clipboard.writeText(order.value.pix_code)
  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Copiado!', showConfirmButton: false, timer: 1500, background: '#151515', color: '#fff' })
}

function verificarPagamentoEmTempoReal() {
  if (!order.value) return

  supabase
    .channel(`order_${order.value.id}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.value.id}` },
      (payload) => {
        order.value = payload.new
        if (payload.new.status === 'Pago') {
          clearInterval(timer)
          Swal.fire({
            title: 'Aprovado! 🚀',
            text: 'Pagamento confirmado com sucesso.',
            icon: 'success',
            background: '#151515', color: '#fff', confirmButtonColor: '#00ffc2'
          })
        }
      }
    )
    .subscribe()
}
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] text-white font-sans p-4 flex items-center justify-center">
    
    <div v-if="loading" class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-atk-neon"></div>

    <div v-else class="max-w-md w-full bg-[#151515] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      
      <div class="text-center mb-8 border-b border-white/5 pb-4">
        <p class="text-gray-500 text-xs uppercase tracking-widest mb-1">Pedido #{{ String(order.id).slice(0,8) }}</p>
        <h1 class="text-2xl font-extrabold uppercase text-white">
          <span v-if="order.status === 'Pago'">Pagamento Aprovado</span>
          <span v-else-if="order.status === 'Falha'">Pagamento Recusado</span>
          <span v-else-if="isPix">Pague com PIX</span>
          <span v-else>Confirmando Pagamento...</span>
        </h1>
      </div>

      <div v-if="order.status === 'Pago'" class="text-center py-6 animate-fade-in">
        <div class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
          <span class="text-4xl">✅</span>
        </div>
        <p class="text-xl font-bold text-white mb-2">Tudo certo!</p>
        <p class="text-gray-400 text-sm mb-8">Já estamos separando seu pedido para envio.</p>
        <button @click="router.push('/perfil')" class="bg-white text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition uppercase text-sm">
          Acompanhar Pedido
        </button>
      </div>

      <div v-else-if="order.status === 'Pendente' && isPix" class="animate-fade-in">
        <div class="text-center mb-6">
          <p class="text-gray-400 text-xs uppercase">Total a pagar</p>
          <p class="text-4xl font-extrabold text-atk-neon mt-1">{{ formatMoney(order.total) }}</p>
        </div>

        <div class="bg-white p-4 rounded-xl mx-auto w-64 h-64 flex items-center justify-center mb-6 relative">
          <img v-if="order.pix_code" :src="`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${order.pix_code}`" class="w-full h-full object-contain">
          <div v-if="timeRemaining === 0" class="absolute inset-0 bg-white/90 flex flex-col items-center justify-center">
             <p class="text-red-500 font-bold text-sm uppercase">Expirado</p>
          </div>
        </div>

        <div class="text-center mb-6">
          <p class="text-xs text-gray-500 uppercase mb-1">Expira em</p>
          <p class="text-xl font-mono font-bold" :class="timeRemaining < 60 ? 'text-red-500' : 'text-white'">⏱ {{ formattedTime() }}</p>
        </div>

        <div class="space-y-2">
          <div class="flex gap-2">
            <input type="text" :value="order.pix_code" readonly class="w-full bg-black/50 border border-white/10 rounded px-3 py-3 text-xs text-gray-400 truncate">
            <button @click="copiarPix" class="bg-atk-neon text-atk-dark font-bold px-4 rounded hover:bg-white transition text-xs uppercase whitespace-nowrap">Copiar</button>
          </div>
        </div>
      </div>

      <div v-else-if="order.status === 'Pendente'" class="text-center py-6 animate-fade-in">
         <div class="w-20 h-20 border-4 border-atk-neon border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
         <h3 class="text-lg font-bold text-white mb-2">Processando na InfinitePay...</h3>
         <p class="text-gray-400 text-sm leading-relaxed mb-6">
           Se você já realizou o pagamento no link seguro, aguarde um momento. <br>
           A confirmação é automática.
         </p>
         
         <a v-if="order.pix_code && order.pix_code.startsWith('http')" :href="order.pix_code" class="block w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded uppercase font-bold text-xs mt-4">
            Abrir Pagamento Novamente
         </a>
      </div>

      <div v-else-if="order.status === 'Falha'" class="text-center py-6 animate-fade-in">
         <div class="w-24 h-24 bg-red-500/10 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
           ❌
         </div>
         <h3 class="text-xl font-bold text-red-500 mb-2">Pagamento Recusado</h3>
         <p class="text-white text-sm mb-2 font-bold">{{ order.payment_status || 'Transação não autorizada' }}</p>
         <p class="text-gray-400 text-xs mb-8">Verifique os dados ou tente outro meio.</p>
         
         <div class="flex gap-3 justify-center">
            <button @click="router.push('/carrinho')" class="bg-white/10 text-white px-6 py-3 rounded-lg text-xs font-bold uppercase hover:bg-white/20">Voltar</button>
         </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>