export function TopHeader({ breadcrumb, title, status, roomsCount, onExport, onPrint, onGenerate }: {
  breadcrumb: string;
  title: string;
  status: 'Active' | 'Draft';
  roomsCount: number;
  onExport: () => void;
  onPrint: () => void;
  onGenerate: () => void;
}) {
  return (
    <header className="topbar">
      <div className="topbar-main">
        <span className="breadcrumb">{breadcrumb}</span>
        <div className="topbar-title-row">
          <strong>{title}</strong>
          <span className={status === 'Active' ? 'status-badge active' : 'status-badge'}>{status}</span>
          <span className="stat-pill">{roomsCount} rooms</span>
        </div>
      </div>
      <div className="topbar-actions">
        <button type="button" onClick={onExport}>Export</button>
        <button type="button" onClick={onPrint}>Print</button>
        <button type="button" className="primary" onClick={onGenerate}>Generate Design</button>
      </div>
    </header>
  );
}
