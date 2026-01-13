<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const open = ref(false) // Menu Mobile
const searchOpen = ref(false) 
const searchQuery = ref('') 
const user = ref(null)
const cart = useCartStore()

// Estado do Dropdown de Usuário
const showUserMenu = ref(false)

const timesBrasileirao = [
  { nome: 'Flamengo', slug: 'flamengo' },
  { nome: 'Corinthians', slug: 'corinthians' },
  { nome: 'Palmeiras', slug: 'palmeiras' },
  { nome: 'São Paulo', slug: 'sao-paulo' },
  { nome: 'Vasco', slug: 'vasco' },
  { nome: 'Cruzeiro', slug: 'cruzeiro' },
  { nome: 'Grêmio', slug: 'gremio' },
  { nome: 'Internacional', slug: 'internacional' },
  { nome: 'Atlético-MG', slug: 'atletico-mg' },
  { nome: 'Santos', slug: 'santos' },
  { nome: 'Botafogo', slug: 'botafogo' },
  { nome: 'Fluminense', slug: 'fluminense' },
]

const ligasInternacionais = [
  { nome: 'Premier League', slug: 'premier-league' },
  { nome: 'La Liga', slug: 'la-liga' },
  { nome: 'Bundesliga', slug: 'bundesliga' },
  { nome: 'Serie A', slug: 'serie-a' },
  { nome: 'Ligue 1', slug: 'ligue-1' },
  { nome: 'Outros', slug: 'outros' },
]

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  user.value = data.user

  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user || null
  })
})

async function handleLogout() {
  await supabase.auth.signOut()
  open.value = false 
  showUserMenu.value = false // Fecha o dropdown
  router.push('/login')
}

function realizarBusca() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/produtos', query: { q: searchQuery.value } })
    searchOpen.value = false 
    searchQuery.value = ''
  }
}
</script>

<template>
  <header class="bg-atk-dark border-b border-white/10 sticky top-0 z-50 font-sans shadow-2xl relative">
    
    <div class="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
      
      <RouterLink to="/" class="font-extrabold text-2xl tracking-tighter text-white flex items-center gap-1 group z-20">
        LGA<span class="text-atk-neon group-hover:shadow-[0_0_10px_#00FFC2] transition-all duration-300">FUT</span> ⚽
      </RouterLink>

      <nav class="hidden md:flex h-full items-center gap-1 z-20">
        <RouterLink to="/" class="h-full flex items-center px-3 text-sm font-bold uppercase tracking-wider text-gray-300 hover:text-atk-neon transition border-b-2 border-transparent hover:border-atk-neon">Início</RouterLink>
        <RouterLink to="/produtos" class="h-full flex items-center px-3 text-sm font-bold uppercase tracking-wider text-gray-300 hover:text-atk-neon transition border-b-2 border-transparent hover:border-atk-neon">Catálogo</RouterLink>

        <div class="group h-full flex items-center relative">
          <button class="h-full flex items-center gap-1 px-3 text-sm font-bold uppercase tracking-wider text-gray-300 group-hover:text-atk-neon transition border-b-2 border-transparent group-hover:border-atk-neon">
            Brasileirão <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3 transition-transform group-hover:rotate-180"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
          </button>
          <div class="absolute top-full left-0 w-[500px] bg-[#1a1a1a] border-t-2 border-atk-neon shadow-2xl rounded-b-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 p-6 grid grid-cols-3 gap-y-3 gap-x-6 z-40">
             <RouterLink v-for="time in timesBrasileirao" :key="time.slug" :to="`/produtos?liga=${time.slug}`" class="text-gray-300 hover:text-atk-neon text-sm font-medium transition flex items-center gap-2 hover:translate-x-1 duration-200">
               <span class="w-1.5 h-1.5 bg-atk-neon rounded-full opacity-0 group-hover:opacity-100 transition"></span> {{ time.nome }}
             </RouterLink>
          </div>
        </div>

        <div class="group h-full flex items-center relative">
          <button class="h-full flex items-center gap-1 px-3 text-sm font-bold uppercase tracking-wider text-gray-300 group-hover:text-atk-neon transition border-b-2 border-transparent group-hover:border-atk-neon">
            Ligas Int. <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3 transition-transform group-hover:rotate-180"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
          </button>
          <div class="absolute top-full left-0 w-64 bg-[#1a1a1a] border-t-2 border-atk-neon shadow-2xl rounded-b-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 py-4 z-40 flex flex-col">
            <RouterLink v-for="liga in ligasInternacionais" :key="liga.slug" :to="`/produtos?liga=${liga.slug}`" class="px-6 py-2.5 text-gray-300 hover:text-atk-dark hover:bg-atk-neon text-sm font-bold transition uppercase tracking-wide">{{ liga.nome }}</RouterLink>
          </div>
        </div>

        <RouterLink to="/produtos?liga=Seleções" class="h-full flex items-center px-3 text-sm font-bold uppercase tracking-wider text-gray-300 hover:text-atk-neon transition border-b-2 border-transparent hover:border-atk-neon">Seleções</RouterLink>
      </nav>

      <div class="flex items-center gap-4 z-20">
        
        <button @click="searchOpen = true" class="text-gray-300 hover:text-atk-neon transition p-2 rounded-full hover:bg-white/5" title="Pesquisar">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
        </button>

        <RouterLink to="/carrinho" class="relative group text-white hover:text-atk-neon transition">
          <div class="p-2 border border-white/20 rounded-lg group-hover:border-atk-neon transition bg-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
            <span v-if="cart.quantidade > 0" class="absolute -top-1 -right-1 bg-atk-neon text-atk-dark text-[10px] font-extrabold w-4 h-4 flex items-center justify-center rounded-full shadow-lg">{{ cart.quantidade }}</span>
          </div>
        </RouterLink>

        <div v-if="user" class="hidden md:block relative">
          <button 
            @click="showUserMenu = !showUserMenu" 
            class="p-2 rounded-full hover:bg-white/10 text-white hover:text-atk-neon transition border border-transparent hover:border-atk-neon"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>

          <div v-if="showUserMenu" class="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-atk-neon/30 rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in-down">
            <div class="px-4 py-3 border-b border-white/5 bg-white/5">
              <p class="text-xs text-gray-500 uppercase">Logado como</p>
              <p class="text-sm font-bold text-white truncate">{{ user.email }}</p>
            </div>
            
            <RouterLink 
              to="/perfil" 
              @click="showUserMenu = false"
              class="block px-4 py-3 text-sm text-gray-300 hover:bg-atk-neon hover:text-atk-dark transition"
            >
              👤 Minha Conta
            </RouterLink>
            
            <button 
              @click="handleLogout" 
              class="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition border-t border-white/5"
            >
              🚪 Sair
            </button>
          </div>

          <div v-if="showUserMenu" @click="showUserMenu = false" class="fixed inset-0 z-40"></div>
        </div>
        
        <RouterLink v-else to="/login" class="hidden md:block bg-atk-neon text-atk-dark px-5 py-2 rounded font-extrabold text-sm uppercase tracking-wide hover:bg-white transition hover:shadow-[0_0_15px_rgba(0,255,194,0.4)]">
          Entrar
        </RouterLink>

        <button class="md:hidden text-white text-2xl" @click="open = !open">☰</button>
      </div>
    </div>

    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
      <div v-if="searchOpen" class="absolute inset-0 bg-atk-dark z-[60] flex items-center px-4 border-b border-atk-neon">
        <div class="max-w-7xl mx-auto w-full flex items-center gap-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-atk-neon"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          <input v-model="searchQuery" @keyup.enter="realizarBusca" type="text" placeholder="O que você procura? (Ex: Flamengo, Neymar...)" class="flex-grow bg-transparent text-white text-xl md:text-2xl font-bold placeholder-gray-600 outline-none h-16 uppercase tracking-wider" autofocus />
          <button @click="searchOpen = false" class="text-gray-400 hover:text-white p-2">✕</button>
        </div>
      </div>
    </transition>

    <div v-if="open" class="md:hidden bg-[#151515] border-t border-white/10 p-4 absolute w-full left-0 top-20 shadow-2xl h-[calc(100vh-80px)] overflow-y-auto z-40 pb-20">
       <div class="flex flex-col gap-1">
         
         <div v-if="user" class="mb-4 bg-white/5 p-4 rounded-lg border border-white/10">
            <div class="flex items-center gap-3 mb-3">
               <div class="w-10 h-10 rounded-full bg-atk-neon flex items-center justify-center text-atk-dark font-bold text-lg">
                 {{ user.email[0].toUpperCase() }}
               </div>
               <div>
                 <p class="text-xs text-gray-400 uppercase">Logado como</p>
                 <p class="text-white font-bold truncate w-40">{{ user.email }}</p>
               </div>
            </div>
            <RouterLink to="/perfil" @click="open = false" class="block text-center bg-atk-neon text-atk-dark py-2 rounded font-bold uppercase text-xs mb-2">Minha Conta</RouterLink>
            <button @click="handleLogout" class="w-full text-center text-red-500 border border-red-500/30 py-2 rounded uppercase text-xs font-bold">Sair</button>
         </div>

         <div v-else class="mb-4 grid grid-cols-2 gap-3">
            <RouterLink to="/login" @click="open = false" class="text-center bg-atk-neon text-atk-dark py-3 rounded font-bold uppercase text-sm">Entrar</RouterLink>
            <RouterLink to="/cadastro" @click="open = false" class="text-center border border-white/20 text-white py-3 rounded font-bold uppercase text-sm">Cadastrar</RouterLink>
         </div>

         <div class="h-px bg-white/10 my-2"></div>

         <RouterLink to="/" @click="open = false" class="py-3 px-4 text-gray-300 font-bold uppercase border-b border-gray-800 hover:text-atk-neon">Início</RouterLink>
         <RouterLink to="/produtos" @click="open = false" class="py-3 px-4 text-gray-300 font-bold uppercase border-b border-gray-800 hover:text-atk-neon">Catálogo Completo</RouterLink>
         <RouterLink to="/carrinho" @click="open = false" class="py-3 px-4 text-gray-300 font-bold uppercase border-b border-gray-800 hover:text-atk-neon flex justify-between">
            Carrinho <span class="text-atk-neon">{{ cart.quantidade }}</span>
         </RouterLink>
         <RouterLink to="/admin" @click="open = false" class="py-3 px-4 text-gray-500 font-bold uppercase border-b border-gray-800 text-xs mt-4">Área Admin</RouterLink>
       </div>
    </div>
  </header>
</template>

<style scoped>
.animate-fade-in-down {
  animation: fadeInDown 0.2s ease-out;
}
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>