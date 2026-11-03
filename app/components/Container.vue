<template>
  <div class="container">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.container {
  width: 100%;
  max-width: 1168px;
  margin-inline: auto;
  padding-inline: 24px;
}

@media (max-width: 600px) {
  .container {
    padding-inline: 16px;
  }
}
</style>
