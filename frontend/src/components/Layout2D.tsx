import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import type { Blueprint, Room } from '../types';

export function Layout2D({ token, projectId, blueprint, rooms }: {
  token: string;
  projectId: number;
  blueprint?: Blueprint | null;
  rooms: Room[];
}) {
  const scale = 18;
  const palette = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#e0e7ff', '#ccfbf1', '#ffedd5'];
  const [blueprintUrl, setBlueprintUrl] = useState('');
  const [blueprintError, setBlueprintError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const isImage = blueprint?.contentType?.startsWith('image/');
  const isPdf = blueprint?.contentType === 'application/pdf';

  useEffect(() => {
    setBlueprintError('');
    setBlueprintUrl('');
    if (!blueprint) {
      return;
    }
    let objectUrl = '';
    api.blueprintFile(token, projectId)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlueprintUrl(objectUrl);
      })
      .catch((err) => setBlueprintError(err instanceof Error ? err.message : 'Could not load blueprint preview'));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [blueprint, isImage, projectId, token]);

  const shapes = useMemo(() => {
    let cursorX = 16;
    let cursorY = 16;
    let rowHeight = 0;
    return rooms.map((room, index) => {
      const width = Math.max(room.width * scale, 80);
      const height = Math.max(room.length * scale, 70);
      if (cursorX + width > 720) {
        cursorX = 16;
        cursorY += rowHeight + 16;
        rowHeight = 0;
      }
      const shape = { room, x: cursorX, y: cursorY, width, height, fill: palette[index % palette.length] };
      cursorX += width + 16;
      rowHeight = Math.max(rowHeight, height);
      return shape;
    });
  }, [rooms]);

  const totalHeight = Math.max(280, shapes.reduce((max, shape) => Math.max(max, shape.y + shape.height + 16), 0));

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart) return;
    setPan({
      x: dragStart.panX + event.clientX - dragStart.x,
      y: dragStart.panY + event.clientY - dragStart.y
    });
  }

  return (
    <section className="panel section-card">
      <div className="section-title">
        <span className="section-icon">2D</span>
        <div>
          <h2>Blueprint + 2D Layout</h2>
          <p>Compare the uploaded plan with room rectangles. Drag the layout canvas to pan.</p>
        </div>
      </div>
      <div className="layout-toolbar">
        <button type="button" onClick={() => setZoom((value) => Math.max(0.6, Number((value - 0.1).toFixed(1))))}>Zoom out</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((value) => Math.min(2, Number((value + 0.1).toFixed(1))))}>Zoom in</button>
        <button type="button" onClick={resetView}>Reset</button>
      </div>
      <div className="blueprint-layout-grid">
        <div className="blueprint-pane">
          <div className="pane-title">Blueprint</div>
          {blueprintUrl && isImage && <img src={blueprintUrl} alt={blueprint?.originalFileName ?? 'Blueprint'} />}
          {blueprintUrl && isPdf && (
            <div className="blueprint-placeholder">
              <strong>{blueprint.originalFileName}</strong>
              <span>PDF uploaded. Open it in a separate tab to compare with the layout.</span>
              <a href={blueprintUrl} target="_blank" rel="noreferrer">Open PDF</a>
            </div>
          )}
          {!blueprint && <div className="blueprint-placeholder">Upload an image blueprint to preview it here.</div>}
          {blueprint && !isImage && !isPdf && <div className="blueprint-placeholder">Preview is not available for this file type.</div>}
          {blueprintError && <p className="error">{blueprintError}</p>}
        </div>
        <div
          className="layout-viewport"
          ref={viewportRef}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragStart({ x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y });
          }}
          onPointerMove={onPointerMove}
          onPointerUp={() => setDragStart(null)}
          onPointerCancel={() => setDragStart(null)}
        >
          {blueprintUrl && <img className="layout-blueprint-underlay" src={blueprintUrl} alt="" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} />}
          <svg
            className="layout-svg"
            viewBox={`0 0 760 ${totalHeight}`}
            role="img"
            aria-label="2D room layout"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            <rect x="1" y="1" width="758" height={totalHeight - 2} rx="10" fill={blueprintUrl ? 'rgba(248,250,252,0.68)' : '#f8fafc'} stroke="#d8e0ec" />
            {shapes.map(({ room, x, y, width, height, fill }) => (
              <g key={room.id}>
                <rect x={x} y={y} width={width} height={height} rx="8" fill={fill} fillOpacity="0.82" stroke="#334155" strokeWidth="1.5" />
                <text x={x + 12} y={y + 28} fontSize="16" fontWeight="700" fill="#0f172a">{room.name}</text>
                <text x={x + 12} y={y + 52} fontSize="13" fill="#334155">{room.type}</text>
                <text x={x + 12} y={y + height - 16} fontSize="12" fill="#475569">{room.length} x {room.width}</text>
              </g>
            ))}
            {rooms.length === 0 && <text x="24" y="48" fontSize="16" fill="#64748b">Add rooms to draw the layout.</text>}
          </svg>
        </div>
      </div>
    </section>
  );
}
