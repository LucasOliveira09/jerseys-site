<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'
// Importamos nosso novo serviço
import { authValidator } from '../services/authValidator'

const router = useRouter()

const name = ref('')
const cpf = ref('')
const email = ref('')
const password = ref('')
const phone = ref('')

const loading = ref(false)
const errorMsg = ref('')

async function cadastrar() {
  loading.value = true
  errorMsg.value = ''

  // 1. PARE AQUI: Verificamos os dados ANTES de ir pro banco
  const erroValidacao = authValidator.verificarFormulario({
    name: name.value,
    cpf: cpf.value,
    email: email.value,
    password: password.value,
    phone: phone.value
  })

  // Se o validador retornou um texto, é um erro. Mostramos e paramos.
  if (erroValidacao) {
    errorMsg.value = erroValidacao
    loading.value = false
    return
  }

  // Se passou, seguimos para o Supabase
  try {
    // Limpa caracteres especiais do CPF e Telefone antes de salvar
    const cpfLimpo = cpf.value.replace(/[^\d]+/g, '')
    const phoneLimpo = phone.value.replace(/[^\d]+/g, '')

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })

    if (authError) throw authError

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: name.value,
        cpf: cpfLimpo, // Salva só números
        phone: phoneLimpo // Salva só números
      })

    if (profileError) throw profileError

    alert('Cadastro realizado com sucesso!')
    router.push('/')

  } catch (error) {
    errorMsg.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 py-10">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6 text-center text-gray-800">Crie sua Conta</h1>
      
      <form @submit.prevent="cadastrar" class="space-y-4">
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Nome Completo</label>
          <input v-model="name" type="text" required class="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="João da Silva" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">CPF</label>
            <input v-model="cpf" type="text" required class="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="000.000.000-00" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Telefone</label>
            <input v-model="phone" type="tel" class="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="(11) 99999-9999" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input v-model="email" type="email" required class="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="seu@email.com" />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Senha</label>
          <input v-model="password" type="password" required class="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="******" />
        </div>

        <div v-if="errorMsg" class="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200">
          {{ errorMsg }}
        </div>

        <button :disabled="loading" class="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition disabled:opacity-50">
          {{ loading ? 'Criando cadastro...' : 'Finalizar Cadastro' }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-gray-600">
        Já tem conta? <router-link to="/login" class="text-blue-600 font-bold hover:underline">Entrar</router-link>
      </p>
    </div>
  </div>
</template>