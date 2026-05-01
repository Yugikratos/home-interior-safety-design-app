import type { UserSession } from '../types';

const sections = ['Dashboard', 'Projects', 'Blueprints', 'Design Ideas', 'Safety Check', '2D Layout', 'Reports', 'Settings'];

export function Sidebar({ active, session, onDashboard, onLogout }: {
  active: string;
  session: UserSession;
  onDashboard: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">HD</div>
        <div>
          <strong>HomeDesign Pro</strong>
          <span>Interior planning suite</span>
        </div>
      </div>
      <nav className="side-nav" aria-label="Primary navigation">
        {sections.map((section) => (
          <button
            key={section}
            className={active === section ? 'active' : ''}
            type="button"
            onClick={section === 'Dashboard' || section === 'Projects' ? onDashboard : undefined}
          >
            {section}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="profile-avatar">{session.name.slice(0, 1).toUpperCase()}</div>
        <div>
          <span>{session.name}</span>
          <small>{session.email}</small>
        </div>
        <button type="button" onClick={onLogout}>Logout</button>
      </div>
    </aside>
  );
}
