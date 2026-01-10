// Arquivo: nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  // 1. Módulos que instalamos
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    'nuxt-icon'
  ],

  // 2. Configuração do Supabase
  supabase: {
    // Desativar o redirecionamento automático para login.
    // Como é uma loja, a Home e Produtos devem ser públicas.
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/', '/produto/*'] // Páginas públicas explícitas
    }
  },

  // 3. Otimizações de CSS
  tailwindcss: {
    cssPath: ['~/assets/css/tailwind.css', { injectPosition: "first" }],
    configPath: 'tailwind.config',
    viewer: true,
  }
});