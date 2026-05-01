import { useEffect, useState } from 'react';
import { api } from './api';
import { AuthPage } from './pages/AuthPage';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
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
  const [projectMeta, setProjectMeta] = useState<{ name: string; rooms: number; ready: boolean } | null>(null);

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
      <Sidebar
        active={view.name === 'dashboard' ? 'Dashboard' : 'Blueprints'}
        session={session}
        onDashboard={() => {
          setView({ name: 'dashboard' });
          setProjectMeta(null);
        }}
        onLogout={() => setSession(null)}
      />
      <div className="content-shell">
        <TopHeader
          breadcrumb={view.name === 'project' && projectMeta ? `Projects > ${projectMeta.name}` : 'Projects'}
          title={view.name === 'project' && projectMeta ? projectMeta.name : 'Project Dashboard'}
          status={view.name === 'project' && projectMeta?.ready ? 'Active' : 'Draft'}
          roomsCount={view.name === 'project' ? projectMeta?.rooms ?? 0 : 0}
          onExport={() => window.print()}
          onPrint={() => window.print()}
          onGenerate={() => window.dispatchEvent(new Event('home-design-generate'))}
        />
        {view.name === 'dashboard' ? (
          <Dashboard token={session.token} onOpenProject={(id) => setView({ name: 'project', id })} />
        ) : (
          <ProjectDetailPage
            token={session.token}
            projectId={view.id}
            onBack={() => {
              setView({ name: 'dashboard' });
              setProjectMeta(null);
            }}
            onProjectMeta={setProjectMeta}
          />
        )}
      </div>
    </div>
  );
}
