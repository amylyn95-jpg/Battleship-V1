import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages serves this project from https://<user>.github.io/Battleship-V1/,
// so assets must be requested from that subpath rather than the domain root.
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/Battleship-V1/' : '/',
  plugins: [react()],
});
