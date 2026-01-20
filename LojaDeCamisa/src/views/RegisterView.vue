<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import Swal from 'sweetalert2'

const router = useRouter()
const loading = ref(false)

const form = ref({ name: '', email: '', password: '', confirmPassword: '' })

// --- FORÇA DA SENHA ---
const passwordStrength = computed(() => {
  const pwd = form.value.password
  let score = 0
  if (!pwd) return 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return score
})

// Cores da barra de força (usando classes padrão do Tailwind)
const strengthColor = computed(() => {
  const score = passwordStrength.value
  if (score <= 1) return 'bg-red-500'
  if (score === 2) return 'bg-yellow-500'
  if (score === 3) return 'bg-blue-400'
  return 'bg-[#00ffc2] shadow-[0_0_10px_#00ffc2]' // Verde Neon Brilhante
})

const strengthText = computed(() => {
  const score = passwordStrength.value
  if (score === 0) return ''
  if (score <= 1) return 'Fraca'
  if (score === 2) return 'Média'
  if (score === 3) return 'Boa'
  return 'Forte'
})

const passwordsMatch = computed(() => form.value.password === form.value.confirmPassword)

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

// --- REGISTRO EMAIL ---
const handleRegister = async () => {
  if (passwordStrength.value < 2) return showAlert('warning', 'Senha Fraca', 'Sua senha precisa ser mais forte.') // Nível 2 já aceita
  if (!passwordsMatch.value) return showAlert('warning', 'Erro', 'As senhas não conferem.')

  loading.value = true
  try {
    const { data, error } = await supabase.auth.signUp({
      email: form.value.email,
      password: form.value.password,
      options: { data: { full_name: form.value.name } }
    })

    if (error) throw error

    // Tenta criar perfil (backup caso o trigger SQL falhe)
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: form.value.name.toUpperCase(),
        email: form.value.email
      }).catch(() => {}) // Ignora erro se já existir pelo trigger
    }

    Swal.fire({
      icon: 'success', title: 'Conta Criada!',
      text: 'Bem-vindo ao time.',
      background: '#151515', color: '#fff', confirmButtonColor: '#00ffc2'
    }).then(() => router.push('/'))

  } catch (error) {
    let msg = error.message
    if (msg.includes('already registered')) msg = 'E-mail já cadastrado.'
    showAlert('error', 'Erro', msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0f0f0f] p-4 font-sans relative overflow-hidden">
    
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#00ffc2] opacity-10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-blue-600 opacity-10 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="bg-[#151515] border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 relative">
      
      <div class="text-center mb-6">
        <h1 class="text-3xl font-extrabold text-white uppercase tracking-tighter">Criar Conta</h1>
        <p class="text-gray-400 text-sm mt-2">Segurança e Rapidez.</p>
      </div>

      <button 
        @click="handleGoogleRegister" 
        class="w-full bg-white text-black font-bold py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-200 transition mb-6 transform active:scale-[0.98]"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        <span>Entrar com Google</span>
      </button>

      <div class="relative mb-6 text-center">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-white/10"></div></div>
        <div class="relative bg-[#151515] px-4 text-xs text-gray-500 uppercase font-bold">Ou preencha abaixo</div>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        
        <div>
          <label class="block text-xs uppercase font-bold text-gray-500 mb-1 ml-1">Nome Completo</label>
          <input v-model="form.name" type="text" required class="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:border-[#00ffc2] outline-none transition uppercase" placeholder="SEU NOME" />
        </div>

        <div>
          <label class="block text-xs uppercase font-bold text-gray-500 mb-1 ml-1">E-mail</label>
          <input v-model="form.email" type="email" required class="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:border-[#00ffc2] outline-none transition" placeholder="seu@email.com" />
        </div>

        <div>
          <label class="block text-xs uppercase font-bold text-gray-500 mb-1 ml-1">Senha</label>
          <input v-model="form.password" type="password" required class="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:border-[#00ffc2] outline-none transition" placeholder="******" />
          
          <div class="mt-2 h-1 w-full bg-gray-800 rounded-full overflow-hidden flex" v-if="form.password">
            <div class="h-full transition-all duration-500" :class="strengthColor" :style="{ width: (passwordStrength * 25) + '%' }"></div>
          </div>
          <div class="flex justify-between mt-1" v-if="form.password">
             <span class="text-[10px] text-gray-500">Força da senha</span>
             <span class="text-[10px] font-bold uppercase" :class="passwordStrength >= 3 ? 'text-[#00ffc2]' : 'text-gray-400'">{{ strengthText }}</span>
          </div>
        </div>

        <div>
          <label class="block text-xs uppercase font-bold text-gray-500 mb-1 ml-1">Confirmar Senha</label>
          <input v-model="form.confirmPassword" type="password" required class="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:border-[#00ffc2] outline-none transition" :class="{'!border-red-500': form.confirmPassword && !passwordsMatch, '!border-green-500': form.confirmPassword && passwordsMatch}" placeholder="******" />
          <p v-if="form.confirmPassword && !passwordsMatch" class="text-red-500 text-[10px] mt-1 font-bold">As senhas não coincidem.</p>
        </div>

        <button 
          :disabled="loading || passwordStrength < 2 || !passwordsMatch" 
          class="w-full bg-[#00ffc2] text-[#0f0f0f] font-extrabold uppercase py-3 rounded-lg hover:bg-white hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,255,194,0.3)] mt-2"
        >
          <span v-if="loading">Criando...</span>
          <span v-else>Criar Conta</span>
        </button>

      </form>

      <div class="mt-6 text-center text-sm text-gray-400">
        Já possui conta? 
        <router-link to="/login" class="text-[#00ffc2] font-bold hover:underline ml-1">Entrar</router-link>
      </div>

    </div>
  </div>
</template>