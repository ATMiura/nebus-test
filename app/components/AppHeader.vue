<template>
  <header class="app-header">
    <div class="container app-header__content">
      <div class="app-header__identity">
        <NuxtLink class="app-header__brand" to="/">Nebus Notes</NuxtLink>
        <p class="app-header__description">Задачи и планы в одном месте</p>
      </div>

      <button class="button button--primary" type="button">Создать заметку</button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  padding-block: 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  &__identity {
    min-width: 0;
  }

  &__brand {
    color: var(--color-text);
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
    text-decoration: none;

    @media (hover: hover) {
      &:hover {
        color: var(--color-primary);
      }
    }
  }

  &__description {
    margin: 8px 0 0;
    color: var(--color-muted);
  }
}

@media (max-width: 600px) {
  .app-header {
    padding-block: 20px;

    &__content {
      align-items: stretch;
      flex-direction: column;
      gap: 20px;
    }
  }
}
</style>
