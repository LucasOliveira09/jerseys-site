<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleRegister() {
  loading.value = true
  errorMsg.value = ''

  try {
    // 1. Criar Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value
    })
    if (authError) throw authError

    // 2. Salvar Perfil
    if (authData.user) {
      await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: name.value
      })
    }

    alert('Cadastro realizado! Faça login.')
    router.push('/login')

  } catch (error) {
    errorMsg.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
    <div class="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
      <h2 class="text-3xl font-extrabold text-center text-gray-900 mb-6">Crie sua Conta</h2>
      
      <form class="space-y-4" @submit.prevent="handleRegister">
        <input v-model="name" type="text" required placeholder="Nome Completo" class="w-full px-3 py-2 border rounded-md" />
        <input v-model="email" type="email" required placeholder="Email" class="w-full px-3 py-2 border rounded-md" />
        <input v-model="password" type="password" required placeholder="Senha (mínimo 6 dígitos)" class="w-full px-3 py-2 border rounded-md" />
        
        <div v-if="errorMsg" class="text-red-500 text-sm text-center">{{ errorMsg }}</div>

        <button :disabled="loading" class="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold transition">
          {{ loading ? 'Criando...' : 'Cadastrar' }}
        </button>
      </form>
      
      <p class="mt-4 text-center text-sm">
        Já tem conta? <RouterLink to="/login" class="text-blue-600 font-bold">Entrar</RouterLink>
      </p>
    </div>
  </div>
</template>