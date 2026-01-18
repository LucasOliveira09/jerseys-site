<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { supabase } from '../supabase'

const router = useRouter()
const cart = useCartStore()

const loading = ref(true)
const processing = ref(false)
const user = ref(null)
const profile = ref(null)
const paymentMethod = ref('pix') 
const cardData = ref({ number: '', holder: '', expiry: '', cvv: '' })

// --- CÁLCULOS ---
const subtotal = computed(() => cart.itens.reduce((acc, item) => acc + (item.price_sale * item.quantidade), 0))
const valorFrete = computed(() => {
  const qtd = cart.quantidade
  if (qtd === 0) return 0
  if (qtd >= 3) return 0        
  if (qtd === 2) return 20.00   
  return 25.00                  
})
const totalGeral = computed(() => {
  const total = subtotal.value + valorFrete.value
  return paymentMethod.value === 'pix' ? total * 0.95 : total
})
const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

// --- STARTUP ---
onMounted(async () => {
  if (cart.quantidade === 0) { router.push('/carrinho'); return }
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) { router.push('/login'); return }
  
  user.value = currentUser
  
  const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
  profile.value = data || {}
  loading.value = false
})

const maskCard = (e) => cardData.value.number = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19)

// --- VALIDAÇÃO CPF ---
async function garantirCPF() {
  if (profile.value?.cpf && profile.value.cpf.length > 10) return true
  const cpfDigitado = prompt("Obrigatório: Digite seu CPF (apenas números) para o PIX:")
  if (!cpfDigitado || cpfDigitado.length < 11) {
    alert("CPF inválido. Pagamento cancelado.")
    return false
  }
  await supabase.from('profiles').update({ cpf: cpfDigitado }).eq('id', user.value.id)
  profile.value.cpf = cpfDigitado
  return true
}

// --- CRIAR PEDIDO E REDIRECIONAR ---
async function criarPedido() {
  if (!profile.value?.address || !profile.value?.number) {
    alert('Preencha seu endereço no perfil antes de continuar.')
    router.push('/perfil') 
    return
  }

  // Se for PIX, exige CPF
  if (paymentMethod.value === 'pix') {
    const temCPF = await garantirCPF()
    if (!temCPF) return
  }

  processing.value = true

  try {
    if (paymentMethod.value === 'pix') {
      // Chama o Backend
      const { data, error } = await supabase.functions.invoke('criar-pix', {
        body: {
          items: cart.itens,         
          method: 'pix',
          user_id: user.value.id,
          customer_email: user.value.email,
          customer_cpf: profile.value.cpf, 
          shipping_cost: valorFrete.value
        }
      })

      if (error || (data && data.error)) {
         throw new Error(data?.message || error?.message || 'Erro ao criar pedido.')
      }

      // SUCESSO! Limpa o carrinho e redireciona
      cart.limparCarrinho()
      
      // 🚀 REDIRECIONAMENTO MÁGICO AQUI
      router.push(`/pagamento/${data.order_id}`)
      
    } else {
      alert('Cartão em breve.')
    }

  } catch (err) {
    console.error(err)
    alert('Erro: ' + err.message)
  } finally {
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
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold uppercase">1. Endereço</h2>
            <button @click="router.push('/perfil')" class="text-xs text-atk-neon hover:underline">Alterar</button>
          </div>
          <div v-if="profile?.address" class="text-sm text-gray-300">
             {{ profile.address }}, {{ profile.number }} - {{ profile.city }}/{{ profile.state }}
          </div>
        </section>

        <section class="bg-[#151515] p-6 rounded-xl border border-white/10">
          <h2 class="text-xl font-bold uppercase mb-6">2. Pagamento</h2>
          <label class="cursor-pointer border p-4 rounded-lg flex items-center gap-4 border-atk-neon bg-atk-neon/5">
            <input type="radio" checked class="accent-atk-neon w-5 h-5">
            <div>
              <span class="font-bold text-lg">PIX</span>
              <span class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded ml-2">5% OFF</span>
              <p class="text-xs text-gray-400 mt-1">Aprovação imediata.</p>
            </div>
          </label>
        </section>
      </div>

      <div class="lg:col-span-5">
        <div class="bg-[#1a1a1a] p-6 rounded-xl border border-white/10 sticky top-10">
          <h2 class="font-bold text-lg uppercase mb-4 border-b border-white/10 pb-2">Resumo</h2>
          <div class="space-y-2 mb-6">
             <div class="flex justify-between text-gray-400"><span>Total Produtos</span> <span>{{ formatMoney(subtotal) }}</span></div>
             <div class="flex justify-between text-gray-400"><span>Frete</span> <span>{{ valorFrete===0?'GRÁTIS':formatMoney(valorFrete) }}</span></div>
             <div class="flex justify-between text-green-500 font-bold"><span>Desconto PIX</span> <span>- {{ formatMoney((subtotal+valorFrete)*0.05) }}</span></div>
          </div>
          <div class="flex justify-between items-end mb-6">
            <span class="font-bold text-lg">Total</span>
            <span class="text-2xl font-extrabold text-atk-neon">{{ formatMoney(totalGeral) }}</span>
          </div>
          <button @click="criarPedido" :disabled="processing" class="w-full bg-green-500 text-white font-extrabold py-4 rounded-lg uppercase hover:bg-green-400 transition flex justify-center items-center gap-2">
            <span v-if="processing" class="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
            {{ processing ? 'PROCESSANDO...' : 'FINALIZAR E PAGAR' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>