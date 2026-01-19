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

// --- DADOS DO CARTÃO ---
const cardForm = ref({
  cardNumber: '',
  cardholderName: '',
  cardExpirationMonth: '',
  cardExpirationYear: '',
  securityCode: '',
  identificationType: 'CPF',
  identificationNumber: ''
})
const installmentsList = ref([]) 
const selectedInstallment = ref(null)
const issuerId = ref(null)
const paymentMethodId = ref(null)
const paymentMethodImg = ref(null)

let mpInstance = null 

// --- CÁLCULOS BASE ---
const subtotal = computed(() => cart.itens.reduce((acc, item) => acc + (item.price_sale * item.quantidade), 0))
const valorFrete = computed(() => {
  const qtd = cart.quantidade
  if (qtd === 0) return 0
  if (qtd >= 3) return 0        
  if (qtd === 2) return 20.00   
  return 25.00                  
})
const totalBase = computed(() => subtotal.value + valorFrete.value)

// --- CÁLCULO TOTAL FINAL ---
const totalGeral = computed(() => {
  if (paymentMethod.value === 'pix') return totalBase.value * 0.98
  
  // Se for cartão, pega o total já calculado da parcela selecionada
  if (paymentMethod.value === 'credit_card' && selectedInstallment.value) {
    return selectedInstallment.value.total_amount
  }
  
  return totalBase.value 
})

const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

// --- CALCULADORA DE JUROS PERSONALIZADA ---
const calcularParcelasPersonalizadas = (valorBase) => {
  const opcoes = []
  
  for (let i = 1; i <= 6; i++) {
    let taxa = 0
    let textoJuros = 'sem juros'

    // Regras de Juros Definidas
    if (i === 3) taxa = 0.0579 // 5,79%
    if (i === 4) taxa = 0.0799 // 7,99%
    if (i === 5) taxa = 0.0819 // 8,19%
    if (i === 6) taxa = 0.0839 // 8,39%

    if (taxa > 0) textoJuros = 'c/ juros'

    const valorTotalComJuros = valorBase * (1 + taxa)
    const valorParcela = valorTotalComJuros / i

    opcoes.push({
      installments: i,
      installment_rate: taxa * 100,
      total_amount: valorTotalComJuros,
      installment_amount: valorParcela,
      recommended_message: `${i}x de ${formatMoney(valorParcela)} ${textoJuros}`
    })
  }
  return opcoes
}

// --- LOADERS ---
const loadMercadoPagoScript = () => {
  return new Promise((resolve) => {
    if (window.MercadoPago) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  if (cart.quantidade === 0) { router.push('/carrinho'); return }
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) { router.push('/login'); return }
  user.value = currentUser
  
  const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
  profile.value = data || {}
  
  if (profile.value.cpf) cardForm.value.identificationNumber = profile.value.cpf

  await loadMercadoPagoScript()
  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY
  if (!publicKey) { console.error("Falta VITE_MP_PUBLIC_KEY"); return }
  
  try { mpInstance = new window.MercadoPago(publicKey, { locale: 'pt-BR' }) } catch (e) {}
  loading.value = false
})

// --- DETECÇÃO DO CARTÃO ---
const handleCardNumberChange = async () => {
  let num = cardForm.value.cardNumber.replace(/\D/g, '')
  cardForm.value.cardNumber = num.replace(/(\d{4})/g, '$1 ').trim().slice(0, 19)

  if (num.length >= 6 && mpInstance) { 
    const bin = num.substring(0, 6)
    try {
      const paymentMethods = await mpInstance.getPaymentMethods({ bin })
      if (paymentMethods.results.length > 0) {
        const method = paymentMethods.results[0]
        paymentMethodId.value = method.id
        paymentMethodImg.value = method.secure_thumbnail || method.thumbnail 
        issuerId.value = method.issuer.id

        // GERA AS PARCELAS MANUALMENTE (IGNORA API DO MP PARA VALORES)
        installmentsList.value = calcularParcelasPersonalizadas(totalBase.value)

        // Seleciona a 1ª opção
        if (!selectedInstallment.value) selectedInstallment.value = installmentsList.value[0]
      }
    } catch (e) { console.warn(e) }
  } else if (num.length < 6) {
    paymentMethodId.value = null
    paymentMethodImg.value = null
    installmentsList.value = []
  }
}

const handleExpiryChange = (e) => {
  let val = e.target.value.replace(/\D/g, '')
  if (val.length > 2) {
    cardForm.value.cardExpirationMonth = val.substring(0, 2)
    cardForm.value.cardExpirationYear = '20' + val.substring(2, 4)
    e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4) 
  } else {
    cardForm.value.cardExpirationMonth = val
  }
}

async function criarPedido() {
  if (!profile.value?.address) { alert('Endereço obrigatório'); router.push('/perfil'); return }
  if (!profile.value.cpf) {
     const cpf = prompt("CPF Obrigatório:"); if(!cpf) return;
     await supabase.from('profiles').update({ cpf }).eq('id', user.value.id)
     profile.value.cpf = cpf; cardForm.value.identificationNumber = cpf
  }

  processing.value = true

  try {
    let mpPayload = {
      items: cart.itens,
      user_id: user.value.id,
      customer_email: user.value.email,
      customer_cpf: profile.value.cpf,
      shipping_cost: valorFrete.value,
      method: paymentMethod.value
    }

    if (paymentMethod.value === 'credit_card') {
      if (!mpInstance) throw new Error("Sistema indisponível.")
      
      const tokenResponse = await mpInstance.createCardToken({
        cardNumber: cardForm.value.cardNumber.replace(/\s/g, ''),
        cardholderName: cardForm.value.cardholderName,
        cardExpirationMonth: cardForm.value.cardExpirationMonth,
        cardExpirationYear: cardForm.value.cardExpirationYear,
        securityCode: cardForm.value.securityCode,
        identificationType: 'CPF',
        identificationNumber: cardForm.value.identificationNumber.replace(/\D/g, '')
      })

      mpPayload.card_token = tokenResponse.id
      mpPayload.installments = selectedInstallment.value.installments 
      mpPayload.payment_method_id = paymentMethodId.value
      mpPayload.issuer_id = issuerId.value
    }

    const { data, error } = await supabase.functions.invoke('criar-pix', { body: mpPayload })
    if (error || (data && data.error)) throw new Error(data?.message || error?.message)

    cart.limparCarrinho()
    router.push(`/pagamento/${data.order_id}`)
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
            <h2 class="text-xl font-bold uppercase mb-4">1. Endereço</h2>
            <div class="text-sm text-gray-300">{{ profile?.address }}</div>
        </section>

        <section class="bg-[#151515] p-6 rounded-xl border border-white/10">
          <h2 class="text-xl font-bold uppercase mb-6">2. Pagamento</h2>
          <div class="space-y-4">
             <label class="cursor-pointer border p-4 rounded-lg flex items-center gap-4 transition-all" 
                   :class="paymentMethod === 'pix' ? 'border-atk-neon bg-atk-neon/5' : 'border-white/10 hover:border-white/30'">
              <input type="radio" v-model="paymentMethod" value="pix" class="accent-atk-neon w-5 h-5">
              <div class="flex-grow flex justify-between items-center">
                  <span class="font-bold text-lg">PIX</span>
                  <span class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold">2% OFF</span>
              </div>
            </label>

            <label class="cursor-pointer border p-4 rounded-lg flex flex-col gap-4 transition-all"
                   :class="paymentMethod === 'credit_card' ? 'border-atk-neon bg-atk-neon/5' : 'border-white/10 hover:border-white/30'">
              <div class="flex items-center gap-4">
                <input type="radio" v-model="paymentMethod" value="credit_card" class="accent-atk-neon w-5 h-5">
                <div>
                  <span class="font-bold text-lg">Cartão de Crédito</span>
                </div>
              </div>

              <div v-if="paymentMethod === 'credit_card'" class="grid grid-cols-2 gap-4 mt-2 pl-9 animate-fade-in">
                 <div class="col-span-2 relative">
                    <label class="text-xs text-gray-500 uppercase font-bold ml-1">Número</label>
                    <input v-model="cardForm.cardNumber" @input="handleCardNumberChange" type="text" placeholder="0000 0000" class="w-full bg-black border border-white/20 rounded p-3 text-white outline-none focus:border-atk-neon pr-14">
                    <div v-if="paymentMethodImg" class="absolute right-2 top-6 bg-white rounded p-1 h-8 w-12 flex items-center justify-center">
                      <img :src="paymentMethodImg" class="h-full w-full object-contain" />
                    </div>
                 </div>
                 
                 <div class="col-span-2">
                    <label class="text-xs text-gray-500 uppercase font-bold ml-1">Nome</label>
                    <input v-model="cardForm.cardholderName" type="text" placeholder="NOME" class="w-full bg-black border border-white/20 rounded p-3 text-white outline-none focus:border-atk-neon uppercase">
                 </div>
                 
                 <div>
                    <label class="text-xs text-gray-500 uppercase font-bold ml-1">Validade</label>
                    <input @input="handleExpiryChange" type="text" placeholder="MM/AA" maxlength="5" class="w-full bg-black border border-white/20 rounded p-3 text-white outline-none focus:border-atk-neon text-center">
                 </div>
                 
                 <div>
                    <label class="text-xs text-gray-500 uppercase font-bold ml-1">CVV</label>
                    <input v-model="cardForm.securityCode" type="text" placeholder="123" maxlength="4" class="w-full bg-black border border-white/20 rounded p-3 text-white outline-none focus:border-atk-neon text-center">
                 </div>

                 <div class="col-span-2">
                    <label class="text-xs text-gray-500 uppercase font-bold ml-1">Parcelas</label>
                    <select v-model="selectedInstallment" class="w-full bg-black border border-white/20 rounded p-3 text-white outline-none focus:border-atk-neon">
                      <option v-for="inst in installmentsList" :key="inst.installments" :value="inst">
                        {{ inst.recommended_message }}
                      </option>
                      <option v-if="installmentsList.length === 0" :value="null">Digite o cartão...</option>
                    </select>
                 </div>

                 <div class="col-span-2">
                    <label class="text-xs text-gray-500 uppercase font-bold ml-1">CPF Titular</label>
                    <input v-model="cardForm.identificationNumber" type="text" class="w-full bg-black border border-white/20 rounded p-3 text-white outline-none focus:border-atk-neon">
                 </div>
              </div>
            </label>
          </div>
        </section>
      </div>

      <div class="lg:col-span-5">
        <div class="bg-[#1a1a1a] p-6 rounded-xl border border-white/10 sticky top-10">
          <h2 class="font-bold text-lg uppercase mb-4 border-b border-white/10 pb-2">Resumo</h2>
          <div class="space-y-2 mb-6">
             <div class="flex justify-between text-gray-400"><span>Produtos</span> <span>{{ formatMoney(subtotal) }}</span></div>
             <div class="flex justify-between text-gray-400"><span>Frete</span> <span>{{ valorFrete===0?'GRÁTIS':formatMoney(valorFrete) }}</span></div>
             
             <div v-if="paymentMethod==='pix'" class="flex justify-between text-green-500 font-bold">
               <span>Desconto PIX</span> <span>- {{ formatMoney((subtotal+valorFrete)*0.02) }}</span>
             </div>

             <div v-if="paymentMethod==='credit_card' && selectedInstallment && selectedInstallment.installment_rate > 0" class="flex justify-between text-yellow-500 font-bold">
               <span>Juros ({{ (selectedInstallment.installment_rate).toFixed(2) }}%)</span> 
               <span>+ {{ formatMoney(selectedInstallment.total_amount - totalBase) }}</span>
             </div>
          </div>
          
          <div class="flex justify-between items-end mb-6">
            <span class="font-bold text-lg">Total</span>
            <span class="text-2xl font-extrabold text-atk-neon">{{ formatMoney(totalGeral) }}</span>
          </div>
          
          <button @click="criarPedido" :disabled="processing" class="w-full bg-green-500 text-white font-extrabold py-4 rounded-lg uppercase hover:bg-green-400 transition flex justify-center items-center gap-2">
            <span v-if="processing" class="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
            {{ processing ? 'PROCESSANDO...' : 'FINALIZAR PEDIDO' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
</style>