<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="bg-[#151515] border-t border-white/10 pt-16 pb-8 text-sm font-sans text-gray-400">
    <div class="max-w-7xl mx-auto px-6">
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        
        <div class="space-y-4">
          <RouterLink to="/" class="font-extrabold text-2xl tracking-tighter text-white flex items-center gap-1">
            <img src="../../public/logo.png" class="w-10 mr-1 " alt=""> LGA<span class="text-atk-neon">SPORTS</span> 
          </RouterLink>
          <p class="leading-relaxed text-xs">
            A LGA SPORTS é uma loja especializada em camisas de time importadas. Qualidade de elite, preço justo e a paixão que nos une. Amamos o esporte e o que fazemos, qualquer duvida estamos de peito a aberto a responde-lá pelo nosso Whatsapp!
          </p>
          <div class="flex gap-4 pt-2">
            <a href="#" class="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-atk-neon hover:text-atk-dark transition">📸</a>
            <a href="#" class="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-atk-neon hover:text-atk-dark transition">🎵</a> 
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
              <span class="text-atk-neon">📱</span>
              <a href="https://wa.me/5514982200278" target="_blank" class="hover:text-atk-neon transition">
                (14) 98220-0278
              </a>
            </li>
            <li class="text-xs text-gray-400">Qualquer horário, estamos à disposição!</li>
          </ul>
          
          <h4 class="text-white font-bold uppercase tracking-widest mb-3 text-xs">Pagamento</h4>
          
          <div class="flex flex-wrap gap-2">
            <div class="bg-white p-1 rounded w-10 h-7 flex items-center justify-center overflow-hidden">
              <img src="https://www.feebpr.org.br/images/media/53504254670e425338182.jpg" alt="Pix" class="w-full h-full object-contain">
            </div>
            <div class="bg-white p-1 rounded w-10 h-7 flex items-center justify-center overflow-hidden">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" class="w-full h-full object-contain">
            </div>
            <div class="bg-white p-1 rounded w-10 h-7 flex items-center justify-center overflow-hidden">
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" class="w-full h-full object-contain">
            </div>
            <div class="bg-white p-1 rounded w-10 h-7 flex items-center justify-center overflow-hidden">
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="Amex" class="w-full h-full object-contain">
            </div>
            <div class="bg-white p-1 rounded w-10 h-7 flex items-center justify-center overflow-hidden">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Elo_logo.png" alt="Elo" class="w-full h-full object-contain">
            </div>
            <div class="bg-white p-1 rounded w-10 h-7 flex items-center justify-center overflow-hidden">
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Hipercard_logo.png" alt="Hipercard" class="w-full h-full object-contain">
            </div>
          </div>

          <h4 class="text-white font-bold uppercase tracking-widest mb-3 text-xs mt-6">Segurança</h4>
          <div class="flex items-center gap-2">
            <div class="bg-white/5 p-2 rounded flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-atk-neon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
              <span class="text-[10px] uppercase text-gray-400 font-bold">Google Seguro</span>
            </div>
            <div class="bg-white/5 p-2 rounded flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-atk-neon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <span class="text-[10px] uppercase text-gray-400 font-bold">SSL Certificado</span>
            </div>
          </div>

        </div>

      </div>

      <div class="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
        <p>&copy; 2026 LGA SPORTS. Todos os direitos reservados.</p>
        <p>Desenvolvido por <span class="text-atk-neon"> @Lucas_Oliveira09</span></p>
      </div>

    </div>
  </footer>
</template>