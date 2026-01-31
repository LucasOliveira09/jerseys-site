<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { supabase } from '../supabase'
import Swal from 'sweetalert2'

const router = useRouter()
const cart = useCartStore()
const loading = ref(true)
const processing = ref(false)
const user = ref(null)
const profile = ref(null)

const subtotal = computed(() => cart.itens.reduce((acc, item) => acc + (item.price_sale * item.quantidade), 0))
const valorFrete = computed(() => cart.quantidade >= 3 ? 0 : (cart.quantidade === 2 ? 20.00 : 25.00))
const totalFinal = computed(() => subtotal.value + valorFrete.value)
const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

onMounted(async () => {
  if (cart.quantidade === 0) { router.push('/carrinho'); return }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { router.push('/login'); return }
  user.value = session.user
  const { data } = await supabase.from('profiles').select('*').eq('id', user.value.id).single()
  profile.value = data || {}
  loading.value = false
})

async function irParaPagamento() {
  // 1. Valida Endereço
  if (!profile.value?.address || !profile.value?.number || !profile.value?.cep) {
     Swal.fire('Endereço Incompleto', 'Preencha Rua, Número e CEP.', 'warning').then(() => router.push('/perfil'))
     return
  }
  // 2. Valida CPF
  if (!profile.value?.cpf) {
     const { value: cpfDigitado } = await Swal.fire({
        title: 'CPF Obrigatório', input: 'text', inputPlaceholder: '000.000.000-00',
        confirmButtonColor: '#00ffc2', background: '#151515', color: '#fff',
        inputValidator: (v) => !v && 'CPF é obrigatório!'
     })
     if (cpfDigitado) {
        await supabase.from('profiles').update({ cpf: cpfDigitado }).eq('id', user.value.id)
        profile.value.cpf = cpfDigitado
     } else return
  }

  processing.value = true
  try {
    const itemsBackend = cart.itens.map(item => ({
       id: item.id, name: item.name, price_sale: item.price_sale, 
       quantidade: item.quantidade, tamanhoEscolhido: item.size
    }))
    const { data: { session } } = await supabase.auth.getSession()

    const { data, error } = await supabase.functions.invoke('StripeRefresh', {
      body: { items: itemsBackend, shipping_cost: valorFrete.value },
      headers: { Authorization: `Bearer ${session.access_token}` }
    })

    if (error || data.error) throw new Error(data?.message || error?.message)
    
    if (data.payment_url) {
        cart.limparCarrinho()
        window.location.href = data.payment_url
    }
  } catch (err) {
    console.error(err)
    Swal.fire('Erro', err.message, 'error')
    processing.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] text-white font-sans py-10 px-4">
    <div v-if="loading" class="flex justify-center h-[50vh] items-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-atk-neon"></div>
    </div>
    <div v-else class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div class="lg:col-span-7 space-y-8">
        <section class="bg-[#151515] p-6 rounded-xl border border-white/10">
           <div class="flex justify-between mb-4"><h2 class="text-xl font-bold uppercase">Entrega</h2><button @click="router.push('/perfil')" class="text-xs text-atk-neon">EDITAR</button></div>
           <div class="text-sm text-gray-300">
             <p class="font-bold">{{ profile.full_name }}</p>
             <p>{{ profile.address }}, {{ profile.number }} - {{ profile.city }}</p>
             <p class="text-xs text-gray-500 mt-1">CPF: {{ profile.cpf }}</p>
           </div>
        </section>
        <section class="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 rounded-xl border border-white/5 flex gap-4 items-center">
            <div class="text-3xl">🚀</div>
            <div>
                <h3 class="font-bold text-white">Checkout InfinitePay</h3>
                <p class="text-sm text-gray-400">Ambiente 100% seguro. Pague com Pix ou Cartão.</p>
            </div>
        </section>
      </div>
      <div class="lg:col-span-5">
        <div class="bg-[#1a1a1a] p-6 rounded-xl border border-white/10 sticky top-10">
          <h2 class="font-bold text-lg uppercase mb-4 border-b border-white/10 pb-2">Resumo</h2>
          <div class="space-y-2 mb-6 text-sm">
             <div class="flex justify-between text-gray-400"><span>Itens</span> <span>{{ formatMoney(subtotal) }}</span></div>
             <div class="flex justify-between text-gray-400"><span>Frete</span> <span>{{ formatMoney(valorFrete) }}</span></div>
          </div>
          <div class="flex justify-between items-end mb-6 border-t border-white/10 pt-4">
            <span class="font-bold text-lg">Total</span>
            <span class="text-3xl font-extrabold text-atk-neon">{{ formatMoney(totalFinal) }}</span>
          </div>
          <button @click="irParaPagamento" :disabled="processing" class="w-full bg-atk-neon hover:bg-white text-atk-dark font-extrabold py-4 rounded-lg uppercase transition flex justify-center items-center gap-2">
            <span v-if="processing" class="animate-spin h-5 w-5 border-2 border-black rounded-full border-t-transparent"></span>
            {{ processing ? 'INICIANDO...' : 'PAGAR AGORA' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>