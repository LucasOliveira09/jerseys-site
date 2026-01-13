import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  // 1. Estado
  state: () => ({
    // CORREÇÃO: Mudamos de 'items' para 'itens' (com N)
    itens: JSON.parse(localStorage.getItem('carrinho')) || [] 
  }),

  // 2. Getters
  getters: {
    quantidade: (state) => state.itens.length,
    
    total: (state) => {
      // CORREÇÃO: state.itens
      return state.itens.reduce((total, item) => total + Number(item.price_sale), 0)
    }
  },

  // 3. Ações
  actions: {
    adicionarAoCarrinho(produto, tamanho) {
      // CORREÇÃO: this.itens
      this.itens.push({
        ...produto,
        tamanhoEscolhido: tamanho,
        quantidade: 1, // Garante que comece com 1
        cartId: Date.now() 
      })
      this.salvarNoNavegador()
    },

    limparCarrinho() {
      this.itens = []
      this.salvarNoNavegador()
    },

    removerItem(cartId) {
      this.itens = this.itens.filter(i => i.cartId !== cartId)
      this.salvarNoNavegador()
    },

    // Adicionei estas para os botões + e - do carrinho funcionarem
    aumentarQuantidade(cartId) {
      const item = this.itens.find(i => i.cartId === cartId)
      if (item) {
        item.quantidade++
        this.salvarNoNavegador()
      }
    },

    diminuirQuantidade(cartId) {
      const item = this.itens.find(i => i.cartId === cartId)
      if (item && item.quantidade > 1) {
        item.quantidade--
        this.salvarNoNavegador()
      }
    },

    salvarNoNavegador() {
      localStorage.setItem('carrinho', JSON.stringify(this.itens))
    }
  }
})