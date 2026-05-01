import { useEffect, useState } from 'react';
import { api } from './api';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import type { UserSession } from './types';

const SESSION_KEY = 'home-design-session';

function readSavedSession() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return null;

  try {
    const session = JSON.parse(saved) as UserSession;
    return session.token ? session : null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function App() {
  const [session, setSession] = useState<UserSession | null>(readSavedSession);
  const [view, setView] = useState<{ name: 'dashboard' } | { name: 'project'; id: number }>({ name: 'dashboard' });

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  useEffect(() => {
    api.setUnauthorizedHandler(() => setSession(null));
    return () => api.setUnauthorizedHandler(null);
  }, []);

  if (!session) {
    return <AuthPage onAuth={setSession} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">H</div>
          <div>
            <strong>HomeSafe</strong>
            <span>Interior planner</span>
          </div>
        </div>
        <nav className="side-nav" aria-label="Primary navigation">
          <button className={view.name === 'dashboard' ? 'active' : ''} onClick={() => setView({ name: 'dashboard' })}>Dashboard</button>
          <button className={view.name === 'project' ? 'active' : ''} onClick={() => setView({ name: 'dashboard' })}>Projects</button>
        </nav>
        <div className="sidebar-footer">
          <span>{session.name}</span>
          <small>{session.email}</small>
          <button onClick={() => setSession(null)}>Logout</button>
        </div>
      </aside>
      <div className="content-shell">
        <header className="topbar">
          <div>
            <span className="eyebrow">Phase 1 MVP</span>
            <strong>Home Interior & Safety Design App</strong>
          </div>
        </header>
        {view.name === 'dashboard' ? (
          <Dashboard token={session.token} onOpenProject={(id) => setView({ name: 'project', id })} />
        ) : (
          <ProjectDetailPage token={session.token} projectId={view.id} onBack={() => setView({ name: 'dashboard' })} />
        )}
      </div>
    </div>
  );
}
