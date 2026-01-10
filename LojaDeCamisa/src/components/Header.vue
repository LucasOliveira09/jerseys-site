Fico muito feliz que tenha gostado! O visual Dark/Neon realmente passa uma imagem muito mais profissional e de "autoridade" no nicho de esportes.

Para criar esse menu suspenso (o famoso Dropdown ou Mega Menu) ao passar o mouse, vamos usar a estratégia de group-hover do Tailwind.

Não precisamos de JavaScript complexo para isso, o CSS resolve com elegância. Vou estruturar para que o Brasileirão mostre uma grade com os times (já que são muitos) e as Ligas Internacionais mostrem uma lista vertical.

Aqui está o novo código completo do src/components/Header.vue.

Atualize seu Header.vue
Substitua todo o conteúdo do arquivo por este código atualizado:

Snippet de código

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const open = ref(false)
const user = ref(null)
const cart = useCartStore()

// Dados para os Menus Suspensos
const timesBrasileirao = [
  { nome: 'Flamengo', slug: 'flamengo' },
  { nome: 'Corinthians', slug: 'corinthians' },
  { nome: 'Cruzeiro', slug: 'cruzeiro' },
  { nome: 'Vasco', slug: 'vasco' },
  { nome: 'Palmeiras', slug: 'palmeiras' },
  { nome: 'São Paulo', slug: 'sao-paulo' },
  { nome: 'Grêmio', slug: 'gremio' },
  { nome: 'Internacional', slug: 'internacional' },
  { nome: 'Atlético-MG', slug: 'atletico-mg' },
  { nome: 'Santos', slug: 'santos' },
  { nome: 'Botafogo', slug: 'botafogo' },
  { nome: 'Fluminense', slug: 'fluminense' },
]

const ligasInternacionais = [
  { nome: 'Premier League (Inglaterra)', slug: 'premier-league' },
  { nome: 'La Liga (Espanha)', slug: 'la-liga' },
  { nome: 'Bundesliga (Alemanha)', slug: 'bundesliga' },
  { nome: 'Serie A (Itália)', slug: 'serie-a' },
  { nome: 'Ligue 1 (França)', slug: 'ligue-1' },
  { nome: 'Outros Campeonatos', slug: 'outros' },
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
  router.push('/login')
}
</script>

<template>
  <header class="bg-atk-dark border-b border-white/10 sticky top-0 z-50 font-sans shadow-2xl">
    <div class="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center relative">
      
      <RouterLink to="/" class="font-extrabold text-2xl tracking-tighter text-white flex items-center gap-1 group z-50">
        LGA<span class="text-atk-neon group-hover:shadow-[0_0_10px_#00FFC2] transition-all duration-300">FUT+10</span> ⚽
      </RouterLink>

      <nav class="hidden md:flex h-full items-center gap-1">
        
        <RouterLink to="/" class="h-full flex items-center px-4 text-sm font-bold uppercase tracking-wider text-gray-300 hover:text-atk-neon transition border-b-2 border-transparent hover:border-atk-neon">
          Início
        </RouterLink>

        <div class="group h-full flex items-center relative">
          <button class="h-full flex items-center gap-1 px-4 text-sm font-bold uppercase tracking-wider text-gray-300 group-hover:text-atk-neon transition border-b-2 border-transparent group-hover:border-atk-neon">
            Brasileirão
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3 transition-transform group-hover:rotate-180">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          
          <div class="absolute top-full left-0 w-[500px] bg-[#1a1a1a] border-t-2 border-atk-neon shadow-2xl rounded-b-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 p-6 grid grid-cols-3 gap-y-3 gap-x-6 z-40">
             <div class="col-span-3 text-xs text-gray-500 font-bold mb-2 uppercase tracking-widest border-b border-gray-700 pb-1">
               Times Nacionais
             </div>
             
             <RouterLink 
                v-for="time in timesBrasileirao" 
                :key="time.slug" 
                :to="`/categoria/${time.slug}`" 
                class="text-gray-300 hover:text-atk-neon text-sm font-medium transition flex items-center gap-2 hover:translate-x-1 duration-200"
             >
               <span class="w-1.5 h-1.5 bg-atk-neon rounded-full opacity-0 group-hover:opacity-100 transition"></span>
               {{ time.nome }}
             </RouterLink>
          </div>
        </div>

        <div class="group h-full flex items-center relative">
          <button class="h-full flex items-center gap-1 px-4 text-sm font-bold uppercase tracking-wider text-gray-300 group-hover:text-atk-neon transition border-b-2 border-transparent group-hover:border-atk-neon">
            Ligas Internacionais
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3 transition-transform group-hover:rotate-180">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <div class="absolute top-full left-0 w-64 bg-[#1a1a1a] border-t-2 border-atk-neon shadow-2xl rounded-b-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 py-4 z-40 flex flex-col">
            <RouterLink 
                v-for="liga in ligasInternacionais" 
                :key="liga.slug" 
                :to="`/categoria/${liga.slug}`" 
                class="px-6 py-2.5 text-gray-300 hover:text-atk-dark hover:bg-atk-neon text-sm font-bold transition uppercase tracking-wide"
             >
               {{ liga.nome }}
             </RouterLink>
          </div>
        </div>

        <RouterLink to="/categoria/selecoes" class="h-full flex items-center px-4 text-sm font-bold uppercase tracking-wider text-gray-300 hover:text-atk-neon transition border-b-2 border-transparent hover:border-atk-neon">
          Seleções
        </RouterLink>

      </nav>

      <div class="flex items-center gap-6 z-50">
        
        <RouterLink to="/carrinho" class="relative group text-white hover:text-atk-neon transition">
          <div class="p-2 border border-white/20 rounded-lg group-hover:border-atk-neon transition bg-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <span v-if="cart.quantidade > 0" class="absolute -top-1 -right-1 bg-atk-neon text-atk-dark text-[10px] font-extrabold w-4 h-4 flex items-center justify-center rounded-full shadow-lg">
              {{ cart.quantidade }}
            </span>
          </div>
        </RouterLink>

        <div v-if="user" class="flex items-center gap-3">
          <div class="hidden lg:block text-right">
             <p class="text-[10px] text-gray-400 uppercase tracking-widest">Bem vindo</p>
             <p class="text-xs font-bold text-white max-w-[100px] truncate">{{ user.email.split('@')[0] }}</p>
          </div>
          <button @click="handleLogout" class="text-xs font-bold text-red-500 hover:text-red-400 border border-red-500/30 px-3 py-1.5 rounded uppercase hover:bg-red-500/10 transition">
            Sair
          </button>
        </div>
        
        <RouterLink v-else to="/login" class="bg-atk-neon text-atk-dark px-5 py-2 rounded font-extrabold text-sm uppercase tracking-wide hover:bg-white transition hover:shadow-[0_0_15px_rgba(0,255,194,0.4)]">
          Entrar
        </RouterLink>

        <button class="md:hidden text-white text-2xl" @click="open = !open">☰</button>
      </div>
    </div>

    <div v-if="open" class="md:hidden bg-[#151515] border-t border-white/10 p-4 absolute w-full left-0 top-20 shadow-2xl h-screen overflow-y-auto z-40">
       <div class="flex flex-col gap-1">
         <RouterLink to="/" @click="open = false" class="py-3 px-4 text-gray-300 font-bold uppercase border-b border-gray-800">Início</RouterLink>
         
         <div class="mt-4 px-4 text-atk-neon text-xs font-extrabold uppercase tracking-widest mb-2">Brasileirão</div>
         <div class="grid grid-cols-2 gap-2 px-4 mb-4">
            <RouterLink v-for="time in timesBrasileirao" :key="time.slug" :to="`/categoria/${time.slug}`" @click="open = false" class="text-gray-400 text-sm py-1 hover:text-white">
              {{ time.nome }}
            </RouterLink>
         </div>

         <div class="mt-2 px-4 text-atk-neon text-xs font-extrabold uppercase tracking-widest mb-2">Internacional</div>
         <div class="flex flex-col px-4 mb-4">
            <RouterLink v-for="liga in ligasInternacionais" :key="liga.slug" :to="`/categoria/${liga.slug}`" @click="open = false" class="text-gray-400 text-sm py-2 border-b border-gray-800 hover:text-white">
              {{ liga.nome }}
            </RouterLink>
         </div>
       </div>
    </div>
  </header>
</template>