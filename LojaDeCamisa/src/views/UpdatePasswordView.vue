<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const password = ref('')
const loading = ref(false)

// Verifica se o usuário chegou aqui logado (pelo link do email)
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    alert('Link inválido ou expirado.')
    router.push('/login')
  }
})

const handleUpdatePassword = async () => {
  loading.value = true
  
  const { error } = await supabase.auth.updateUser({
    password: password.value
  })

  if (error) {
    alert('Erro ao atualizar: ' + error.message)
  } else {
    alert('Senha alterada com sucesso!')
    router.push('/') // Manda para a home ou login
  }
  
  loading.value = false
}
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
    <div class="bg-[#1a1a1a] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
      
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-white uppercase">Nova Senha</h1>
        <p class="text-gray-400 text-sm mt-2">Crie uma nova senha segura para sua conta.</p>
      </div>

      <form @submit.prevent="handleUpdatePassword" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nova Senha</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            minlength="6"
            placeholder="Mínimo 6 caracteres"
            class="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none"
          >
        </div>

        <button 
          :disabled="loading" 
          class="w-full bg-atk-neon text-atk-dark font-extrabold py-3 rounded-lg uppercase tracking-widest hover:bg-white transition flex justify-center"
        >
          <span v-if="loading" class="animate-spin h-5 w-5 border-2 border-black rounded-full border-t-transparent"></span>
          <span v-else>SALVAR NOVA SENHA</span>
        </button>
      </form>

    </div>
  </div>
</template>