<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../supabase'
import confetti from 'canvas-confetti'

const route = useRoute()
const status = ref('Aguardando')
const orderId = ref(null)
let subscription = null

onMounted(async () => {
    // Pega o NSU da URL e extrai o ID (formato: ID_TIMESTAMP)
    const nsu = route.query.order_nsu || ''
    orderId.value = nsu.split('_')[0]

    if (!orderId.value) return

    // 1. Checa status inicial
    const { data } = await supabase.from('orders').select('status').eq('id', orderId.value).single()
    if (data) {
        status.value = data.status
        if (data.status === 'Pago') dispararConfete()
    }

    // 2. Ouve atualização em tempo real (Webhook)
    subscription = supabase.channel(`order-${orderId.value}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId.value}` }, (payload) => {
            status.value = payload.new.status
            if (payload.new.status === 'Pago') dispararConfete()
        })
        .subscribe()
})

onUnmounted(() => {
    if (subscription) supabase.removeChannel(subscription)
})

function dispararConfete() {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
}
</script>

<template>
    <div class="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-6 text-center">
        <div v-if="status === 'Pago'" class="animate-bounce">
            <div class="text-6xl mb-4">✅</div>
            <h1 class="text-4xl font-bold text-green-400 mb-2">Pedido Pago!</h1>
            <p>Seu pagamento foi confirmado.</p>
        </div>
        <div v-else class="animate-pulse">
            <div class="text-6xl mb-4">🔄</div>
            <h1 class="text-3xl font-bold text-yellow-400 mb-2">Processando...</h1>
            <p class="text-gray-400">Aguardando confirmação da InfinitePay.</p>
        </div>
    </div>
</template>