<template>
  <div class="app-shell">
    <AppHeader />
    <NuxtPage />
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: (title) => {
    if (title) {
      return `${title} | Nebus Notes`
    }
    return 'Nebus Notes'
  },
})
</script>

<style scoped lang="scss">
.app-shell {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  min-height: 100dvh;
}
</style>
