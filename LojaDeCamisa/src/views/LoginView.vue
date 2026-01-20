<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const isLogin = ref(true) // Alterna entre Login e Cadastro
const loading = ref(false)
const errorMessage = ref('')

const form = ref({
  email: '',
  password: '',
  fullName: '' // Apenas para cadastro
})

const toggleMode = () => {
  isLogin.value = !isLogin.value
  errorMessage.value = ''
}

async function handleAuth() {
  loading.value = true
  errorMessage.value = ''

  try {
    if (isLogin.value) {
      // --- LOGIN ---
      const { error } = await supabase.auth.signInWithPassword({
        email: form.value.email,
        password: form.value.password
      })
      if (error) throw error
      router.push('/') // Redireciona para Home ou Perfil
    } else {
      // --- CADASTRO ---
      const { data, error } = await supabase.auth.signUp({
        email: form.value.email,
        password: form.value.password,
        options: {
          data: { full_name: form.value.fullName } // Salva o nome nos metadados
        }
      })
      if (error) throw error
      
      // Cria o perfil na tabela 'profiles'
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: form.value.fullName,
          email: form.value.email
        })
      }
      alert('Cadastro realizado! Faça login.')
      isLogin.value = true
    }
  } catch (error) {
    // Tradução básica de erros
    if (error.message.includes('Invalid login')) errorMessage.value = 'E-mail ou senha incorretos.'
    else if (error.message.includes('already registered')) errorMessage.value = 'E-mail já cadastrado.'
    else if (error.message.includes('password')) errorMessage.value = 'A senha deve ter no mínimo 6 caracteres.'
    else errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-atk-dark p-4 relative overflow-hidden">
    
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
      <div class="absolute -top-20 -left-20 w-96 h-96 bg-atk-neon/20 rounded-full blur-[100px]"></div>
      <div class="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]"></div>
    </div>

    <div class="bg-[#151515] border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 relative backdrop-blur-sm">
      
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold text-white uppercase tracking-tighter">
          {{ isLogin ? 'Bem-vindo de volta' : 'Crie sua conta' }}
        </h1>
        <p class="text-gray-400 text-sm mt-2">
          {{ isLogin ? 'Acesse seus pedidos e favoritos' : 'Junte-se ao time e garanta seu manto' }}
        </p>
      </div>

      <div v-if="errorMessage" class="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded text-sm mb-4 text-center">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleAuth" class="space-y-4">
        
        <div v-if="!isLogin" class="animate-fade-in">
          <label class="text-xs uppercase font-bold text-gray-500 ml-1">Nome Completo</label>
          <input v-model="form.fullName" type="text" required class="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none transition" placeholder="Seu nome" />
        </div>

        <div>
          <label class="text-xs uppercase font-bold text-gray-500 ml-1">E-mail</label>
          <input v-model="form.email" type="email" required class="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none transition" placeholder="seu@email.com" />
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-xs uppercase font-bold text-gray-500 ml-1">Senha</label>
            <router-link to="/recuperar-senha" class="text-[10px] text-atk-neon font-bold uppercase hover:underline hover:text-white transition">
              Esqueceu a senha?
            </router-link>
          </div>
          <input v-model="form.password" type="password" required class="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none transition" placeholder="••••••••" />
        </div>

        <button type="submit" :disabled="loading" class="w-full bg-atk-neon text-atk-dark font-extrabold uppercase py-3 rounded-lg hover:bg-white transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
          <span v-if="loading" class="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
          {{ isLogin ? 'Entrar' : 'Cadastrar' }}
        </button>
      </form>
      
      <div class="mt-6 text-center text-sm text-gray-400">
        {{ isLogin ? 'Ainda não tem conta?' : 'Já tem uma conta?' }}
        <button @click="toggleMode" class="text-atk-neon font-bold hover:underline ml-1">
          {{ isLogin ? 'Cadastre-se' : 'Faça Login' }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
</style>