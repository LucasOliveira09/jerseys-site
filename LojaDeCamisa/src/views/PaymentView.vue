<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../supabase'
import QRCode from 'qrcode'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)
const qrCodeImage = ref('')

// WhatsApp da Loja (Configure aqui)
const whatsappNumber = '5511999999999' 
const whatsappMessage = 'Olá! Fiz um pedido no site e tenho uma dúvida.'

let realtimeChannel = null

onMounted(async () => {
  const orderId = route.params.id

  // 1. Busca o pedido no banco
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(*))') // Traz os itens e produtos
    .eq('id', orderId)
    .single()

  if (error || !data) {
    alert('Pedido não encontrado')
    router.push('/')
    return
  }

  order.value = data

  // 2. Se tiver código PIX, gera a imagem
  if (data.payment_method === 'pix' && data.pix_code && data.status !== 'Pago') {
    qrCodeImage.value = await QRCode.toDataURL(data.pix_code)
  }

  // 3. Inicia escuta do pagamento
  if (data.status !== 'Pago') {
    iniciarEscuta(orderId)
  }
  
  loading.value = false
})

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})

function iniciarEscuta(id) {
  realtimeChannel = supabase.channel('order-pay')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, 
    (payload) => {
      if (payload.new.status === 'Pago' || payload.new.payment_status === 'Aprovado') {
        order.value.status = 'Pago' // Atualiza na tela na hora
      }
    })
    .subscribe()
}

const copiarPix = () => {
  navigator.clipboard.writeText(order.value.pix_code)
  alert('Código PIX copiado!')
}

const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR')
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] text-white font-sans py-12 px-4">
    <div v-if="loading" class="flex justify-center mt-20">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-atk-neon"></div>
    </div>

    <div v-else class="max-w-3xl mx-auto space-y-6">
      
      <div class="text-center space-y-2">
        <div v-if="order.status === 'Pago'" class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
          <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
        </div>
        <h1 class="text-3xl font-extrabold uppercase tracking-tight">
          {{ order.status === 'Pago' ? 'Pedido Confirmado!' : 'Aguardando Pagamento' }}
        </h1>
        <p class="text-gray-400">Pedido #{{ order.id }} • Realizado em {{ formatDate(order.created_at) }}</p>
      </div>

      <div v-if="order.payment_method === 'pix' && order.status !== 'Pago'" class="bg-[#1a1a1a] border border-atk-neon/30 p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-atk-neon to-transparent opacity-50"></div>
        
        <div class="text-center">
          <p class="font-bold text-xl mb-6">Escaneie para pagar</p>
          <div class="bg-white p-4 rounded-xl w-64 h-64 mx-auto mb-6 flex items-center justify-center">
            <img :src="qrCodeImage" class="w-full h-full object-contain">
          </div>
          
          <div class="max-w-md mx-auto">
            <p class="text-xs text-gray-500 uppercase font-bold mb-2">Ou copie e cole:</p>
            <div class="flex gap-2">
              <input :value="order.pix_code" readonly class="w-full bg-black/50 border border-white/10 rounded px-3 text-xs text-gray-400 outline-none">
              <button @click="copiarPix" class="bg-atk-neon text-atk-dark px-4 py-3 rounded font-bold uppercase hover:bg-white transition text-xs">Copiar</button>
            </div>
          </div>
        </div>

        <div class="mt-8 flex justify-center items-center gap-2 text-atk-neon animate-pulse">
          <div class="w-2 h-2 bg-atk-neon rounded-full"></div>
          <span class="text-sm font-bold">Aguardando confirmação do banco...</span>
        </div>
      </div>

      <div class="bg-[#151515] p-6 rounded-xl border border-white/10">
        <h2 class="font-bold text-lg uppercase mb-4 border-b border-white/10 pb-4">Itens do Pedido</h2>
        <div class="space-y-4">
          <div v-for="item in order.order_items" :key="item.id" class="flex gap-4">
            <img :src="item.product?.image_cover" class="w-16 h-16 bg-white/5 rounded object-contain p-1">
            <div>
              <p class="font-bold text-sm">{{ item.product?.name }}</p>
              <p class="text-xs text-gray-400">Tam: {{ item.size }} | Qtd: {{ item.quantity }}</p>
              <p class="text-xs text-atk-neon font-bold mt-1">{{ formatMoney(item.price) }}</p>
            </div>
          </div>
        </div>
        <div class="border-t border-white/10 mt-6 pt-4 flex justify-between items-end">
          <span class="text-gray-400">Total com Frete</span>
          <span class="text-2xl font-extrabold text-white">{{ formatMoney(order.total) }}</span>
        </div>
      </div>

      <a :href="`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`" target="_blank" class=" w-full bg-[#25D366] text-white font-bold py-4 rounded-xl text-center uppercase tracking-wide hover:bg-[#20bd5a] transition flex items-center justify-center gap-2">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
        Dúvidas? Fale no WhatsApp
      </a>

    </div>
  </div>
</template>