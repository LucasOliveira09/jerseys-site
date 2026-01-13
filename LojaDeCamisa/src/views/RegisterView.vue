<script setup>
import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { supabase } from "../supabase";

const router = useRouter();
const name = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMsg = ref("");

async function handleRegister() {
  loading.value = true;
  errorMsg.value = "";

  try {
    // 1. Criar Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    });
    if (authError) throw authError;

    // 2. Salvar Perfil
    if (authData.user) {
      await supabase.from("profiles").insert({
        id: authData.user.id,
        full_name: name.value,
      });
    }

    alert("Cadastro realizado! Faça login.");
    router.push("/login");
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4"
  >
    <div class="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
      <h2 class="text-3xl font-extrabold text-center text-gray-900 mb-6">
        Crie sua Conta
      </h2>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <input
          v-model="name"
          type="text"
          required
          placeholder="Nome Completo"
          class="w-full px-3 py-2 border appearance-none rounded-md relative block border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-atk-card focus:border-atk-card focus:z-10 sm:text-sm"
        />
        <input
          v-model="email"
          type="email"
          required
          placeholder="Email"
          class="w-full px-3 py-2 appearance-none rounded-md relative block border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-atk-card focus:border-atk-card focus:z-10 sm:text-sm"
        />
        <input
          v-model="password"
          type="password"
          required
          placeholder="Senha (mínimo 6 dígitos)"
          class="w-full px-3 py-2 appearance-none rounded-md relative block border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-atk-card focus:border-atk-card focus:z-10 sm:text-sm"
        />

        <div v-if="errorMsg" class="text-red-600 text-md text-center">
          {{ errorMsg }}
        </div>

        <button
          :disabled="loading"
          class="w-full py-2 px-4 bg-atk-neon text-sm text-atk-dark hover:bg-atk-hover font-bold transition"
        >
          {{ loading ? "Criando..." : "Cadastrar" }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-atk-card">
        Já tem conta?
        <RouterLink to="/login" class="text-atk-dark font-bold"
          >Entrar</RouterLink
        >
      </p>
    </div>
  </div>
</template>
