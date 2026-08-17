import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/sportmonks': {
          target: 'https://cricket.sportmonks.com',
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/api\/sportmonks/, ''),
          configure: proxy => proxy.on('proxyReq', proxyRequest => {
            if (!env.SPORTSMONK_TOKEN) return;
            const targetUrl = new URL(proxyRequest.path, 'https://cricket.sportmonks.com');
            targetUrl.searchParams.set('api_token', env.SPORTSMONK_TOKEN);
            proxyRequest.path = `${targetUrl.pathname}${targetUrl.search}`;
          })
        },
        '/api/entitysport': {
          target: 'https://restapi.entitysport.com',
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/api\/entitysport/, ''),
          configure: proxy => proxy.on('proxyReq', proxyRequest => {
            if (!env.ENTITYSPORT_TOKEN) return;
            const targetUrl = new URL(proxyRequest.path, 'https://restapi.entitysport.com');
            targetUrl.searchParams.set('token', env.ENTITYSPORT_TOKEN);
            proxyRequest.path = `${targetUrl.pathname}${targetUrl.search}`;
          })
        },
        '/api/football': {
          target: 'https://soccerapi.entitysport.com',
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/api\/football/, ''),
          configure: proxy => proxy.on('proxyReq', proxyRequest => {
            if (!env.FOOTBALLSPORT_TOKEN) return;
            const targetUrl = new URL(proxyRequest.path, 'https://soccerapi.entitysport.com');
            targetUrl.searchParams.set('token', env.FOOTBALLSPORT_TOKEN);
            proxyRequest.path = `${targetUrl.pathname}${targetUrl.search}`;
          })
        }
      }
    }
  };
});
