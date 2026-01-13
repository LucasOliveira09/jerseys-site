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
    // 1. Cria usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value
    })
    
    if (authError) throw authError

    // 2. Salva nome na tabela 'profiles' (opcional, mas recomendado)
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: name.value,
        email: email.value // Útil para o admin ver quem é quem
      })
      // Se der erro no profile, não trava o cadastro, apenas loga
      if (profileError) console.error('Erro ao salvar perfil:', profileError)
    }

    alert('Cadastro realizado com sucesso! Bem-vindo ao time. ⚽')
    router.push('/') // Já redireciona logado (em muitos casos o Supabase já loga automático)

  } catch (error) {
    errorMsg.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-atk-dark px-4 font-sans relative overflow-hidden">
    
    <div class="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-atk-neon/10 rounded-full blur-[120px]"></div>

    <div class="w-full max-w-md bg-[#151515] p-8 md:p-10 rounded-2xl border border-white/10 shadow-2xl relative z-10 backdrop-blur-sm">
      
      <div class="text-center mb-8">
        <h1 class="font-extrabold text-2xl text-white tracking-tighter uppercase mb-2">
          Crie sua Conta
        </h1>
        <p class="text-gray-400 text-sm">Junte-se a nós e vista a camisa.</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-5">
        
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Nome Completo</label>
          <input 
            v-model="name" 
            type="text" 
            required 
            placeholder="Ex: João Silva" 
            class="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-atk-neon focus:outline-none transition placeholder-gray-700"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
          <input 
            v-model="email" 
            type="email" 
            required 
            placeholder="seu@email.com" 
            class="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-atk-neon focus:outline-none transition placeholder-gray-700"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Senha</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            placeholder="Mínimo 6 caracteres" 
            minlength="6"
            class="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-atk-neon focus:outline-none transition placeholder-gray-700"
          />
        </div>

        <div v-if="errorMsg" class="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded text-center">
          {{ errorMsg }}
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-white text-atk-dark font-extrabold uppercase tracking-widest py-4 rounded-lg hover:bg-atk-neon hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Criando...' : 'Cadastrar' }}
        </button>

      </form>

      <div class="mt-8 text-center border-t border-white/5 pt-6">
        <p class="text-gray-500 text-sm">
          Já tem uma conta? 
          <RouterLink to="/login" class="text-atk-neon font-bold hover:underline">
            Fazer Login
          </RouterLink>
        </p>
      </div>

    </div>
  </div>
</template>