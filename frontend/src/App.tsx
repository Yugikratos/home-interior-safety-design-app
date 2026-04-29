import { useEffect, useState } from 'react';
import { api } from './api';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import type { UserSession } from './types';

const SESSION_KEY = 'home-design-session';

export function App() {
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });
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
      <header className="topbar">
        <div>
          <strong>Home Interior & Safety Design App</strong>
          <span>{session.name}</span>
        </div>
        <button onClick={() => setSession(null)}>Sign out</button>
      </header>
      {view.name === 'dashboard' ? (
        <Dashboard token={session.token} onOpenProject={(id) => setView({ name: 'project', id })} />
      ) : (
        <ProjectDetailPage token={session.token} projectId={view.id} onBack={() => setView({ name: 'dashboard' })} />
      )}
    </div>
  );
}
