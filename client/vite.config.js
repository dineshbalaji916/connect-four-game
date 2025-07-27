import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: REMOVE THE 'esbuild' BLOCK ENTIRELY!
  // It should look exactly like this, no 'esbuild' property.
});