<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="menu-topo">
    <div class="wrapper">
      <nav>
        <RouterLink to="/">Início</RouterLink>
        <router-link to="/login" class="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded text-sm font-bold transition">
  Entrar
</router-link>
        </nav>
    </div>
  </header>

  <RouterView />
</template>

<style>
/* Um estilo básico para limpar as margens do navegador */
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background-color: #f4f4f4;
}

.menu-topo {
  background-color: #2c3e50;
  padding: 1rem;
  margin-bottom: 20px;
}

nav a {
  color: white;
  text-decoration: none;
  font-weight: bold;
  font-size: 1.2rem;
}

nav a:hover {
  color: #42b983;
}
</style>