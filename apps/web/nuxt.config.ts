import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  modules: ['@nuxtjs/i18n', 'shadcn-nuxt'],
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },
  i18n: {
    defaultLocale: 'zh-CN',
    strategy: 'no_prefix',
    langDir: 'locales',
    detectBrowserLanguage: false,
    locales: [
      {
        code: 'zh-CN',
        language: 'zh-CN',
        name: '简体中文',
        file: 'zh-CN.json',
      },
    ],
  },
})
