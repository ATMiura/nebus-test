<template>
  <div class="app-header">
    <Container class="app-header__content">
      <div class="app-header__identity">
        <NuxtLink class="app-header__brand" to="/">Nebus Notes</NuxtLink>
        <div class="app-header__description">Задачи и планы в одном месте</div>
      </div>

      <Button variant="primary" to="/notes/new"> Создать заметку </Button>
    </Container>
  </div>
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

    &:hover {
      @media (hover: hover) {
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
