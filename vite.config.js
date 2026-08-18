import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/scorecard': {
          target: env.CRICKETDATA_BASE_URL || 'https://api.cricapi.com/v1',
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/api\/scorecard/, '/match_scorecard'),
          configure: proxy => proxy.on('proxyReq', proxyRequest => {
            if (!env.CRICKETDATA_API_KEY) return;
            const targetUrl = new URL(proxyRequest.path, env.CRICKETDATA_BASE_URL || 'https://api.cricapi.com/v1');
            targetUrl.searchParams.set('apikey', env.CRICKETDATA_API_KEY);
            proxyRequest.path = `${targetUrl.pathname}${targetUrl.search}`;
          })
        },
        '/api/cricket': {
          target: env.CRICKETDATA_BASE_URL || 'https://api.cricapi.com/v1',
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/api\/cricket/, '/currentMatches'),
          configure: proxy => proxy.on('proxyReq', proxyRequest => {
            if (!env.CRICKETDATA_API_KEY) return;
            const targetUrl = new URL(proxyRequest.path, env.CRICKETDATA_BASE_URL || 'https://api.cricapi.com/v1');
            targetUrl.searchParams.set('apikey', env.CRICKETDATA_API_KEY);
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
