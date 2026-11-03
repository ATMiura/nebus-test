<template>
  <div class="app-header">
    <Container class="app-header__content">
      <div class="app-header__identity">
        <NuxtLink class="app-header__brand" to="/">Nebus Notes</NuxtLink>
        <div class="app-header__description">Задачи и планы в одном месте</div>
      </div>

      <Button class="app-header__create" variant="primary" to="/notes/new" title="Создать заметку">
        <span class="app-header__create-icon">+</span>
        <span class="app-header__create-text">Создать заметку</span>
      </Button>
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

  &__create-icon {
    font-size: 24px;
    line-height: 1;
  }

  &__create-text {
    display: none;
  }

  &__description {
    margin: 8px 0 0;
    color: var(--color-muted);
  }
}

.app-header .app-header__create {
  flex-shrink: 0;
  width: 44px;
  padding: 0;
  white-space: nowrap;
}

@media (min-width: 601px) {
  .app-header .app-header__create {
    width: auto;
    padding: 10px 20px;
  }

  .app-header__create-icon {
    display: none;
  }

  .app-header__create-text {
    display: inline;
  }
}

@media (max-width: 600px) {
  .app-header {
    padding-block: 20px;

    &__content {
      gap: 16px;
    }
  }
}
</style>
