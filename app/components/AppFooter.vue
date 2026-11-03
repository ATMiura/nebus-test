<template>
  <div class="app-footer">
    <Container class="app-footer__content">
      <div class="app-footer__name">Nebus Notes</div>
      <div class="app-footer__description">Заметки и списки задач</div>
    </Container>
  </div>
</template>

<style scoped lang="scss">
.app-footer {
  padding-block: 24px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-muted);
  font-size: 14px;

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__name,
  &__description {
    margin: 0;
  }

  &__name {
    color: var(--color-text);
    font-weight: 600;
  }
}

@media (max-width: 600px) {
  .app-footer__content {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
