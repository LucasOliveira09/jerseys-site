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
  // 1. Validações Visuais
  if (!profile.value?.address || !profile.value?.number || !profile.value?.cep) {
      Swal.fire({
        title: 'Endereço Incompleto', 
        text: 'Precisamos do endereço para o envio.', 
        icon: 'warning',
        background: '#151515', color: '#fff', confirmButtonColor: '#00ffc2'
      }).then(() => router.push('/perfil'))
      return
  }
  if (!profile.value?.cpf) {
      const { value: cpf } = await Swal.fire({
          title: 'CPF Obrigatório', 
          text: 'Necessário para emissão da nota fiscal.',
          input: 'text', 
          inputPlaceholder: '000.000.000-00',
          confirmButtonColor: '#00ffc2', background: '#151515', color: '#fff',
          inputValidator: (v) => !v && 'Obrigatório!'
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
    
    // 3. Roteamento baseado na resposta do Backend
    if (data.action === 'redirect') {
        // Fluxo InfinitePay (Cartão) -> Redireciona para link externo
        cart.limparCarrinho()
        window.location.href = data.url
    } 
    else if (data.action === 'pix_display') {
        // Fluxo Mercado Pago (Pix) -> Vai para tela de sucesso exibir QR Code
        cart.limparCarrinho()
        router.push(`/pagamento/sucesso?order_nsu=${data.order_id}`)
    }

  } catch (err) {
    console.error(err)
    Swal.fire({
        title: 'Erro no Processamento',
        text: err.message,
        icon: 'error',
        background: '#151515', color: '#fff'
    })
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
        
        <section class="bg-[#151515] p-6 rounded-xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition">
           <div class="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition duration-500">👤</div>
           <div class="flex justify-between items-start mb-4 relative z-10">
             <h2 class="text-xl font-bold uppercase flex items-center gap-3">
               <span class="bg-atk-neon text-atk-dark w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold">1</span>
               Dados da Conta
             </h2>
             <button @click="router.push('/perfil')" class="text-xs text-atk-neon hover:text-white font-bold uppercase tracking-wider transition">Alterar</button>
           </div>
           
           <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm relative z-10">
             <div class="bg-[#1a1a1a] p-4 rounded border border-white/5">
                <p class="text-gray-500 text-[10px] uppercase mb-1 font-bold">Nome</p>
                <p class="font-bold text-white truncate">{{ profile?.full_name || 'Não informado' }}</p>
             </div>
             <div class="bg-[#1a1a1a] p-4 rounded border border-white/5">
                <p class="text-gray-500 text-[10px] uppercase mb-1 font-bold">Email</p>
                <p class="font-bold text-white truncate">{{ user?.email }}</p>
             </div>
           </div>
        </section>

        <section class="bg-[#151515] p-6 rounded-xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition">
           <div class="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition duration-500">📍</div>
           <div class="flex justify-between items-start mb-4 relative z-10">
             <h2 class="text-xl font-bold uppercase flex items-center gap-3">
               <span class="bg-atk-neon text-atk-dark w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold">2</span>
               Endereço de Entrega
             </h2>
             <button @click="router.push('/perfil')" class="text-xs text-atk-neon hover:text-white font-bold uppercase tracking-wider transition">Editar</button>
           </div>

           <div v-if="profile?.address && profile?.number" class="relative z-10">
              <div class="flex flex-col gap-1 p-4 bg-[#1a1a1a] rounded border border-white/5">
                 <span class="font-bold text-lg text-white">{{ profile.address }}, {{ profile.number }}</span>
                 <span class="text-gray-400 text-sm">{{ profile.district }} <span v-if="profile.complement"> - {{ profile.complement }}</span></span>
                 <span class="text-gray-400 text-sm">{{ profile.city }} / {{ profile.state }}</span>
                 <span class="text-atk-neon font-mono text-xs mt-1">CEP: {{ profile.cep }}</span>
              </div>
           </div>
           <div v-else class="text-center py-6 bg-yellow-500/5 border border-yellow-500/20 rounded relative z-10">
              <p class="text-yellow-500 font-bold mb-2 text-sm">Endereço Incompleto ⚠️</p>
              <button @click="router.push('/perfil')" class="bg-yellow-500 text-black px-6 py-2 rounded font-bold text-xs uppercase hover:bg-yellow-400 transition">Preencher Agora</button>
           </div>
        </section>

        <section class="bg-[#151515] p-6 rounded-xl border border-white/10 relative overflow-hidden">
           <div class="flex justify-between items-start mb-6 relative z-10">
             <h2 class="text-xl font-bold uppercase flex items-center gap-3">
               <span class="bg-atk-neon text-atk-dark w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold">3</span>
               Pagamento
             </h2>
           </div>
           
           <div class="space-y-4 relative z-10">
               <label class="cursor-pointer border p-5 rounded-lg flex items-center gap-4 transition-all duration-300 group" 
                     :class="paymentMethod === 'pix' ? 'border-atk-neon bg-atk-neon/5 ring-1 ring-atk-neon shadow-[0_0_15px_rgba(0,255,194,0.1)]' : 'border-white/10 hover:border-white/30 bg-[#1a1a1a]'">
                <div class="relative flex items-center justify-center">
                    <input type="radio" v-model="paymentMethod" value="pix" class="peer appearance-none w-5 h-5 border-2 border-gray-500 rounded-full checked:border-atk-neon checked:bg-atk-neon transition-all">
                    <div class="absolute w-2.5 h-2.5 bg-black rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                </div>
                
                <div class="flex-grow flex justify-between items-center">
                    <div>
                      <span class="font-bold text-lg block text-white group-hover:text-atk-neon transition-colors">PIX</span>
                      <span class="text-xs text-gray-400">Aprovação imediata. QR Code e Copia e Cola.</span>
                    </div>
                    <span class="text-3xl grayscale group-hover:grayscale-0 transition duration-300">💠</span>
                </div>
               </label>

               <label class="cursor-pointer border p-5 rounded-lg flex items-center gap-4 transition-all duration-300 group"
                     :class="paymentMethod === 'credit_card' ? 'border-atk-neon bg-atk-neon/5 ring-1 ring-atk-neon shadow-[0_0_15px_rgba(0,255,194,0.1)]' : 'border-white/10 hover:border-white/30 bg-[#1a1a1a]'">
                <div class="relative flex items-center justify-center">
                    <input type="radio" v-model="paymentMethod" value="credit_card" class="peer appearance-none w-5 h-5 border-2 border-gray-500 rounded-full checked:border-atk-neon checked:bg-atk-neon transition-all">
                    <div class="absolute w-2.5 h-2.5 bg-black rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                </div>

                <div class="flex-grow flex justify-between items-center">
                    <div>
                      <span class="font-bold text-lg block text-white group-hover:text-atk-neon transition-colors">Cartão de Crédito</span>
                      <span class="text-xs text-gray-400">Processado via link seguro. Até 3x sem juros.</span>
                    </div>
                    <span class="text-3xl grayscale group-hover:grayscale-0 transition duration-300">💳</span>
                </div>
               </label>
           </div>
        </section>

      </div>

      <div class="lg:col-span-5">
        <div class="bg-[#1a1a1a] p-6 rounded-xl border border-white/10 sticky top-10 shadow-2xl">
          <h2 class="font-bold text-lg uppercase mb-4 border-b border-white/10 pb-4 tracking-wider">Resumo do Pedido</h2>
          
          <div class="space-y-3 mb-6 text-sm">
             <div class="flex justify-between text-gray-400">
                 <span>Produtos ({{ cart.quantidade }})</span> 
                 <span class="text-white">{{ formatMoney(subtotal) }}</span>
             </div>
             <div class="flex justify-between text-gray-400">
                 <span>Frete</span> 
                 <span :class="valorFrete === 0 ? 'text-atk-neon font-bold' : 'text-white'">
                     {{ valorFrete === 0 ? 'GRÁTIS' : formatMoney(valorFrete) }}
                 </span>
             </div>
          </div>
          
          <div class="flex justify-between items-end mb-8 border-t border-white/10 pt-4">
            <span class="font-bold text-lg text-gray-300">Total</span>
            <div class="text-right">
                <span class="text-3xl font-extrabold text-atk-neon block leading-none">{{ formatMoney(totalFinal) }}</span>
            </div>
          </div>
          
          <button @click="irParaPagamento" :disabled="processing" class="w-full bg-atk-neon hover:bg-white text-atk-dark font-extrabold py-4 rounded-lg uppercase transition-all duration-300 flex justify-center items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,255,194,0.4)] hover:shadow-[0_0_30px_rgba(0,255,194,0.6)]">
            <span v-if="processing" class="animate-spin h-5 w-5 border-2 border-black rounded-full border-t-transparent"></span>
            {{ processing ? 'PROCESSANDO...' : 'FINALIZAR COMPRA 🚀' }}
          </button>
          
          <div v-if="paymentMethod==='credit_card'" class="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded flex items-center gap-3 animate-fade-in">
             <span class="text-xl">🔒</span>
             <p class="text-[10px] text-blue-300 leading-tight">Você será redirecionado para o ambiente seguro da <strong>InfinitePay</strong> para concluir o pagamento.</p>
          </div>
          
        
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
</style>