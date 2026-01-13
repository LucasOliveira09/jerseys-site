<script setup>
import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { supabase } from "../supabase";

const router = useRouter();
const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMsg = ref("");

async function handleLogin() {
  loading.value = true;
  errorMsg.value = "";

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) throw error;

    // Sucesso! Volta para a home
    router.push("/");
  } catch (error) {
    errorMsg.value = "Email ou senha incorretos.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Bem-vindo de volta!
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Faça login para gerenciar seus pedidos
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email-address" class="sr-only">Email</label>
            <input
              v-model="email"
              id="email-address"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-atk-card focus:border-atk-card focus:z-10 sm:text-sm"
              placeholder="Endereço de Email"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Senha</label>
            <input
              v-model="password"
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="appearance-none rounded-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-atk-card focus:border-atk-card focus:z-10 sm:text-sm"
              placeholder="Senha"
            />
          </div>
        </div>

        <div
          v-if="errorMsg"
          class="text-red-500 text-sm text-center font-medium"
        >
          {{ errorMsg }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-bold text-atk-dark bg-atk-neon hover:bg-atk-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-colors"
          >
            <span v-if="loading">Entrando...</span>
            <span v-else>Entrar</span>
          </button>
        </div>

        <div class="text-center text-sm">
          <p class="text-gray-600">
            Não tem uma conta?
            <RouterLink
              to="/cadastro"
              class="font-bold text-atk-card hover:text-atk-dark"
            >
              Cadastre-se aqui
            </RouterLink>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>
