<script setup>
import ProductCard from './ProductCard.vue'

defineProps({
  title: String,
  items: Array,
  id: String
})
</script>

<template>
  <section :id="id" class="max-w-7xl mx-auto px-4 py-10">
    <h2 class="text-3xl font-extrabold mb-10 text-center uppercase tracking-widest text-white relative text-shadow-neon">
  <span class="inline-block border-b-4 border-atk-neon pb-2">
    {{ title }}
  </span>
</h2>

    <div v-if="!items || items.length === 0" class="text-gray-500">
      Nenhum produto encontrado.
    </div>

    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6"
    >
      <ProductCard
        v-for="produto in items"
        :key="produto.numeric_id"
        :product="produto"
      />
    </div>
  </section>
</template>
