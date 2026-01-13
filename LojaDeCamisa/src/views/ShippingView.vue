<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-atk-dark text-white font-sans pb-20">
    
    <div class="bg-[#1a1a1a] border-b border-white/10 pt-12 pb-10 mb-8">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <h1 class="text-3xl md:text-5xl font-extrabold uppercase tracking-tighter mb-4 text-white">
          Políticas da <span class="text-atk-neon">Loja</span>
        </h1>
        <p class="text-gray-400 text-sm md:text-base">
          Envio, Prazos, Trocas e Devoluções. Leia com atenção.
        </p>
        
        <div class="mt-6 text-xs text-gray-500 uppercase tracking-widest">
          <RouterLink to="/" class="hover:text-white transition">Home</RouterLink> / 
          <span class="text-atk-neon font-bold">Políticas</span>
        </div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-6 space-y-12">

      <section class="bg-[#151515] p-8 rounded-xl border border-white/5 shadow-lg">
        <div class="flex items-center gap-4 mb-6">
          <div class="bg-atk-neon/10 p-3 rounded-lg text-atk-neon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
          </div>
          <h2 class="text-2xl font-bold uppercase tracking-wide">Prazo de Entrega e Atrasos</h2>
        </div>

        <div class="space-y-4 text-gray-300 leading-relaxed text-sm md:text-base">
          <p>
            <strong class="text-white">Prazo Médio:</strong> O prazo estimado de entrega é de <span class="text-atk-neon font-bold">25 a 35 dias úteis</span>, podendo variar conforme a localidade e os procedimentos de importação.
          </p>
          <p>
            Em alguns casos, o Correios ou outras transportadoras parceiras podem enfrentar atrasos devido a fatores externos (fiscalização alfandegária, greves, alta demanda ou clima).
          </p>
          <p class="text-xs bg-white/5 p-3 rounded border-l-2 border-atk-neon">
            De acordo com o Código de Defesa do Consumidor e normas de importação, o prazo máximo para entrega pode se estender até <strong>90 dias corridos</strong>.
          </p>
          
          <div class="bg-red-500/10 border border-red-500/20 p-4 rounded-lg mt-4">
            <h3 class="text-red-500 font-bold uppercase text-xs mb-2">Política de Não Cancelamento</h3>
            <p class="text-red-400 text-xs">
              Não realizamos cancelamentos, estornos ou reembolsos durante o processo de envio, mesmo em casos de atraso. O cliente deve aguardar a entrega ou a confirmação de uma perda definitiva.
            </p>
          </div>
        </div>
      </section>

      <section class="bg-[#151515] p-8 rounded-xl border border-white/5 shadow-lg">
        <div class="flex items-center gap-4 mb-6">
          <div class="bg-blue-500/10 p-3 rounded-lg text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
          </div>
          <h2 class="text-2xl font-bold uppercase tracking-wide">Trocas e Devoluções</h2>
        </div>

        <div class="space-y-4 text-gray-300 leading-relaxed text-sm md:text-base">
          <p>
            Como nossos pedidos são enviados diretamente da fábrica, <strong class="text-white">não é possível realizar trocas ou devoluções por tamanho, cor ou preferência pessoal</strong> após o envio.
          </p>
          <p>Trocas serão aceitas somente em casos de <strong>defeito de fabricação</strong>:</p>
          
          <ul class="list-disc pl-5 space-y-2 text-gray-400 text-sm">
            <li>A solicitação deve ser feita em até <strong class="text-white">7 dias corridos</strong> após o recebimento.</li>
            <li>O produto deve estar sem sinais de uso, com etiquetas e embalagem original.</li>
            <li>Caso não haja estoque para troca, faremos o reembolso integral.</li>
          </ul>

          <div class="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex items-start gap-3 mt-4">
            <span class="text-2xl">⚠️</span>
            <div>
              <h3 class="text-yellow-500 font-bold uppercase text-xs mb-1">Atenção: Personalizados</h3>
              <p class="text-yellow-200/70 text-xs">
                Produtos personalizados (com Nome e Número) <strong>não possuem direito a troca, devolução ou reembolso</strong>, exceto em caso de erro nosso na personalização.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-[#151515] p-8 rounded-xl border border-white/5 shadow-lg">
        <div class="flex items-center gap-4 mb-6">
          <div class="bg-green-500/10 p-3 rounded-lg text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
          </div>
          <h2 class="text-2xl font-bold uppercase tracking-wide">Reembolsos e Extravios</h2>
        </div>

        <div class="space-y-6 text-gray-300 leading-relaxed text-sm md:text-base">
          
          <div>
            <h3 class="font-bold text-white mb-2">📦 Perda ou Apreensão Alfandegária</h3>
            <p>
              Em casos de <strong>perda total comprovada</strong> pela transportadora ou apreensão definitiva na alfândega brasileira, o cliente será compensado com um <span class="bg-atk-neon text-atk-dark font-bold px-1 rounded">CUPOM DE 100%</span> do valor dos produtos.
            </p>
            <p class="text-xs mt-2 text-gray-500">*O valor do frete pago no envio não é incluso no cupom de compensação.</p>
          </div>

          <div class="border-t border-white/10 pt-6">
            <h3 class="font-bold text-red-400 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              Casos Não Reembolsáveis (Erro do Cliente)
            </h3>
            <p class="mb-3">
              O cliente é integralmente responsável pelas informações de entrega. Não haverá reembolso nos seguintes casos:
            </p>
            <ul class="grid gap-3">
              <li class="bg-red-500/5 p-3 rounded border border-red-500/10">
                <strong class="block text-white text-xs uppercase mb-1">Endereço Incorreto</strong>
                Endereço incompleto, número errado ou destinatário desconhecido no local.
              </li>
              <li class="bg-red-500/5 p-3 rounded border border-red-500/10">
                <strong class="block text-white text-xs uppercase mb-1">Dados Fiscais Inválidos</strong>
                Apreensão na alfândega por CPF incorreto, nome incompleto ou divergência de dados do titular.
              </li>
              <li class="bg-red-500/5 p-3 rounded border border-red-500/10">
                <strong class="block text-white text-xs uppercase mb-1">Ausência na Entrega</strong>
                Após 3 tentativas de entrega sem sucesso, o pacote é devolvido e descartado pela logística, sem retorno ao remetente.
              </li>
            </ul>
          </div>

        </div>
      </section>

      <div class="text-center pt-8">
        <RouterLink to="/" class="text-atk-neon font-bold uppercase tracking-widest hover:text-white transition border-b border-atk-neon pb-1">
          Voltar para a Loja
        </RouterLink>
      </div>

    </div>
  </div>
</template>