import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse backend port from backend/.env if it exists
let backendPort = 5000;
try {
  const backendEnvPath = path.resolve(__dirname, '../backend/.env');
  if (fs.existsSync(backendEnvPath)) {
    const envContent = fs.readFileSync(backendEnvPath, 'utf8');
    const portMatch = envContent.match(/^PORT\s*=\s*(\d+)/m);
    if (portMatch) {
      backendPort = parseInt(portMatch[1], 10);
    }
  }
} catch (e) {
  console.warn('Could not parse backend port from backend/.env, using default 5000:', e.message);
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
});
