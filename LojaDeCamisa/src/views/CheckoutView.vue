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
const paymentMethod = ref('pix') // Padrão: Pix

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
  // 1. Validações
  if (!profile.value?.address || !profile.value?.number || !profile.value?.cep) {
      Swal.fire('Endereço Incompleto', 'Preencha Rua, Número e CEP.', 'warning').then(() => router.push('/perfil'))
      return
  }
  if (!profile.value?.cpf) {
      const { value: cpf } = await Swal.fire({
          title: 'CPF Obrigatório', input: 'text', inputPlaceholder: '000.000.000-00',
          confirmButtonColor: '#00ffc2', background: '#151515', color: '#fff',
          inputValidator: (v) => !v && 'Obrigatório para nota fiscal!'
      })
      if (cpf) {
         await supabase.from('profiles').update({ cpf }).eq('id', user.value.id)
         profile.value.cpf = cpf
      } else return
  }

  processing.value = true

  try {
    const itemsBackend = cart.itens.map(item => ({
       id: item.id, name: item.name, price_sale: item.price_sale, 
       quantidade: item.quantidade, tamanhoEscolhido: item.size
    }))
    const { data: { session } } = await supabase.auth.getSession()

    // 2. Chama o Backend Unificado
    const { data, error } = await supabase.functions.invoke('StripeRefresh', {
      body: { 
          items: itemsBackend, 
          shipping_cost: valorFrete.value,
          method: paymentMethod.value, // 'pix' ou 'credit_card'
          customer_cpf: profile.value.cpf
      },
      headers: { Authorization: `Bearer ${session.access_token}` }
    })

    if (error || data.error) throw new Error(data?.message || error?.message)
    
    // 3. Decide o que fazer com base na resposta
    if (data.action === 'redirect') {
        // Fluxo InfinitePay (Cartão)
        cart.limparCarrinho()
        window.location.href = data.url
    } 
    else if (data.action === 'pix_display') {
        // Fluxo Mercado Pago (Pix)
        cart.limparCarrinho()
        // Redireciona para a página de sucesso, ela vai ler o Pix do banco
        router.push(`/pagamento/sucesso?order_nsu=${data.order_id}`)
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
             <p>{{ profile.address }}, {{ profile.number }}</p>
             <p class="text-xs text-gray-500">CPF: {{ profile.cpf }}</p>
           </div>
        </section>

        <section class="bg-[#151515] p-6 rounded-xl border border-white/10">
           <h2 class="text-xl font-bold uppercase mb-6">Forma de Pagamento</h2>
           
           <div class="space-y-4">
               <label class="cursor-pointer border p-4 rounded-lg flex items-center gap-4 transition-all" 
                     :class="paymentMethod === 'pix' ? 'border-atk-neon bg-atk-neon/5 ring-1 ring-atk-neon' : 'border-white/10 hover:border-white/30'">
                <input type="radio" v-model="paymentMethod" value="pix" class="accent-atk-neon w-5 h-5">
                <div class="flex-grow flex justify-between items-center">
                    <div>
                      <span class="font-bold text-lg block">PIX</span>
                      <span class="text-xs text-gray-400">Aprovação imediata via QR Code</span>
                    </div>
                    <span class="text-2xl">💠</span>
                </div>
               </label>

               <label class="cursor-pointer border p-4 rounded-lg flex items-center gap-4 transition-all"
                     :class="paymentMethod === 'credit_card' ? 'border-atk-neon bg-atk-neon/5 ring-1 ring-atk-neon' : 'border-white/10 hover:border-white/30'">
                <input type="radio" v-model="paymentMethod" value="credit_card" class="accent-atk-neon w-5 h-5">
                <div class="flex-grow flex justify-between items-center">
                    <div>
                      <span class="font-bold text-lg block">Cartão de Crédito</span>
                      <span class="text-xs text-gray-400">Link seguro. Parcelas com 3x sem juros.</span>
                    </div>
                    <span class="text-2xl">💳</span>
                </div>
               </label>
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
            {{ processing ? 'PROCESSANDO...' : 'FINALIZAR PEDIDO' }}
          </button>
          
          <p v-if="paymentMethod==='credit_card'" class="text-[10px] text-center mt-4 text-gray-500">🔒 Você será redirecionado para InfinitePay</p>
        </div>
      </div>
    </div>
  </div>
</template>