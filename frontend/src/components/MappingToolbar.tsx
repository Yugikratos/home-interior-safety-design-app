import type { Blueprint } from '../types';

export function MappingToolbar({ blueprint }: { blueprint?: Blueprint | null }) {
  return (
    <aside className="tools-panel">
      <section>
        <h3>Mapping Tools</h3>
        <div className="tool-grid">
          <button type="button" className="active">Select / Move</button>
          <button type="button">Draw Room</button>
          <button type="button">Adjust Shape</button>
          <button type="button">Delete</button>
        </div>
      </section>
      <section>
        <h3>View Options</h3>
        <label className="toggle-row"><input type="checkbox" defaultChecked /> Show Grid</label>
        <label className="toggle-row"><input type="checkbox" defaultChecked /> Show Labels</label>
        <label className="toggle-row"><input type="checkbox" /> Snap to Walls</label>
      </section>
      <section>
        <h3>Blueprint Info</h3>
        <div className="blueprint-meta">
          <strong>{blueprint?.originalFileName ?? 'No blueprint uploaded'}</strong>
          <span>{blueprint ? `${Math.round(blueprint.sizeBytes / 1024)} KB` : 'Upload PNG, JPG, or PDF'}</span>
        </div>
      </section>
    </aside>
  );
}
