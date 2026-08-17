import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, ChevronRight, CircleUserRound, Menu, Moon, Sun, X, Zap } from 'lucide-react';
import { fetchCricketMatches } from './services/cricketApi';
import { fetchFootballMatches } from './services/footballApi';
import './styles.css';
import './live-score.css';

const matches = [
  { id: 1, state: 'live', competition: '1st T20I · Melbourne', teams: [{ code: 'IND', name: 'India', score: '186/4', overs: '18.2' }, { code: 'AUS', name: 'Australia', score: '223/8', overs: '20' }], note: 'India need 38 runs in 10 balls', colors: ['#ff9933', '#0a4e91'] },
  { id: 2, state: 'live', competition: '2nd ODI · London', teams: [{ code: 'ENG', name: 'England', score: '142/3', overs: '24.1' }, { code: 'SA', name: 'South Africa', score: '—', overs: '' }], note: 'England chose to bat', colors: ['#1f76bc', '#178450'] },
  { id: 3, state: 'upcoming', competition: 'Asia Cup · Dubai', teams: [{ code: 'PAK', name: 'Pakistan', score: '—', overs: '' }, { code: 'NZ', name: 'New Zealand', score: '—', overs: '' }], note: 'Today · 7:30 PM', colors: ['#0c8059', '#111111'] },
  { id: 4, state: 'completed', competition: 'County Championship', teams: [{ code: 'SUR', name: 'Surrey', score: '298 & 174/6', overs: '' }, { code: 'ESS', name: 'Essex', score: '301', overs: '' }], note: 'Stumps · Day 3', colors: ['#dd1739', '#244294'] }
];

const series = ['India tour of Australia', 'The Hundred 2026', 'Asia Cup 2026', 'Caribbean Premier League'];
const LIVE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function TeamBadge({ code, color }) { return <span className="team-badge" style={{ background: color }}>{code.slice(0, 1)}</span>; }

function MatchCard({ match, onOpen }) {
  return <button className="match-card" onClick={() => onOpen(match)}>
    <div className="card-meta"><span className={match.state === 'live' ? 'live-label' : 'normal-label'}>{match.state === 'live' ? <><i /> LIVE</> : match.state.toUpperCase()}</span><span>{match.competition}</span></div>
    {match.teams.map((team, index) => <div className="team-row" key={team.code}><span className="team-ident"><TeamBadge code={team.code} color={match.colors[index]} /><b>{team.code}</b><span>{team.name}</span></span><strong>{team.score}</strong>{team.overs && <em>{team.overs} ov</em>}</div>)}
    <div className="match-note">{match.note}<ChevronRight size={16} /></div>
  </button>;
}

function FeatureMatch({ match, onOpen, onSave }) {
  if (!match) return null;
  return <article className="feature-match">
    <div className="feature-top"><div><span className={match.state === 'live' ? 'live-label' : 'normal-label'}>{match.state === 'live' && <i />} {match.state.toUpperCase()}</span><span className="competition">{match.competition}</span></div><button className="icon-button" onClick={onSave}><Zap size={18} /></button></div>
    <div className="feature-teams">{match.teams.map((team, index) => <React.Fragment key={team.code}>{index === 1 && <div className="versus">vs</div>}<div className="feature-team"><TeamBadge code={team.code} color={match.colors[index]} /><span>{team.name.toUpperCase()}</span><strong>{team.score}</strong><small>{team.overs ? `${team.overs} overs` : 'Awaiting score'}</small></div></React.Fragment>)}</div>
    <div className="match-status"><span>{match.note}</span><span>{match.state === 'live' ? 'AUTO-REFRESH ON' : 'LATEST RESULT'}</span></div>
    <div className="ball-strip"><span>{match.state === 'live' ? 'UPDATES EVERY 5 MIN' : 'MATCH DETAILS'}</span><button onClick={() => onOpen(match)}>Full scorecard <ChevronRight size={15} /></button></div>
  </article>;
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return <><SportPreference /><button className="theme-toggle" onClick={onToggle} aria-label={`Switch to ${isDark ? 'bright' : 'dark'} mode`} title={`Switch to ${isDark ? 'bright' : 'dark'} mode`}><Sun size={16} /><span className={isDark ? 'toggle-knob dark' : 'toggle-knob'}>{isDark ? <Moon size={13} /> : <Sun size={13} />}</span><Moon size={16} /></button></>;
}

function SportPreference() {
  const [selectedSport, setSelectedSport] = useState(() => localStorage.getItem('crixace-sport') || 'cricket');
  const changeSport = nextSport => {
    setSelectedSport(nextSport);
    localStorage.setItem('crixace-sport', nextSport);
    window.dispatchEvent(new CustomEvent('crixace-sport-change', { detail: nextSport }));
  };
  return <div className="sports-switch" role="group" aria-label="Sport preference">{['cricket', 'football'].map(item => <button key={item} className={selectedSport === item ? 'active' : ''} onClick={() => changeSport(item)}>{item === 'cricket' ? 'Cricket' : 'Football'}</button>)}</div>;
}

function LoadingOverlay() {
  return <div className="loading-overlay" role="status" aria-live="polite"><div className="loader"><div className="loader-balls" aria-hidden="true"><span>🏏</span><span>⚽</span><span>🏀</span><span>🎾</span></div><b>Loading the action</b><small>Getting the latest from the field</small></div></div>;
}

function Login({ onLogin, theme, onToggleTheme }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = event => { event.preventDefault(); if (email && password) onLogin(email.split('@')[0]); };
  return <main className="login-page"><section className="login-aside"><div className="brand"><span className="brand-mark">C</span><span>CrixAce</span></div><div className="login-copy"><span className="overline">THE GAME, LIVE</span><h1>Cricket, at the speed of the game.</h1><p>Every ball. Every moment. Your personalised home for live cricket.</p></div><div className="score-sneak"><div><span className="mini-live"><i /> LIVE</span><b>IND <em>186/4</em></b><small>18.2 ov · need 38 off 10</small></div><span className="mini-badge">I</span></div></section><section className="login-panel"><div className="login-theme"><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div><div className="mobile-brand"><span className="brand-mark">C</span> CrixAce</div><div className="login-form-wrap"><p className="overline">WELCOME BACK</p><h2>{mode === 'login' ? 'Sign in to CrixAce' : 'Create your account'}</h2><p className="form-intro">{mode === 'login' ? 'Pick up right where the action is.' : 'Your personalised cricket home awaits.'}</p><form onSubmit={submit}><label>Email address<input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>Password<input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required /></label>{mode === 'login' && <button type="button" className="text-button">Forgot password?</button>}<button className="primary-button" type="submit">{mode === 'login' ? 'Sign in' : 'Create account'} <ChevronRight size={18} /></button></form><p className="switcher">{mode === 'login' ? 'New to CrixAce?' : 'Already have an account?'} <button onClick={() => setMode(mode === 'login' ? 'create' : 'login')}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p><button className="demo-button" onClick={() => onLogin('Cricket fan')}>Continue with demo</button></div></section></main>;
}

function DetailPanel({ match, onClose }) { if (!match) return null; return <aside className="detail-panel"><button className="icon-button close" onClick={onClose}><X size={20} /></button><span className={match.state === 'live' ? 'live-label' : 'normal-label'}>{match.state.toUpperCase()}</span><h3>{match.teams[0].name} vs {match.teams[1].name}</h3><p>{match.competition}</p><div className="detail-score"><div><b>{match.teams[0].code}</b><strong>{match.teams[0].score}</strong><span>{match.teams[0].overs && `${match.teams[0].overs} overs`}</span></div><div className="v-line" /><div><b>{match.teams[1].code}</b><strong>{match.teams[1].score}</strong><span>{match.teams[1].overs && `${match.teams[1].overs} overs`}</span></div></div><p className="detail-note">{match.note}</p><div className="tabs"><button className="active">Scorecard</button><button>Commentary</button><button>Info</button></div><div className="batting scorecard-status"><p>LIVE SCORECARD</p><div><span>{match.state === 'live' ? 'Automatically refreshing' : 'Latest available result'} <small>{match.state === 'live' ? 'every 5 minutes while this tab is visible' : 'from Cricket Data'}</small></span><b>{match.state === 'live' ? 'LIVE' : 'FINAL'}</b></div><small>Detailed batter and bowler figures require scorecard access from the data provider.</small></div></aside>; }

function App() {
  const [user, setUser] = useState(() => localStorage.getItem('crixace-user') || '');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('crixace-theme') || 'bright');
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState(() => localStorage.getItem('crixace-sport') || 'cricket');
  const [scoreMatches, setScoreMatches] = useState(matches);
  const [footballMatches, setFootballMatches] = useState([]);
  const [apiConnected, setApiConnected] = useState(false);
  const activeMatches = sport === 'football' ? footballMatches : scoreMatches;
  const visible = useMemo(() => filter === 'All' ? activeMatches : activeMatches.filter(match => match.state === filter.toLowerCase()), [filter, activeMatches]);
  const liveMatchCount = useMemo(() => activeMatches.reduce((count, match) => count + (match.state === 'live' ? 1 : 0), 0), [activeMatches]);
  const featuredMatch = useMemo(() => activeMatches.find(match => match.state === 'live') || activeMatches[0] || matches[0], [activeMatches]);
  const hasLiveCricketMatches = scoreMatches.some(match => match.state === 'live');
  const refreshCricketMatches = useCallback(async () => {
    try {
      const remoteMatches = await fetchCricketMatches();
      if (!remoteMatches.length) return;
      setScoreMatches(remoteMatches);
      setSelected(currentMatch => currentMatch ? remoteMatches.find(match => match.id === currentMatch.id) || currentMatch : currentMatch);
      setApiConnected(true);
    } catch {
      setApiConnected(false);
    }
  }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 2200); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('crixace-theme', theme); }, [theme]);
  useEffect(() => { const timer = setTimeout(() => setLoading(false), 800); return () => clearTimeout(timer); }, []);
  useEffect(() => { refreshCricketMatches(); }, [refreshCricketMatches]);
  useEffect(() => {
    if (!hasLiveCricketMatches) return undefined;
    let refreshTimer;
    const startPolling = () => {
      window.clearInterval(refreshTimer);
      if (document.visibilityState === 'visible') refreshTimer = window.setInterval(refreshCricketMatches, LIVE_REFRESH_INTERVAL_MS);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshCricketMatches();
      startPolling();
    };
    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasLiveCricketMatches, refreshCricketMatches]);
  useEffect(() => {
    localStorage.setItem('crixace-sport', sport);
    if (sport !== 'football' || footballMatches.length) return;
    fetchFootballMatches().then(remoteMatches => setFootballMatches(remoteMatches)).catch(() => setFootballMatches([]));
  }, [sport, footballMatches.length]);
  useEffect(() => {
    const syncSport = event => { setSport(event.detail); setFilter('All'); };
    window.addEventListener('crixace-sport-change', syncSport);
    return () => window.removeEventListener('crixace-sport-change', syncSport);
  }, []);
  const toggleTheme = () => setTheme(currentTheme => currentTheme === 'dark' ? 'bright' : 'dark');
  const loadThen = action => { setLoading(true); setTimeout(() => { action(); setLoading(false); }, 450); };
  const openMatch = match => loadThen(() => setSelected(match));
  if (!user) return <Login onLogin={name => { localStorage.setItem('crixace-user', name); setUser(name); }} theme={theme} onToggleTheme={toggleTheme} />;
  return <div className="app">
    <header><div className="header-inner"><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}><Menu size={22} /></button><div className="brand"><span className="brand-mark">C</span><span>CrixAce</span></div><nav className={menuOpen ? 'open' : ''}>{['Live scores', 'Fixtures', 'Series', 'News'].map((item, index) => <button className={index === 0 ? 'selected' : ''} key={item} onClick={() => loadThen(() => { setToast(`${item} selected`); setMenuOpen(false); })}>{item}</button>)}</nav><div className="header-actions"><ThemeToggle theme={theme} onToggle={toggleTheme} /><button className="icon-button" onClick={() => setToast('No new notifications')}><Bell size={19} /></button><button className="profile" onClick={() => { localStorage.removeItem('crixace-user'); setUser(''); }}><CircleUserRound size={22} /><span>{user}</span></button></div></div></header>
    <main className="dashboard">
      <section className="hero-row"><div><span className="section-kicker"><i /> LIVE NOW</span><h1>Live cricket scores</h1><p>Follow every ball from the matches that matter.</p></div><button className="watch-button" onClick={() => setToast('Match alerts enabled')}><Bell size={17} /> Enable match alerts</button></section>
      <div className="filters">{['All', 'Live', 'Upcoming', 'Completed'].map(item => <button key={item} className={filter === item ? 'active' : ''} onClick={() => loadThen(() => setFilter(item))}>{item}{item === 'Live' && <span>{liveMatchCount}</span>}</button>)}</div>
      <div className="content-grid">
        <section className="scores">
          <FeatureMatch match={featuredMatch} onOpen={openMatch} onSave={() => setToast('Match saved to favourites')} />
          <div className="section-title"><h2>Matches</h2><button onClick={() => loadThen(() => setFilter('All'))}>View all <ChevronRight size={15} /></button></div>
          <div className="match-list">{visible.map(match => <MatchCard key={match.id} match={match} onOpen={openMatch} />)}</div>
        </section>
        <aside className="sidebar"><section className="series-list"><div className="sidebar-heading"><h2>Trending series</h2><button onClick={() => loadThen(() => setToast('All series opened'))}><ChevronRight size={18} /></button></div>{series.map((item, index) => <button key={item} onClick={() => loadThen(() => setToast(`${item} selected`))}><span className={'series-icon s' + index}>{index === 0 ? 'IND' : index === 1 ? '100' : index === 2 ? 'AC' : 'CPL'}</span><span><b>{item}</b><small>{[5, 14, 12, 23][index]} matches</small></span><ChevronRight size={16} /></button>)}</section><section className="fantasy"><span>CRIXACE PLAY</span><h3>Build your dream XI.</h3><p>Pick your squad and follow every point live.</p><button onClick={() => loadThen(() => setToast('Fantasy lobby coming soon'))}>Play fantasy <ChevronRight size={15} /></button><div className="fantasy-ball">6</div></section></aside>
      </div>
    </main>
    {selected && <div className="drawer-backdrop" onClick={() => setSelected(null)}><div onClick={event => event.stopPropagation()}><DetailPanel match={selected} onClose={() => setSelected(null)} /></div></div>}
    {loading && <LoadingOverlay />}{toast && <div className="toast">{toast}</div>}
    <footer><span>© 2026 CrixAce</span><span>{apiConnected ? 'Scores powered by Cricket Data.' : 'Live scores are illustrative.'}</span></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
