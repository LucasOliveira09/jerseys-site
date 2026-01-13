<script setup>
import { RouterView } from 'vue-router'
import Header from './components/Header.vue' // Seu Header atual
import Footer from './components/Footer.vue' // <--- Importe o Footer aqui
</script>

<template>
  <div class="bg-atk-dark min-h-screen flex flex-col">
    <Header />

    <main class="flex-grow">
      <RouterView />
    </main>

    <Footer />
  </div>
</template>