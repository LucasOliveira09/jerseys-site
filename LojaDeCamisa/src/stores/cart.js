// Arquivo: src/stores/cart.js
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  // 1. Estado: Onde guardamos os dados
  state: () => ({
    items: JSON.parse(localStorage.getItem('carrinho')) || [] // Tenta pegar do localStorage ou inicia vazio
  }),

  // 2. Getters: Cálculos automáticos (Total, Quantidade)
  getters: {
    quantidade: (state) => state.items.length,
    
    total: (state) => {
      // Soma o preço de todos os itens
      return state.items.reduce((total, item) => total + Number(item.price_sale), 0)
    }
  },

  // 3. Ações: Funções para mexer no carrinho
  actions: {
    adicionarAoCarrinho(produto, tamanho) {
      this.items.push({
        ...produto,
        tamanhoEscolhido: tamanho,
        cartId: Date.now() // Cria um ID único para o item no carrinho
      })
      this.salvarNoNavegador()
    },

    removerDoCarrinho(cartId) {
      this.items = this.items.filter(item => item.cartId !== cartId)
      this.salvarNoNavegador()
    },

    limparCarrinho() {
      this.items = []
      this.salvarNoNavegador()
    },

    // Função auxiliar para não perder o carrinho ao atualizar a página
    salvarNoNavegador() {
      localStorage.setItem('carrinho', JSON.stringify(this.items))
    }
  }
})