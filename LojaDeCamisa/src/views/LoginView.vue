<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) throw error

    // Sucesso! Volta para a home ou para onde o usuário estava
    router.push('/')
  } catch (error) {
    errorMsg.value = 'Email ou senha incorretos. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-atk-dark px-4 font-sans relative overflow-hidden">
    
    <div class="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-atk-neon/10 rounded-full blur-[120px]"></div>
    <div class="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]"></div>

    <div class="w-full max-w-md bg-[#151515] p-8 md:p-10 rounded-2xl border border-white/10 shadow-2xl relative z-10 backdrop-blur-sm">
      
      <div class="text-center mb-8">
        <h1 class="font-extrabold text-3xl text-white tracking-tighter mb-2">
          LGA<span class="text-atk-neon">FUT</span>
        </h1>
        <p class="text-gray-400 text-sm">Entre para acessar seus pedidos e carrinho.</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">✉️</span>
            <input 
              v-model="email" 
              type="email" 
              required 
              placeholder="seu@email.com" 
              class="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-atk-neon focus:outline-none transition placeholder-gray-700"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Senha</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔒</span>
            <input 
              v-model="password" 
              type="password" 
              required 
              placeholder="••••••••" 
              class="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-atk-neon focus:outline-none transition placeholder-gray-700"
            />
          </div>
        </div>

        <div v-if="errorMsg" class="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded text-center">
          {{ errorMsg }}
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-atk-neon text-atk-dark font-extrabold uppercase tracking-widest py-4 rounded-lg hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(0,255,194,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="loading" class="animate-pulse">Entrando...</span>
          <span v-else>Entrar Agora</span>
        </button>

      </form>

      <div class="mt-8 text-center border-t border-white/5 pt-6">
        <p class="text-gray-500 text-sm">
          Ainda não tem conta? 
          <RouterLink to="/cadastro" class="text-atk-neon font-bold hover:underline">
            Crie grátis
          </RouterLink>
        </p>
      </div>

    </div>
  </div>
</template>