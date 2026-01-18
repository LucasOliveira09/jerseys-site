<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  if (error) {
    errorMsg.value = 'E-mail ou senha incorretos.'
    loading.value = false
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
    <div class="bg-[#1a1a1a] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
      
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold text-white uppercase tracking-tighter">Entrar</h1>
        <p class="text-gray-400 text-sm mt-2">Bem-vindo de volta ao time.</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail</label>
          <input v-model="email" type="email" required class="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none transition">
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Senha</label>
          <input v-model="password" type="password" required class="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none transition">
        </div>

        <div v-if="errorMsg" class="text-red-500 text-sm font-bold text-center bg-red-500/10 p-2 rounded">
          {{ errorMsg }}
        </div>

        <button :disabled="loading" class="w-full bg-atk-neon text-atk-dark font-extrabold py-3 rounded-lg uppercase tracking-widest hover:bg-white transition flex justify-center">
          <span v-if="loading" class="animate-spin h-5 w-5 border-2 border-black rounded-full border-t-transparent"></span>
          <span v-else>Acessar Conta</span>
        </button>
      </form>

      <div class="mt-6 text-center text-sm space-y-2">
        <p class="text-gray-400">
          Esqueceu a senha? 
          <router-link to="/recuperar-senha" class="text-atk-neon font-bold hover:underline">Recuperar</router-link>
        </p>
        <p class="text-gray-400">
          Não tem conta? 
          <router-link to="/registro" class="text-atk-neon font-bold hover:underline">Criar agora</router-link>
        </p>
      </div>

    </div>
  </div>
</template>