<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'

const email = ref('')
const loading = ref(false)
const message = ref('')
const errorMsg = ref('')

const handleReset = async () => {
  loading.value = true
  message.value = ''
  errorMsg.value = ''

  // O redirectTo é para onde o usuário vai quando clicar no link do e-mail
  // Vamos criar essa rota '/resetar-senha' no Passo 2
  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${window.location.origin}/resetar-senha`,
  })
  
  if (error) {
    errorMsg.value = 'Erro: ' + error.message
  } else {
    message.value = 'Link enviado! Verifique seu e-mail (e a caixa de spam).'
  }
  
  loading.value = false
}
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
    <div class="bg-[#1a1a1a] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl text-center">
      
      <h1 class="text-2xl font-bold text-white mb-2 uppercase">Recuperar Senha</h1>
      <p class="text-gray-400 text-sm mb-6">Digite seu e-mail para receber o link de redefinição.</p>
      
      <div v-if="message" class="bg-green-500/10 text-green-400 p-4 rounded mb-6 border border-green-500/20">
        {{ message }}
      </div>

      <form v-else @submit.prevent="handleReset" class="space-y-4">
        <div>
          <input 
            v-model="email" 
            type="email" 
            placeholder="Seu e-mail cadastrado" 
            required 
            class="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none transition"
          >
        </div>

        <div v-if="errorMsg" class="text-red-500 text-sm font-bold">
          {{ errorMsg }}
        </div>

        <button 
          :disabled="loading" 
          class="w-full bg-atk-neon text-atk-dark font-extrabold py-3 rounded-lg uppercase tracking-widest hover:bg-white transition flex justify-center items-center gap-2"
        >
          <span v-if="loading" class="animate-spin h-4 w-4 border-2 border-black rounded-full border-t-transparent"></span>
          {{ loading ? 'Enviando...' : 'ENVIAR LINK' }}
        </button>
      </form>
      
      <div class="mt-6 pt-6 border-t border-white/5">
        <router-link to="/login" class="text-sm text-gray-500 hover:text-white transition">
          Voltar para Login
        </router-link>
      </div>

    </div>
  </div>
</template>