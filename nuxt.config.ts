export default defineNuxtConfig({
  runtimeConfig: {
    deepseekApiKey: '',
    databaseUrl: ''
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  nitro: {
    externals: {
      inline: [/[\\/]node_modules[\\/]nuxt[\\/]dist[\\/]/]
    }
  }
})
