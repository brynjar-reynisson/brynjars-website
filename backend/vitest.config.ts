import { defineConfig, defaultExclude } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: [...defaultExclude, 'dist/**'],
  },
})
