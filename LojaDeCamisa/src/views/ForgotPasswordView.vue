<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'
import Swal from 'sweetalert2'

const email = ref('')
const loading = ref(false)

const handleReset = async () => {
  if (!email.value) return 

  loading.value = true
  try {
    // Pega a URL atual do site automaticamente (localhost ou produção)
    const siteUrl = window.location.origin 
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${siteUrl}/resetar-senha`,
    })
    
    if (error) throw error

    Swal.fire({
      icon: 'success', title: 'Link Enviado!',
      text: 'Verifique sua caixa de entrada e spam.',
      background: '#151515', color: '#fff', confirmButtonColor: '#00ffc2'
    })
  } catch (error) {
    Swal.fire({
      icon: 'error', title: 'Erro',
      text: error.message,
      background: '#151515', color: '#fff', confirmButtonColor: '#d33'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
    <div class="bg-[#1a1a1a] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl text-center">
      <h1 class="text-2xl font-bold text-white mb-2 uppercase">Recuperar Senha</h1>
      <p class="text-gray-400 text-sm mb-6">Digite seu e-mail para receber o link de redefinição.</p>
      
      <form @submit.prevent="handleReset" class="space-y-4">
        <input v-model="email" type="email" placeholder="Seu e-mail cadastrado" required class="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none" />
        
        <button :disabled="loading" class="w-full bg-atk-neon text-atk-dark font-extrabold py-3 rounded-lg uppercase tracking-widest hover:bg-white transition flex justify-center items-center gap-2 disabled:opacity-50">
          <span v-if="loading" class="animate-spin h-4 w-4 border-2 border-black rounded-full border-t-transparent"></span>
          {{ loading ? 'Enviando...' : 'ENVIAR LINK' }}
        </button>
      </form>
      
      <div class="mt-6 pt-6 border-t border-white/5">
        <router-link to="/login" class="text-sm text-gray-500 hover:text-white transition">Voltar para Login</router-link>
      </div>
    </div>
  </div>
</template>