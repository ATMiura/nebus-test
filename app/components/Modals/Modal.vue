<template>
  <Teleport to="body">
    <div v-if="open" class="modal">
      <div ref="element" class="modal__content" tabindex="-1">
        <div class="modal__header">
          <div class="modal__title">{{ title }}</div>
          <Button
            class="modal__close"
            variant="danger"
            size="icon-small"
            title="Закрыть"
            @click="close"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path
                d="m6 6 8 8M14 6l-8 8"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </Button>
        </div>

        <div class="modal__body">
          <slot />
        </div>

        <div v-if="$slots.actions" class="modal__actions">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()

const open = defineModel<boolean>({ default: false })
const element = useTemplateRef<HTMLDivElement>('element')
let active = false
let previousFocusedElement: HTMLElement | null = null
let previousBodyOverflow = ''
let appElement: HTMLElement | null = null
let previousAppInert = false

function getFocusableElements() {
  const controls = element.value?.querySelectorAll<HTMLElement>(
    'a[href], button, input, select, textarea, [tabindex]',
  )

  return Array.from(controls ?? []).filter((control) => {
    return (
      control.tabIndex >= 0 &&
      !control.matches(':disabled') &&
      !control.closest('[inert]') &&
      control.getClientRects().length > 0 &&
      getComputedStyle(control).visibility !== 'hidden'
    )
  })
}

function focusInitialElement() {
  const controls = getFocusableElements()
  const target = controls.find((control) => control.hasAttribute('autofocus'))
  const firstControl = target ?? controls[0] ?? element.value
  firstControl?.focus({ preventScroll: true })
}

function close() {
  open.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    close()
    return
  }

  if (event.key !== 'Tab') {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  const controls = getFocusableElements()
  if (!controls.length) {
    element.value?.focus({ preventScroll: true })
    return
  }

  const currentIndex = controls.findIndex((control) => control === document.activeElement)
  let nextIndex = 0
  if (event.shiftKey) {
    nextIndex = currentIndex <= 0 ? controls.length - 1 : currentIndex - 1
  } else {
    nextIndex = currentIndex === controls.length - 1 ? 0 : currentIndex + 1
  }
  controls[nextIndex]?.focus({ preventScroll: true })
}

function handleFocusIn(event: FocusEvent) {
  if (event.target instanceof Node && !element.value?.contains(event.target)) {
    focusInitialElement()
  }
}

function activate() {
  if (active) {
    return
  }

  active = true
  previousFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  appElement = document.getElementById('__nuxt')
  previousAppInert = appElement?.inert ?? false
  if (appElement) {
    appElement.inert = true
  }

  document.addEventListener('keydown', handleKeydown, true)
  document.addEventListener('focusin', handleFocusIn)
}

function deactivate() {
  if (!active) {
    return
  }

  active = false
  document.removeEventListener('keydown', handleKeydown, true)
  document.removeEventListener('focusin', handleFocusIn)
  document.body.style.overflow = previousBodyOverflow
  if (appElement) {
    appElement.inert = previousAppInert
    appElement = null
  }

  if (previousFocusedElement?.isConnected && !previousFocusedElement.closest('[inert]')) {
    previousFocusedElement.focus({ preventScroll: true })
  }
  previousFocusedElement = null
}

async function syncOpen() {
  if (open.value) {
    activate()
    await nextTick()
    if (open.value) {
      focusInitialElement()
    }
  } else {
    deactivate()
  }
}

watch(open, syncOpen)
onBeforeMount(() => {
  if (open.value) {
    activate()
  }
})
onMounted(syncOpen)
onBeforeUnmount(deactivate)
</script>

<style scoped lang="scss">
.modal {
  position: fixed;
  z-index: 1000;
  inset: 0;
  min-width: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgb(20 26 38 / 55%);

  &__content {
    display: grid;
    gap: 24px;
    width: 100%;
    max-width: 560px;
    max-height: calc(100vh - 32px);
    max-height: calc(100dvh - 32px);
    padding: 24px;
    overflow: auto;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-surface);
    color: var(--color-text);
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  &__title {
    min-width: 0;
    font-size: 22px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  &__close {
    flex-shrink: 0;
  }

  &__body {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 12px;
  }
}

@media (max-width: 600px) {
  .modal {
    &__content {
      gap: 20px;
      padding: 16px;
    }

    &__actions {
      flex-direction: column;
    }
  }
}
</style>
