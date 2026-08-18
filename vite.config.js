import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rapidHost = env.RAPIDAPI_HOST || 'cricket-api-free-data.p.rapidapi.com';
  const rapidProxy = (route, transformQuery = path => path) => ({
    target: `https://${rapidHost}`,
    changeOrigin: true,
    secure: true,
    rewrite: path => transformQuery(path.replace(/^\/api\/[^?]+/, route)),
    configure: proxy => proxy.on('proxyReq', proxyRequest => {
      if (!env.RAPIDAPI_KEY) return;
      proxyRequest.setHeader('x-rapidapi-key', env.RAPIDAPI_KEY);
      proxyRequest.setHeader('x-rapidapi-host', rapidHost);
      proxyRequest.setHeader('accept', 'application/json');
    })
  });
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/scorecard': rapidProxy('/cricket-match-scoreboard', path => path.replace(/([?&])id=/, '$1matchid=')),
        '/api/fixtures': rapidProxy('/cricket-schedule'),
        '/api/series': rapidProxy('/cricket-series'),
        '/api/teams': rapidProxy('/cricket-teams'),
        '/api/players': rapidProxy('/cricket-players'),
        '/api/team-logo': rapidProxy('/cricket-teamlogo'),
        '/api/cricket': rapidProxy('/cricket-livescores'),
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
