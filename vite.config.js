import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // Import the path module

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: { // Add the resolve configuration
    alias: {
      '@': path.resolve(__dirname, './src'), // Define the '@' alias
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
