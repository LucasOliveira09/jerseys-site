<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import Swal from 'sweetalert2'

const router = useRouter()
const loading = ref(false)
const form = ref({ name: '', email: '', password: '' })

const showAlert = (icon, title, text) => {
  Swal.fire({ icon, title, text, background: '#151515', color: '#fff', confirmButtonColor: '#00ffc2' })
}

const handleRegister = async () => {
  if (form.value.password.length < 6) return showAlert('warning', 'Senha Curta', 'A senha deve ter no mínimo 6 caracteres.')
  
  loading.value = true
  try {
    // 1. Criar Usuário Auth
    const { data, error } = await supabase.auth.signUp({
      email: form.value.email,
      password: form.value.password,
      options: { data: { full_name: form.value.name } } // Metadados úteis
    })

    if (error) throw error

    // 2. Criar Perfil (Tabela Public)
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: form.value.name.toUpperCase(),
        email: form.value.email
      })
      if (profileError) console.error("Erro perfil:", profileError) // Loga mas não trava o fluxo
    }

    Swal.fire({
      icon: 'success', title: 'Conta Criada!',
      text: 'Seu cadastro foi realizado com sucesso.',
      background: '#151515', color: '#fff', confirmButtonColor: '#00ffc2'
    }).then(() => {
      router.push('/')
    })

  } catch (error) {
    let msg = error.message
    if (msg.includes('already registered')) msg = 'Este e-mail já está em uso.'
    showAlert('error', 'Erro no Cadastro', msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-atk-dark p-4">
    <div class="bg-[#151515] border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold text-white uppercase tracking-tighter">Criar Conta</h1>
        <p class="text-gray-400 text-sm mt-2">Junte-se ao time.</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="text-xs uppercase font-bold text-gray-500 ml-1">Nome Completo</label>
          <input v-model="form.name" type="text" required class="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none uppercase" />
        </div>
        <div>
          <label class="text-xs uppercase font-bold text-gray-500 ml-1">E-mail</label>
          <input v-model="form.email" type="email" required class="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none" />
        </div>
        <div>
          <label class="text-xs uppercase font-bold text-gray-500 ml-1">Senha</label>
          <input v-model="form.password" type="password" required class="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-atk-neon outline-none" placeholder="Mínimo 6 caracteres" />
        </div>

        <button :disabled="loading" class="w-full bg-atk-neon text-atk-dark font-extrabold uppercase py-3 rounded-lg hover:bg-white transition flex justify-center disabled:opacity-50">
          <span v-if="loading" class="animate-spin h-5 w-5 border-2 border-black rounded-full border-t-transparent"></span>
          <span v-else>Cadastrar</span>
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-gray-400">
        Já tem conta? <router-link to="/login" class="text-atk-neon font-bold hover:underline">Entrar</router-link>
      </div>
    </div>
  </div>
</template>