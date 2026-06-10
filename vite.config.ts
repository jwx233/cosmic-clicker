import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/cosmic-clicker/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
