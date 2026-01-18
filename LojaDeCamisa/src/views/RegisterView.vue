<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)

const handleRegister = async () => {
  loading.value = true
  
  // 1. Cria usuário na Auth
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  })

  if (error) {
    alert('Erro: ' + error.message)
    loading.value = false
    return
  }

  // 2. Cria perfil na tabela profiles
  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: name.value,
      email: email.value
    })
    alert('Conta criada com sucesso!')
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
    <div class="bg-[#1a1a1a] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold text-white uppercase tracking-tighter">Criar Conta</h1>
        <p class="text-gray-400 text-sm mt-2">Junte-se à nossa comunidade.</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
          <input v-model="name" type="text" required class="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none uppercase">
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail</label>
          <input v-model="email" type="email" required class="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none">
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Senha</label>
          <input v-model="password" type="password" required minlength="6" class="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none">
        </div>

        <button :disabled="loading" class="w-full bg-atk-neon text-atk-dark font-extrabold py-3 rounded-lg uppercase tracking-widest hover:bg-white transition flex justify-center">
          <span v-if="loading" class="animate-spin h-5 w-5 border-2 border-black rounded-full border-t-transparent"></span>
          <span v-else>Cadastrar</span>
        </button>
      </form>

      <div class="mt-6 text-center text-sm">
        <p class="text-gray-400">
          Já tem conta? 
          <router-link to="/login" class="text-atk-neon font-bold hover:underline">Entrar</router-link>
        </p>
      </div>
    </div>
  </div>
</template>