import type { Room } from '../types';

export function Layout2D({ rooms }: { rooms: Room[] }) {
  const scale = 18;
  let cursorX = 16;
  let cursorY = 16;
  let rowHeight = 0;
  const shapes = rooms.map((room) => {
    const width = Math.max(room.width * scale, 80);
    const height = Math.max(room.length * scale, 70);
    if (cursorX + width > 720) {
      cursorX = 16;
      cursorY += rowHeight + 16;
      rowHeight = 0;
    }
    const shape = { room, x: cursorX, y: cursorY, width, height };
    cursorX += width + 16;
    rowHeight = Math.max(rowHeight, height);
    return shape;
  });
  const totalHeight = Math.max(280, cursorY + rowHeight + 16);

  return (
    <section className="panel">
      <h2>2D layout</h2>
      <svg className="layout-svg" viewBox={`0 0 760 ${totalHeight}`} role="img" aria-label="2D room layout">
        <rect x="1" y="1" width="758" height={totalHeight - 2} fill="#f8fafc" stroke="#cbd5e1" />
        {shapes.map(({ room, x, y, width, height }) => (
          <g key={room.id}>
            <rect x={x} y={y} width={width} height={height} rx="4" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
            <text x={x + 12} y={y + 28} fontSize="16" fontWeight="700" fill="#0f172a">{room.name}</text>
            <text x={x + 12} y={y + 52} fontSize="13" fill="#334155">{room.type}</text>
            <text x={x + 12} y={y + height - 16} fontSize="12" fill="#475569">{room.length} x {room.width}</text>
          </g>
        ))}
        {rooms.length === 0 && <text x="24" y="48" fontSize="16" fill="#64748b">Add rooms to draw the layout.</text>}
      </svg>
    </section>
  );
}
