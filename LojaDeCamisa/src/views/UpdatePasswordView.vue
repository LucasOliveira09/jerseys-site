<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import Swal from 'sweetalert2'

const router = useRouter()
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

onMounted(async () => {
  // Verifica se o hash de recuperação está na URL
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    Swal.fire({
        icon: 'error', title: 'Link Inválido', text: 'Solicite uma nova recuperação.',
        background: '#151515', color: '#fff'
    }).then(() => router.push('/recuperar-senha'))
  }
})

const handleUpdatePassword = async () => {
  if (password.value !== confirmPassword.value) {
    return Swal.fire({ icon: 'warning', title: 'Senhas não conferem', background: '#151515', color: '#fff' })
  }
  
  loading.value = true
  const { error } = await supabase.auth.updateUser({ password: password.value })

  loading.value = false
  if (error) {
    Swal.fire({ icon: 'error', title: 'Erro', text: error.message, background: '#151515', color: '#fff' })
  } else {
    Swal.fire({
      icon: 'success', title: 'Senha Alterada!',
      text: 'Você já pode fazer login com a nova senha.',
      background: '#151515', color: '#fff', confirmButtonColor: '#00ffc2'
    }).then(() => router.push('/login'))
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
    <div class="bg-[#1a1a1a] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl text-center">
      <h1 class="text-2xl font-bold text-white uppercase mb-6">Nova Senha</h1>
      
      <form @submit.prevent="handleUpdatePassword" class="space-y-4 text-left">
        <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Nova Senha</label>
            <input v-model="password" type="password" required minlength="6" class="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none" />
        </div>
        <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Confirmar Senha</label>
            <input v-model="confirmPassword" type="password" required minlength="6" class="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none" />
        </div>

        <button :disabled="loading" class="w-full bg-atk-neon text-atk-dark font-extrabold py-3 rounded-lg uppercase tracking-widest hover:bg-white transition flex justify-center disabled:opacity-50">
          <span v-if="loading" class="animate-spin h-5 w-5 border-2 border-black rounded-full border-t-transparent"></span>
          <span v-else>SALVAR NOVA SENHA</span>
        </button>
      </form>
    </div>
  </div>
</template>