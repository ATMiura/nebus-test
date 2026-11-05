<template>
  <div v-if="pageCount > 1" class="pagination">
    <Button
      class="pagination__item"
      size="icon"
      :to="getPageLink(currentPage - 1)"
      :disabled="currentPage === 1"
      title="Предыдущая страница"
    >
      ←
    </Button>

    <Button
      v-for="page in pageCount"
      :key="page"
      class="pagination__item"
      size="icon"
      :variant="page === currentPage ? 'primary' : 'secondary'"
      :to="getPageLink(page)"
      :title="`Страница ${page}`"
    >
      {{ page }}
    </Button>

    <Button
      class="pagination__item"
      size="icon"
      :to="getPageLink(currentPage + 1)"
      :disabled="currentPage === pageCount"
      title="Следующая страница"
    >
      →
    </Button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentPage: number;
  pageCount: number;
}>();

const route = useRoute();

function getPageLink(page: number) {
  return {
    path: route.path,
    query: { ...route.query, page: page === 1 ? undefined : String(page) },
    hash: route.hash,
  };
}
</script>

<style scoped lang="scss">
.pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;

  &__item {
    width: auto;
    min-width: 44px;
    border-radius: 12px;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;

    &:hover:not(:disabled) {
      @media (hover: hover) {
        border-color: var(--color-primary);
        box-shadow: 0 3px 10px rgb(32 38 49 / 10%);
      }
    }
  }
}
</style>
