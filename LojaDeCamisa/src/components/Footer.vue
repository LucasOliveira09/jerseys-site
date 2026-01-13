<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="bg-[#151515] border-t border-white/10 pt-16 pb-8 text-sm font-sans text-gray-400">
    <div class="max-w-7xl mx-auto px-6">
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        
        <div class="space-y-4">
          <RouterLink to="/" class="font-extrabold text-2xl tracking-tighter text-white flex items-center gap-1">
            LGA<span class="text-atk-neon">FUT</span> ⚽
          </RouterLink>
          <p class="leading-relaxed text-xs">
            Sua loja especializada em camisas de time importadas. Qualidade de elite, preço justo e a paixão que nos une.
          </p>
          <div class="flex gap-4 pt-2">
            <a href="#" class="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-atk-neon hover:text-atk-dark transition">📸</a>
            <a href="#" class="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-atk-neon hover:text-atk-dark transition">🐦</a>
            <a href="#" class="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-atk-neon hover:text-atk-dark transition">💬</a>
          </div>
        </div>

        <div>
          <h4 class="text-white font-bold uppercase tracking-widest mb-6 text-xs">Navegação</h4>
          <ul class="space-y-3">
            <li><RouterLink to="/" class="hover:text-atk-neon transition">Início</RouterLink></li>
            <li><RouterLink to="/produtos" class="hover:text-atk-neon transition">Catálogo Completo</RouterLink></li>
            <li><RouterLink to="/produtos?liga=brasileirao" class="hover:text-atk-neon transition">Brasileirão</RouterLink></li>
            <li><RouterLink to="/produtos?liga=selecoes" class="hover:text-atk-neon transition">Seleções</RouterLink></li>
          </ul>
        </div>

        <div>
          <h4 class="text-white font-bold uppercase tracking-widest mb-6 text-xs">Suporte</h4>
          <ul class="space-y-3">
            <li><RouterLink to="/politicas" class="hover:text-atk-neon transition">Políticas de Envio</RouterLink></li>
            <li><RouterLink to="/politicas" class="hover:text-atk-neon transition">Trocas e Devoluções</RouterLink></li>
            <li><RouterLink to="/politicas" class="hover:text-atk-neon transition">Rastrear Pedido</RouterLink></li>
          </ul>
        </div>

        <div>
          <h4 class="text-white font-bold uppercase tracking-widest mb-6 text-xs">Atendimento</h4>
          <ul class="space-y-3 mb-6">
            <li class="flex items-center gap-2">
              <span class="text-atk-neon">✉️</span> contato@lgafut.com
            </li>
            <li class="flex items-center gap-2">
              <span class="text-atk-neon">📱</span> (14) 98220-0278
            </li>
            <li class="text-xs">Qualquer horario, estamos a disposição!</li>
          </ul>
          
          <h4 class="text-white font-bold uppercase tracking-widest mb-3 text-xs">Pagamento</h4>
          <div class="flex gap-2 opacity-70">
            <div class="w-8 h-5 bg-white rounded"></div> <div class="w-8 h-5 bg-white rounded"></div> <div class="w-8 h-5 bg-white rounded"></div> </div>
        </div>

      </div>

      <div class="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
        <p>&copy; 2026 LGA FUT. Todos os direitos reservados.</p>
        <p>Desenvolvido por <span class="text-atk-neon"> @Lucas_Oliveira09</span></p>
      </div>

    </div>
  </footer>
</template>