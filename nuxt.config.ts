export default defineNuxtConfig({
  ssr: false,

  app: {
    head: {
      meta: [{ name: 'viewport', content: 'width=320, initial-scale=1' }],
    },
  },

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
