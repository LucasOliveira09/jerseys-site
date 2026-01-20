<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import Swal from 'sweetalert2'

const router = useRouter()
const loading = ref(false)
const form = ref({ email: '', password: '' })

const showAlert = (icon, title, text) => {
  Swal.fire({ icon, title, text, background: '#151515', color: '#fff', confirmButtonColor: '#00ffc2' })
}

// --- LOGIN GOOGLE ---
const handleGoogleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redireciona de volta para o seu site após o login no Google
        redirectTo: window.location.origin 
      }
    })
    if (error) throw error
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Erro no Google',
      text: error.message,
      background: '#151515', color: '#fff'
    })
  }
}

// --- LOGIN EMAIL/SENHA ---
const handleLogin = async () => {
  loading.value = true
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: form.value.email,
      password: form.value.password
    })

    if (error) throw error

    // Sucesso
    router.push('/') 

  } catch (error) {
    let msg = error.message
    if (msg.includes('Invalid login')) msg = 'E-mail ou senha incorretos.'
    showAlert('error', 'Acesso Negado', msg)
  } finally {
    loading.value = false
  }
}


</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0f0f0f] p-4 font-sans relative overflow-hidden">
    
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#00ffc2] opacity-5 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-blue-600 opacity-5 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="bg-[#151515] border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 relative">
      
      <div class="text-center mb-6">
        <h1 class="text-3xl font-extrabold text-white uppercase tracking-tighter">Login</h1>
        <p class="text-gray-400 text-sm mt-2">Bem-vindo de volta.</p>
      </div>

      <button 
        @click="handleGoogleLogin" 
        class="w-full bg-white text-black font-bold py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-200 transition mb-6 transform active:scale-[0.98]"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        <span>Entrar com Google</span>
      </button>

      <div class="relative mb-6 text-center">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-white/10"></div></div>
        <div class="relative bg-[#151515] px-4 text-xs text-gray-500 uppercase font-bold">Ou via E-mail</div>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        
        <div>
          <label class="block text-xs uppercase font-bold text-gray-500 mb-1 ml-1">E-mail</label>
          <input v-model="form.email" type="email" required class="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:border-[#00ffc2] outline-none transition" placeholder="seu@email.com" />
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-xs uppercase font-bold text-gray-500 ml-1">Senha</label>
            <router-link to="/recuperar-senha" class="text-[10px] text-[#00ffc2] font-bold uppercase hover:underline hover:text-white transition">
              Esqueceu?
            </router-link>
          </div>
          <input v-model="form.password" type="password" required class="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:border-[#00ffc2] outline-none transition" placeholder="••••••••" />
        </div>

        <button 
          :disabled="loading" 
          class="w-full bg-[#00ffc2] text-[#0f0f0f] font-extrabold uppercase py-3 rounded-lg hover:bg-white hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,255,194,0.3)] mt-2"
        >
          <span v-if="loading">Entrando...</span>
          <span v-else>Entrar</span>
        </button>

      </form>
      
      <div class="mt-6 text-center text-sm text-gray-400">
        Não tem conta? 
        <router-link to="/registro" class="text-[#00ffc2] font-bold hover:underline ml-1">
          Criar conta
        </router-link>
      </div>

    </div>
  </div>
</template>