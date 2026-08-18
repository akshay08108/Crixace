import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const sportmonksBase = new URL(env.SPORTMONKS_BASE_URL || 'https://cricket.sportmonks.com/api/v2.0');
  const dateOnly = date => date.toISOString().slice(0, 10);
  const fixtureParams = () => {
    const from = new Date();
    const until = new Date(from);
    until.setUTCDate(until.getUTCDate() + 180);
    return {
      'filter[starts_between]': `${dateOnly(from)},${dateOnly(until)}`,
      include: 'localteam,visitorteam,balls,runs,bowling.bowler,batting.batsman,scoreboards,tosswon,venue,league',
      sort: 'starting_at',
      per_page: '100'
    };
  };
  const sportmonksProxy = routeBuilder => ({
    target: sportmonksBase.origin,
    changeOrigin: true,
    secure: true,
    rewrite: path => {
      const localUrl = new URL(path, 'http://localhost');
      const { route, params = {} } = routeBuilder(localUrl);
      const query = new URLSearchParams(params);
      return `${sportmonksBase.pathname.replace(/\/$/, '')}${route}${query.size ? `?${query}` : ''}`;
    },
    configure: proxy => proxy.on('proxyReq', proxyRequest => {
      if (!env.SPORTMONKS_API_TOKEN) return;
      const targetUrl = new URL(proxyRequest.path, sportmonksBase.origin);
      targetUrl.searchParams.set('api_token', env.SPORTMONKS_API_TOKEN);
      proxyRequest.path = `${targetUrl.pathname}${targetUrl.search}`;
      proxyRequest.setHeader('accept', 'application/json');
    })
  });
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/scorecard': sportmonksProxy(url => ({ route: `/fixtures/${encodeURIComponent(url.searchParams.get('id') || '')}`, params: { include: 'localteam,visitorteam,runs,batting.batsman,bowling.bowler,venue,league' } })),
        '/api/fixtures': sportmonksProxy(() => ({ route: '/fixtures', params: fixtureParams() })),
        '/api/series': sportmonksProxy(() => ({ route: '/leagues', params: { include: 'seasons' } })),
        '/api/teams': sportmonksProxy(() => ({ route: '/teams', params: { per_page: '100' } })),
        '/api/players': sportmonksProxy(url => ({ route: '/players', params: { 'filter[team_id]': url.searchParams.get('teamid') || url.searchParams.get('team_id') || '', per_page: '100' } })),
        '/api/team-logo': sportmonksProxy(url => ({ route: `/teams/${encodeURIComponent(url.searchParams.get('teamid') || url.searchParams.get('team_id') || '')}` })),
        '/api/cricket': sportmonksProxy(() => ({ route: '/livescores', params: { include: 'localteam,visitorteam,balls,runs,bowling.bowler,batting.batsman,scoreboards,venue,league' } })),
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
