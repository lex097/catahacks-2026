import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const llmTarget = env.LLM_PROXY_TARGET || 'http://127.0.0.1:11434';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/v1': {
          target: llmTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      proxy: {
        '/v1': {
          target: llmTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
