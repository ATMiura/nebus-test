export default defineNuxtConfig({
  ssr: false,

  modules: ['@pinia/nuxt'],

  css: ['~/assets/scss/main.scss'],

  typescript: {
    strict: true,
    typeCheck: true,
  },
})
