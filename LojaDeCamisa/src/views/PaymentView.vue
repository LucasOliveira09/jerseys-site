<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { supabase } from '../supabase'
import Swal from 'sweetalert2'
import { loadMercadoPago } from '@mercadopago/sdk-js' // <--- IMPORTAÇÃO OFICIAL

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

// --- CÁLCULOS VISUAIS ---
const subtotal = computed(() => cart.itens.reduce((acc, item) => acc + (item.price_sale * item.quantidade), 0))
const valorFrete = computed(() => {
  const qtd = cart.quantidade
  if (qtd === 0) return 0
  if (qtd >= 3) return 0        
  if (qtd === 2) return 20.00   
  return 25.00                  
})
const totalBase = computed(() => subtotal.value + valorFrete.value)

const totalGeralVisual = computed(() => {
  if (paymentMethod.value === 'pix') return totalBase.value * 0.98
  if (paymentMethod.value === 'credit_card' && selectedInstallment.value) {
    return selectedInstallment.value.total_amount
  }
  return totalBase.value 
})

const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const showAlert = (title, text, icon = 'info') => {
  return Swal.fire({
    title: title, text: text, icon: icon,
    background: '#151515', color: '#fff',
    confirmButtonColor: '#00ffc2', confirmButtonText: 'OK'
  })
}

// --- SIMULADOR DE PARCELAS ---
const calcularParcelasPersonalizadas = (valorBase) => {
  const opcoes = []
  for (let i = 1; i <= 6; i++) {
    let taxa = 0
    let textoJuros = 'sem juros'

    if (i === 3) taxa = 0.0579 
    if (i === 4) taxa = 0.0799 
    if (i === 5) taxa = 0.0819 
    if (i === 6) taxa = 0.0839 

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

// --- INICIALIZAÇÃO ---
onMounted(async () => {
  if (cart.quantidade === 0) { router.push('/carrinho'); return }
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) { router.push('/login'); return }
  user.value = currentUser
  
  const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
  profile.value = data || {}
  
  if (profile.value.cpf) cardForm.value.identificationNumber = profile.value.cpf

  // --- CARREGAMENTO OFICIAL DO SDK ---
  try {
    await loadMercadoPago()
    
    const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY
    if (!publicKey) { 
        console.error("ERRO: VITE_MP_PUBLIC_KEY não encontrada no .env")
        return
    }
    
    // Inicializa e coleta automaticamente o Device ID
    mpInstance = new window.MercadoPago(publicKey, { 
        locale: 'pt-BR' 
    })
    
  } catch (e) {
    console.error("Erro ao carregar MP SDK:", e)
  }
  
  loading.value = false
})

// --- LÓGICA DO CARTÃO ---
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

        installmentsList.value = calcularParcelasPersonalizadas(totalBase.value)

        if (!selectedInstallment.value) selectedInstallment.value = installmentsList.value[0]
      }
    } catch (e) { console.warn(e) }
  } else if (num.length < 6) {
    paymentMethodId.value = null; paymentMethodImg.value = null; installmentsList.value = []
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

// --- PAGAMENTO ---
async function criarPedido() {
  if (!profile.value?.address || !profile.value?.number || !profile.value?.cep) {
    Swal.fire({
      title: 'Endereço Incompleto', text: 'Precisamos do seu endereço completo.', icon: 'warning',
      background: '#151515', color: '#fff', confirmButtonText: 'Completar', confirmButtonColor: '#00ffc2'
    }).then(() => router.push('/perfil'))
    return
  }

  if (!profile.value.cpf) {
     const { value: cpfDigitado } = await Swal.fire({
       title: 'CPF Obrigatório', text: 'Informe seu CPF para Nota Fiscal.', input: 'text',
       inputPlaceholder: '000.000.000-00', background: '#151515', color: '#fff',
       confirmButtonColor: '#00ffc2', showCancelButton: true,
       inputValidator: (v) => !v && 'CPF é obrigatório!'
     })
     if(!cpfDigitado) return 
     await supabase.from('profiles').update({ cpf: cpfDigitado }).eq('id', user.value.id)
     profile.value.cpf = cpfDigitado
     cardForm.value.identificationNumber = cpfDigitado
  }

  processing.value = true

  try {
    let cardTokenId = null

    // GERAÇÃO DE TOKEN VIA SDK (Segurança)
    if (paymentMethod.value === 'credit_card') {
      if (!mpInstance) throw new Error("Sistema de pagamento indisponível.")
      
      const tokenResponse = await mpInstance.createCardToken({
        cardNumber: cardForm.value.cardNumber.replace(/\s/g, ''),
        cardholderName: cardForm.value.cardholderName,
        cardExpirationMonth: cardForm.value.cardExpirationMonth,
        cardExpirationYear: cardForm.value.cardExpirationYear,
        securityCode: cardForm.value.securityCode,
        identificationType: 'CPF',
        identificationNumber: cardForm.value.identificationNumber.replace(/\D/g, '')
      })
      cardTokenId = tokenResponse.id
    }

    const itemsBackend = cart.itens.map(item => ({
       id: item.id,
       name: item.name,
       price_sale: item.price_sale, 
       quantidade: item.quantidade || item.quantity,
       tamanhoEscolhido: item.size,
       personalizacao: item.customization || null
    }))

    const payload = {
      items: itemsBackend,
      customer_cpf: profile.value.cpf,
      shipping_cost: valorFrete.value,
      method: paymentMethod.value,
      
      card_token: cardTokenId,
      installments: selectedInstallment.value?.installments,
      payment_method_id: paymentMethodId.value,
      issuer_id: issuerId.value
    }

    const { data, error } = await supabase.functions.invoke('processar-pagamento', { // Corrigido para nome da sua function
      body: payload
    })

    if (error) throw new Error(error.message)
    if (data.error) throw new Error(data.message || 'Erro desconhecido')

    cart.limparCarrinho()
    router.push(`/pagamento/${data.order_id}`)

  } catch (err) {
    console.error(err)
    let msg = err.message
    if (msg.includes('token')) msg = 'Verifique os dados do cartão.'
    if (msg.includes('installments')) msg = 'Selecione o parcelamento.'
    
    showAlert('Erro no Pagamento', msg, 'error')
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] text-white font-sans p-4 flex items-center justify-center">
    
    <div v-if="loading" class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-atk-neon"></div>

    <div v-else class="max-w-md w-full bg-[#151515] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      
      <div class="text-center mb-8 border-b border-white/5 pb-4">
        <p class="text-gray-500 text-xs uppercase tracking-widest mb-1">Pedido #{{ String(order.id).slice(0,8) }}</p>
        <h1 class="text-2xl font-extrabold uppercase text-white">
          {{ order.status === 'Pago' ? 'Pagamento Aprovado' : 
             order.status === 'Falha' ? 'Pagamento Recusado' : 
             order.payment_method === 'pix' ? 'Pague com PIX' : 'Processando...' }}
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

      <div v-else-if="order.status === 'Pendente' && order.payment_method === 'pix'" class="animate-fade-in">
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

      <div v-else-if="order.status === 'Pendente' && order.payment_method === 'credit_card'" class="text-center py-6 animate-fade-in">
         <div class="w-20 h-20 border-4 border-atk-neon border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
         <h3 class="text-lg font-bold text-white mb-2">Analisando Pagamento...</h3>
         <p class="text-gray-400 text-sm leading-relaxed mb-6">
           Estamos processando a transação com seu cartão. <br>
           Isso geralmente leva alguns segundos, mas pode demorar um pouco mais dependendo do banco.
         </p>
         <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded text-xs text-blue-400">
           ℹ️ Não feche esta página. Ela atualizará automaticamente assim que o banco responder.
         </div>
      </div>

      <div v-else-if="order.status === 'Falha'" class="text-center py-6 animate-fade-in">
         <div class="w-24 h-24 bg-red-500/10 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
           ❌
         </div>
         <h3 class="text-xl font-bold text-red-500 mb-2">Pagamento Recusado</h3>
         <p class="text-white text-sm mb-2 font-bold">{{ order.payment_status || 'Transação não autorizada' }}</p>
         <p class="text-gray-400 text-xs mb-8">Verifique os dados do cartão, o limite disponível ou tente outro meio de pagamento.</p>
         
         <div class="flex gap-3 justify-center">
            <button @click="router.push('/carrinho')" class="bg-white/10 text-white px-6 py-3 rounded-lg text-xs font-bold uppercase hover:bg-white/20">Voltar</button>
            <button @click="router.push('/carrinho')" class="bg-red-600 text-white px-6 py-3 rounded-lg text-xs font-bold uppercase hover:bg-red-500">Tentar Novamente</button>
         </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>