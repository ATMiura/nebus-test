export default defineNuxtConfig({
  ssr: false,

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  modules: ['@pinia/nuxt'],

  css: ['~/assets/scss/main.scss'],

  typescript: {
    strict: true,
    typeCheck: true,
  },
})
