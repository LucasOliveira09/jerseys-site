<template>
  <div class="container mx-auto px-4 pt-24">
    <h1 class="text-2xl font-bold mb-6">
      {{ leagueName }}
    </h1>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <ProductCard
        v-for="p in filteredProducts"
        :key="p.numeric_id"
        :product="p"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import products from '@/data/products'

const route = useRoute()

const leagueName = computed(() => route.params.league)

const filteredProducts = computed(() => {
  return products.filter(p => {
    const leagueMatch = p.league === route.params.league
    const typeMatch = route.query.tipo
      ? p.category === route.query.tipo
      : true
    return leagueMatch && typeMatch && p.active
  })
})
</script>
