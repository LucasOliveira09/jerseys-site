<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../supabase'
import QRCode from 'qrcode' // Biblioteca que instalamos

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)
const qrCodeImage = ref('')

// Configuração do WhatsApp
const whatsappNumber = '5511999999999' // SEU NÚMERO AQUI
const msgZap = 'Olá! Fiz um pedido e tenho uma dúvida sobre o pagamento.'

let realtimeChannel = null

// --- CARREGAR PEDIDO ---
onMounted(async () => {
  const orderId = route.params.id

  // 1. Busca dados do pedido + itens + produtos
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('id', orderId)
    .single()

  if (error || !data) {
    alert('Pedido não encontrado.')
    router.push('/')
    return
  }

  order.value = data

  // 2. Se for PIX pendente, gera a imagem do QR Code
  if (data.payment_method === 'pix' && data.pix_code && data.status !== 'Pago') {
    try {
      qrCodeImage.value = await QRCode.toDataURL(data.pix_code)
    } catch (e) {
      console.error('Erro ao gerar QR', e)
    }
  }

  // 3. Se não estiver pago, fica vigiando
  if (data.status !== 'Pago') {
    iniciarEscuta(orderId)
  }

  loading.value = false
})

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})

// --- REALTIME ---
function iniciarEscuta(id) {
  realtimeChannel = supabase.channel('pagamento_page')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, 
    (payload) => {
      if (payload.new.status === 'Pago' || payload.new.payment_status === 'Aprovado') {
        order.value.status = 'Pago' // Atualiza a tela automaticamente
      }
    })
    .subscribe()
}

const copiarPix = () => {
  navigator.clipboard.writeText(order.value.pix_code)
  alert('Código PIX copiado!')
}

const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] text-white font-sans py-12 px-4">
    
    <div v-if="loading" class="flex justify-center mt-20">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-atk-neon"></div>
    </div>

    <div v-else class="max-w-3xl mx-auto space-y-8 animate-fade-in">

      <div class="text-center space-y-4">
        <div v-if="order.status === 'Pago'" class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.6)]">
          <svg class="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
        </div>
        
        <div v-else class="w-20 h-20 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto border-2 border-yellow-500">
           <span class="text-3xl">⏳</span>
        </div>

        <h1 class="text-3xl font-extrabold uppercase tracking-tight">
          {{ order.status === 'Pago' ? 'Pagamento Confirmado!' : 'Aguardando Pagamento' }}
        </h1>
        <p class="text-gray-400">Pedido #{{ order.id }}</p>
      </div>

      <div v-if="order.payment_method === 'pix' && order.status !== 'Pago'" class="bg-[#1a1a1a] border border-atk-neon/30 p-8 rounded-2xl shadow-2xl relative overflow-hidden text-center">
        <h2 class="text-xl font-bold mb-4 text-white">Escaneie o QR Code</h2>
        
        <div class="bg-white p-4 rounded-xl w-64 h-64 mx-auto mb-6 flex items-center justify-center">
           <img v-if="qrCodeImage" :src="qrCodeImage" class="w-full h-full object-contain">
        </div>

        <div class="max-w-md mx-auto">
          <p class="text-xs text-gray-500 uppercase font-bold mb-2">Ou use o Copia e Cola:</p>
          <div class="flex gap-2">
            <input :value="order.pix_code" readonly class="w-full bg-black/50 border border-white/10 rounded px-3 text-xs text-gray-400 outline-none">
            <button @click="copiarPix" class="bg-atk-neon text-atk-dark px-4 py-3 rounded font-bold uppercase hover:bg-white transition text-xs">Copiar</button>
          </div>
        </div>

        <div class="mt-6 flex justify-center items-center gap-2 text-atk-neon animate-pulse text-sm font-bold">
           <div class="w-2 h-2 bg-atk-neon rounded-full"></div>
           Detectando pagamento automaticamente...
        </div>
      </div>

      <div class="bg-[#151515] p-6 rounded-xl border border-white/10">
        <h3 class="font-bold text-lg uppercase mb-4 border-b border-white/10 pb-2">Resumo da Compra</h3>
        <div class="space-y-4">
          <div v-for="item in order.order_items" :key="item.id" class="flex justify-between items-center">
             <div>
                <p class="font-bold">{{ item.products?.name || 'Produto' }}</p>
                <p class="text-xs text-gray-400">Tam: {{ item.size }} | Qtd: {{ item.quantity }}</p>
             </div>
             <p class="font-bold text-atk-neon">{{ formatMoney(item.price) }}</p>
          </div>
        </div>
        <div class="border-t border-white/10 mt-4 pt-4 flex justify-between items-center text-xl font-extrabold">
           <span>Total</span>
           <span>{{ formatMoney(order.total) }}</span>
        </div>
      </div>

      <div class="grid gap-4">
        <a :href="`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msgZap)}`" target="_blank" class="bg-[#25D366] text-white py-4 rounded-xl font-bold uppercase text-center hover:bg-[#1ebc57] transition flex items-center justify-center gap-2">
           <span>📱</span> Falar no WhatsApp
        </a>
        <button @click="router.push('/')" class="text-gray-500 hover:text-white text-sm underline">Voltar para a Loja</button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>