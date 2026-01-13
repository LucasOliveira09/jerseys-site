<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const user = ref(null)
const orders = ref([])
const router = useRouter()

onMounted(async () => {
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    router.push('/login')
    return
  }
  user.value = currentUser

  // Carregar pedidos (Futuro)
  // const { data } = await supabase.from('orders').select('*').eq('user_id', user.value.id)
  // orders.value = data
})
</script>

<template>
  <div class="min-h-screen bg-atk-dark text-white p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold uppercase text-atk-neon mb-6">Minha Conta</h1>
      
      <div v-if="user" class="bg-[#151515] p-6 rounded-xl border border-white/10 mb-8">
        <h2 class="text-xl font-bold mb-4">Dados Pessoais</h2>
        <p class="text-gray-400">Email: <span class="text-white">{{ user.email }}</span></p>
        <p class="text-gray-400">ID: <span class="text-white text-xs">{{ user.id }}</span></p>
      </div>

      <h2 class="text-xl font-bold mb-4">Meus Pedidos</h2>
      <div class="bg-[#151515] p-10 rounded-xl border border-dashed border-white/10 text-center text-gray-500">
        Você ainda não fez nenhum pedido.
      </div>
    </div>
  </div>
</template>