<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function login() {
  loading.value = true
  errorMsg.value = ''

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    errorMsg.value = 'Email ou senha incorretos.'
  } else {
    // Login com sucesso! Vai para a Home
    router.push('/')
  }
  loading.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-96">
      <h1 class="text-2xl font-bold mb-6 text-center text-gray-800">Login</h1>
      
      <form @submit.prevent="login" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input v-model="email" type="email" required class="w-full border p-2 rounded mt-1" placeholder="seu@email.com" />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Senha</label>
          <input v-model="password" type="password" required class="w-full border p-2 rounded mt-1" placeholder="******" />
        </div>

        <div v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</div>

        <button :disabled="loading" class="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-gray-600">
        Não tem conta? <router-link to="/cadastro" class="text-blue-600 font-bold">Cadastre-se</router-link>
      </p>
    </div>
  </div>
</template>