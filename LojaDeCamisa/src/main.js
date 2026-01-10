// Arquivo: src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/main.css' // <--- Adicione ou verifique esta linha
import { createApp } from 'vue'


import App from './App.vue'
import router from './router' // <--- Importa o arquivo que acabamos de criar

const app = createApp(App)

app.use(createPinia())
app.use(router) // <--- Diz ao Vue para usar o roteador

app.mount('#app')