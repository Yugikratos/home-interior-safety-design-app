import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { Blueprint, Room } from '../types';

type Shape = { room: Room; x: number; y: number; width: number; height: number; fill: string; mapped: boolean };

const palette = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#e0e7ff', '#ccfbf1', '#ffedd5'];

function hasMapping(room: Room) {
  return room.mapX != null && room.mapY != null && room.mapWidth != null && room.mapHeight != null;
}

function furnitureFor(room: Room) {
  const type = room.type.toLowerCase();
  if (type.includes('bed')) return ['Bed', 'Wardrobe'];
  if (type.includes('living')) return ['Sofa', 'TV'];
  if (type.includes('kitchen')) return ['Counter', 'Table'];
  if (type.includes('bath')) return ['Vanity'];
  return ['Table', 'Storage'];
}

export function Layout2D({ token, projectId, blueprint, rooms, onMapRoom }: {
  token: string;
  projectId: number;
  blueprint?: Blueprint | null;
  rooms: Room[];
  onMapRoom: (roomId: number) => void;
}) {
  const [blueprintUrl, setBlueprintUrl] = useState('');
  const [blueprintError, setBlueprintError] = useState('');
  const hasRooms = rooms.length > 0;
  const anyMapped = rooms.some(hasMapping);
  const mappedRooms = rooms.filter(hasMapping);
  const unmappedRooms = rooms.filter((room) => !hasMapping(room));
  const isImage = blueprint?.contentType?.startsWith('image/');

  useEffect(() => {
    setBlueprintError('');
    setBlueprintUrl('');
    if (!blueprint || !isImage) return;
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

  const shapes = useMemo<Shape[]>(() => {
    const mappedShapes = rooms
      .filter(hasMapping)
      .map((room, index) => ({
        room,
        x: room.mapX ?? 0,
        y: room.mapY ?? 0,
        width: room.mapWidth ?? 20,
        height: room.mapHeight ?? 20,
        fill: palette[index % palette.length],
        mapped: true
      }));

    if (anyMapped) {
      let cursorX = 4;
      let cursorY = 108;
      let rowHeight = 0;
      const unmappedShapes = rooms
        .filter((room) => !hasMapping(room))
        .map((room, index) => {
          const width = Math.max(Math.min(room.width * 2.5, 28), 14);
          const height = Math.max(Math.min(room.length * 2.5, 24), 10);
          if (cursorX + width > 96) {
            cursorX = 4;
            cursorY += rowHeight + 5;
            rowHeight = 0;
          }
          const shape = { room, x: cursorX, y: cursorY, width, height, fill: palette[(mappedShapes.length + index) % palette.length], mapped: false };
          cursorX += width + 4;
          rowHeight = Math.max(rowHeight, height);
          return shape;
        });
      return [...mappedShapes, ...unmappedShapes];
    }

    let cursorX = 4;
    let cursorY = 4;
    let rowHeight = 0;
    return rooms.map((room, index) => {
      const width = Math.max(room.width * 3.2, 14);
      const height = Math.max(room.length * 3.2, 12);
      if (cursorX + width > 96) {
        cursorX = 4;
        cursorY += rowHeight + 4;
        rowHeight = 0;
      }
      const shape = { room, x: cursorX, y: cursorY, width, height, fill: palette[index % palette.length], mapped: false };
      cursorX += width + 4;
      rowHeight = Math.max(rowHeight, height);
      return shape;
    });
  }, [anyMapped, rooms]);

  const viewHeight = Math.max(anyMapped ? 140 : 62, shapes.reduce((max, shape) => Math.max(max, shape.y + shape.height + 5), 0));

  function renderRoomShape({ room, x, y, width, height, fill, mapped }: Shape, index: number) {
    return (
      <g key={room.id}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx="1.4"
          fill={fill}
          fillOpacity={mapped ? '0.9' : '0.74'}
          stroke={mapped ? '#1e293b' : '#64748b'}
          strokeWidth={mapped ? '0.45' : '0.55'}
          strokeDasharray={mapped ? undefined : '1.6 1.2'}
        />
        <text x={x + 1.4} y={y + 4} fontSize="2.8" fontWeight="700" fill="#0f172a">{room.name}</text>
        <text x={x + 1.4} y={y + 7.3} fontSize="2.2" fill="#334155">{room.type}</text>
        {!mapped && <text x={x + 1.4} y={y + 10.4} fontSize="2" fontWeight="700" fill="#b45309">Not mapped</text>}
        <text x={x + 1.4} y={y + height - 2.2} fontSize="2" fill="#475569">{room.length} x {room.width}</text>
        {furnitureFor(room).map((item, itemIndex) => (
          <g key={item}>
            <rect x={x + 2 + itemIndex * Math.max(8, width / 3)} y={y + Math.max(mapped ? 9 : 13, height * 0.5)} width={Math.max(6, width * 0.22)} height={Math.max(3, height * 0.14)} rx="0.8" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.25" />
            <text x={x + 2.6 + itemIndex * Math.max(8, width / 3)} y={y + Math.max(mapped ? 11.4 : 15.4, height * 0.5 + 2.4)} fontSize="1.45" fill="#475569">{item}</text>
          </g>
        ))}
        {mapped && (
          <g>
            <circle cx={x + width - 3.5} cy={y + 3.2} r="1.7" fill="#ef4444" />
            <text x={x + width - 4.6} y={y + 4} fontSize="1.6" fill="#ffffff">SD</text>
          </g>
        )}
        {mapped && index === 0 && (
          <g>
            <rect x={x + width - 7} y={y + height - 7} width="4.4" height="4.4" rx="0.8" fill="#f97316" />
            <text x={x + width - 6.6} y={y + height - 4.1} fontSize="1.5" fill="#ffffff">FE</text>
          </g>
        )}
      </g>
    );
  }

  return (
    <section className="panel section-card result-card layout-result">
      <div className="section-title">
        <span className="section-icon">2D</span>
        <div>
          <h2>Your 2D Layout</h2>
          <p>{hasRooms ? 'Mapped rooms align with the blueprint; unmapped rooms remain visible in the fallback area.' : 'Add room measurements to generate your 2D layout.'}</p>
        </div>
      </div>
      {!hasRooms && <div className="empty-state">No rooms yet: Add room measurements to generate your 2D layout.</div>}
      {hasRooms && (
        <>
          {mappedRooms.length > 0 && unmappedRooms.length > 0 && (
            <div className="notice-state">Some rooms are not mapped to the blueprint yet.</div>
          )}
          <div className="layout-room-status">
            <article>
              <h3>Mapped rooms</h3>
              {mappedRooms.length === 0 && <p className="muted">No rooms are mapped to the blueprint yet.</p>}
              {mappedRooms.map((room) => <span key={room.id}>{room.name}</span>)}
            </article>
            <article>
              <h3>Unmapped rooms</h3>
              {unmappedRooms.length === 0 && <p className="muted">All rooms are mapped.</p>}
              {unmappedRooms.map((room) => (
                <span key={room.id}>
                  {room.name}
                  <button type="button" onClick={() => onMapRoom(room.id)}>Map this room</button>
                </span>
              ))}
            </article>
          </div>
          <div className="layout-stage">
            <svg className="layout-svg polished-layout" viewBox={`0 0 100 ${viewHeight}`} role="img" aria-label="2D room layout">
              <rect x="0.5" y="0.5" width="99" height={viewHeight - 1} rx="2.2" fill="#f8fafc" stroke="#bfdbfe" />
              {blueprintUrl && (
                <>
                  <image href={blueprintUrl} x="0" y="0" width="100" height="100" preserveAspectRatio="none" opacity="0.28" />
                  <rect x="0.5" y="0.5" width="99" height="99" rx="2.2" fill="rgba(248,250,252,0.34)" stroke="#93c5fd" />
                  <text x="3" y="5" fontSize="2.2" fontWeight="700" fill="#1d4ed8">Blueprint mapped area</text>
                </>
              )}
              {anyMapped && unmappedRooms.length > 0 && (
                <>
                  <line x1="2" y1="102" x2="98" y2="102" stroke="#cbd5e1" strokeDasharray="2 2" />
                  <text x="3" y="106" fontSize="2.2" fontWeight="700" fill="#b45309">Fallback area for rooms not mapped to blueprint</text>
                </>
              )}
              <path d={`M 4 ${viewHeight - 7} C 22 ${viewHeight - 10}, 36 ${viewHeight - 4}, 54 ${viewHeight - 8} S 84 ${viewHeight - 9}, 96 ${viewHeight - 5}`} fill="none" stroke="#22c55e" strokeWidth="1.4" strokeDasharray="2 2" />
              {shapes.map(renderRoomShape)}
              <text x="6" y={viewHeight - 2.3} fontSize="2.2" fontWeight="700" fill="#15803d">Exit path</text>
            </svg>
          </div>
        </>
      )}
      {blueprintError && <p className="error">{blueprintError}</p>}
    </section>
  );
}
