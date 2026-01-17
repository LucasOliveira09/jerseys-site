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
const paymentMethod = ref('credit_card') 
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

// --- STARTUP ---
onMounted(async () => {
  if (cart.quantidade === 0) { router.push('/carrinho'); return }
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) { router.push('/login'); return }
  user.value = currentUser
  const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
  profile.value = data
  loading.value = false
})

const maskCard = (e) => cardData.value.number = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19)
const maskDate = (e) => cardData.value.expiry = e.target.value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5)

// --- CRIAR PEDIDO E REDIRECIONAR ---
async function criarPedido() {
  if (!profile.value?.address || !profile.value?.number) {
    alert('Por favor, complete seu endereço.')
    router.push('/perfil') 
    return
  }

  processing.value = true

  try {
    // 1. Cria Pedido
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

    // 2. Salva Itens
    const items = cart.itens.map(i => ({
      order_id: order.id,
      product_id: i.id,
      quantity: i.quantidade,
      price: i.price_sale,
      size: i.tamanhoEscolhido,
      customization: i.personalizacao
    }))
    await supabase.from('order_items').insert(items)

    // 3. Processamento PIX
    if (paymentMethod.value === 'pix') {
      const valorFormatado = Number(totalGeral.value.toFixed(2))
      // Garante que existe email, senão usa um placeholder
      const emailPagador = user.value.email || 'cliente@loja.com' 
      const nomePagador = profile.value.full_name || 'Cliente da Loja'

      // Chama Edge Function
      const { data: pixData, error: funcError } = await supabase.functions.invoke('criar-pix', {
        body: {
          transaction_amount: valorFormatado,
          description: `Pedido #${order.id}`,
          payer_email: emailPagador, // Agora a função lê isso corretamente
          payer_name: nomePagador    // E isso também
        }
      })

      if (funcError) {
         console.error("Erro Edge Function:", funcError)
         // Tenta extrair a mensagem de erro vinda do JSON da função
         let msg = 'Erro ao processar pagamento.'
         // No Supabase client JS, as vezes o erro vem como string ou objeto
         try {
            // Se o retorno for um objeto com corpo, tentamos ler
            if(funcError.context && typeof funcError.context.json === 'function') {
                const errJson = await funcError.context.json()
                msg = errJson.error || msg
            } else if (funcError.message) {
                msg = funcError.message
            }
         } catch (e) { console.log('Erro ao parsear resposta de erro', e)}
         
         throw new Error(msg)
      }

      // Se pixData veio nulo mas sem funcError (caso raro, mas possível em edge cases)
      if (!pixData || !pixData.qr_code_copy) {
          throw new Error('O Mercado Pago não retornou o código PIX.')
      }

      // ATUALIZA BANCO COM O CÓDIGO PIX
      await supabase.from('orders').update({ 
        transaction_id: String(pixData.payment_id),
        pix_code: pixData.qr_code_copy,
        status: 'Aguardando Pagamento' // Importante setar status
      }).eq('id', order.id)

      cart.limparCarrinho()
      router.push(`/pagamento/${order.id}`)

    } else {
      // Simulação Cartão
      setTimeout(async () => {
         await supabase.from('orders').update({ payment_status: 'Aprovado', status: 'Pago' }).eq('id', order.id)
         cart.limparCarrinho()
         router.push(`/pagamento/${order.id}`)
      }, 2000)
    }

  } catch (err) {
    console.error(err)
    alert('Erro: ' + err.message)
    processing.value = false
  }
}

const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
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
            <h2 class="text-xl font-bold uppercase flex items-center gap-2">
              <span class="bg-atk-neon text-atk-dark w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold">1</span>
              Entrega
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
                  <span class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold">5% OFF</span>
                </div>
                <p class="text-xs text-gray-400 mt-1">Aprovação imediata.</p>
              </div>
            </label>

            <label class="cursor-pointer border p-4 rounded-lg flex flex-col gap-4 transition-all" :class="paymentMethod === 'credit_card' ? 'border-atk-neon bg-atk-neon/5' : 'border-white/10 hover:border-white/30'">
              <div class="flex items-center gap-4">
                <input type="radio" v-model="paymentMethod" value="credit_card" class="accent-atk-neon w-5 h-5">
                <div>
                  <span class="font-bold text-lg">Cartão de Crédito</span>
                  <p class="text-xs text-gray-400 mt-1">Até 12x.</p>
                </div>
              </div>
              <div v-if="paymentMethod === 'credit_card'" class="grid grid-cols-2 gap-3 mt-2 animate-fade-in pl-9">
                <input :value="cardData.number" @input="maskCard" type="text" placeholder="Número" class="col-span-2 bg-black border border-white/20 rounded p-3 text-white outline-none focus:border-atk-neon">
                <input v-model="cardData.holder" type="text" placeholder="Nome" class="col-span-2 bg-black border border-white/20 rounded p-3 text-white outline-none focus:border-atk-neon uppercase">
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
          <div class="space-y-2 border-b border-white/10 pb-4 mb-4 text-sm">
             <div class="flex justify-between text-gray-400"><span>Subtotal</span> <span>{{ formatMoney(subtotal) }}</span></div>
             <div class="flex justify-between text-gray-400"><span>Frete</span> <span :class="valorFrete===0?'text-green-500':''">{{ valorFrete===0?'GRÁTIS':formatMoney(valorFrete) }}</span></div>
             <div v-if="paymentMethod==='pix'" class="flex justify-between text-green-500 font-bold"><span>Desconto PIX</span> <span>- {{ formatMoney((subtotal+valorFrete)*0.05) }}</span></div>
          </div>
          <div class="flex justify-between items-end mb-6">
            <span class="font-bold text-lg">Total</span>
            <span class="text-2xl font-extrabold text-atk-neon">{{ formatMoney(totalGeral) }}</span>
          </div>
          <button @click="criarPedido" :disabled="processing" class="w-full bg-green-500 text-white font-extrabold py-4 rounded-lg uppercase tracking-widest hover:bg-green-400 transition shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 flex justify-center items-center gap-2">
            <span v-if="processing" class="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
            {{ processing ? 'PROCESSANDO...' : 'FINALIZAR COMPRA' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>