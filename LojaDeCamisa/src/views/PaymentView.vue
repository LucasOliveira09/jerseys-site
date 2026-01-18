<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../supabase'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)

// Variáveis visuais do PIX
const pixImage = ref('')
const pixCopyPaste = ref('')

let realtimeChannel = null

onMounted(async () => {
  const orderId = route.params.id
  
  // 1. Busca os dados do pedido no banco
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)') 
    .eq('id', orderId)
    .single()

  if (error || !data) {
    alert('Pedido não encontrado.')
    router.push('/')
    return
  }

  order.value = data

  // 2. Se for PIX e estiver Pendente, monta o QR Code
  if (data.payment_method === 'pix' && data.status !== 'Pago') {
     // Pega o código copia e cola salvo no banco
     pixCopyPaste.value = data.pix_code
     
     // Gera a imagem visualmente usando API externa baseada no código
     if (data.pix_code) {
        // Codificamos a URL para evitar erros com caracteres especiais
        pixImage.value = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.pix_code)}`
     }
  }

  // 3. Inicia o "Polling" Inteligente (Realtime)
  if (data.status !== 'Pago') {
    iniciarEscutaRealtime(orderId)
  }

  loading.value = false
})

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})

// --- ESCUTA MUDANÇAS NO BANCO EM TEMPO REAL ---
function iniciarEscutaRealtime(id) {
  console.log(`🔌 Conectando ao Realtime para o pedido ${id}...`)
  
  realtimeChannel = supabase.channel(`order_status_${id}`)
    .on(
      'postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, 
      (payload) => {
        console.log("🔔 Status mudou:", payload.new.status)
        
        // Atualiza a tela se virar Pago
        if (payload.new.status === 'Pago' || payload.new.payment_status === 'approved') {
          // Atualizamos o objeto order reativamente
          order.value = { ...order.value, ...payload.new }
          
          // Vibração no celular (UX)
          if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
      }
    )
    .subscribe()
}

const copiarCodigo = () => {
  if (pixCopyPaste.value) {
    navigator.clipboard.writeText(pixCopyPaste.value)
    alert('Código PIX copiado!')
  }
}

const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

// Função segura para exibir o ID (seja número ou texto)
const formatOrderId = (id) => {
  if (!id) return ''
  return String(id).toUpperCase().slice(0, 8)
}
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] text-white font-sans py-10 px-4 flex justify-center items-center">
    
    <div v-if="loading">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-atk-neon"></div>
    </div>

    <div v-else class="max-w-2xl w-full space-y-6 animate-fade-in">
      
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-bold uppercase text-atk-neon">
          {{ order.status === 'Pago' ? 'Pagamento Confirmado!' : 'Finalize seu Pagamento' }}
        </h1>
        
        <p class="text-gray-400">Pedido #{{ formatOrderId(order.id) }}</p>
      </div>

      <div v-if="order.status === 'Pago'" class="bg-[#151515] border border-green-500 p-10 rounded-2xl text-center space-y-6 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
        <div class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <svg class="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path d="M5 13l4 4L19 7"/></svg>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-white mb-2">Tudo certo!</h2>
          <p class="text-green-400">Seu pagamento foi aprovado. Já estamos separando seus itens.</p>
        </div>
        <button @click="router.push('/')" class="bg-white text-black px-8 py-3 rounded-lg font-bold uppercase hover:bg-gray-200 transition w-full">
          Voltar para Loja
        </button>
      </div>

      <div v-else class="bg-[#1a1a1a] border border-atk-neon/30 p-8 rounded-2xl shadow-xl">
        
        <div class="text-center mb-6 border-b border-white/10 pb-4">
          <p class="text-gray-300 mb-1">Total a pagar</p>
          <p class="text-4xl font-extrabold text-white">{{ formatMoney(order.total) }}</p>
        </div>

        <div class="flex flex-col items-center gap-6">
          <div class="bg-white p-4 rounded-xl shadow-lg">
            <img v-if="pixImage" :src="pixImage" class="w-64 h-64 object-contain" alt="QR Code Pix">
            <div v-else class="w-64 h-64 flex flex-col items-center justify-center text-black font-bold bg-gray-100 rounded">
               <span class="animate-pulse">Carregando QR...</span>
               <span class="text-xs font-normal mt-2 text-gray-500 text-center px-2">Se demorar, use o Copia e Cola abaixo.</span>
            </div>
          </div>

          <div class="w-full">
            <label class="text-xs text-gray-500 uppercase font-bold mb-2 block text-center">Pix Copia e Cola</label>
            <div class="flex gap-2">
              <input :value="pixCopyPaste" readonly class="w-full bg-black border border-white/20 rounded px-4 py-3 text-xs text-gray-400 outline-none truncate font-mono">
              <button @click="copiarCodigo" class="bg-atk-neon text-atk-dark px-6 font-bold uppercase rounded hover:bg-white transition text-sm">
                Copiar
              </button>
            </div>
          </div>

          <div class="flex items-center gap-3 text-sm text-atk-neon bg-atk-neon/10 px-4 py-2 rounded-full mt-4 border border-atk-neon/20">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-atk-neon opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-atk-neon"></span>
            </span>
            Aguardando confirmação automática...
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.8s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>