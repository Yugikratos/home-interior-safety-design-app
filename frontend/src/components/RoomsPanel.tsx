import { useState } from 'react';
import { api } from '../api';
import type { Room } from '../types';

function hasMapping(room: Room) {
  return room.mapX != null && room.mapY != null && room.mapWidth != null && room.mapHeight != null;
}

function RoomCard({ room, onEdit, onDelete, deleting }: {
  room: Room;
  onEdit: (room: Room) => void;
  onDelete: (id: number) => void;
  deleting: boolean;
}) {
  return (
    <article className="planner-room-card">
      <div>
        <strong>{room.name}</strong>
        <span>{room.type}</span>
        <small>{room.length} x {room.width}</small>
      </div>
      <div className="icon-actions">
        <button type="button" title="Edit room" onClick={() => onEdit(room)}>Edit</button>
        <button type="button" title="Delete room" className="danger" onClick={() => onDelete(room.id)} disabled={deleting}>
          {deleting ? '...' : 'Delete'}
        </button>
      </div>
    </article>
  );
}

export function RoomsPanel({ token, projectId, rooms, onEdit, onChanged, onMapRoom }: {
  token: string;
  projectId: number;
  rooms: Room[];
  onEdit: (room: Room) => void;
  onChanged: () => void;
  onMapRoom: (roomId: number) => void;
}) {
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const mappedRooms = rooms.filter(hasMapping);
  const unmappedRooms = rooms.filter((room) => !hasMapping(room));

  async function deleteRoom(roomId: number) {
    setError('');
    setDeletingId(roomId);
    try {
      await api.deleteRoom(token, projectId, roomId);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete room');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <aside className="rooms-panel">
      {error && <p className="error">{error}</p>}
      <section>
        <h3>Mapped Rooms</h3>
        {mappedRooms.length === 0 && <div className="mini-empty">No mapped rooms yet.</div>}
        {mappedRooms.map((room) => (
          <RoomCard key={room.id} room={room} onEdit={onEdit} onDelete={deleteRoom} deleting={deletingId === room.id} />
        ))}
      </section>
      <section>
        <h3>Unmapped Rooms</h3>
        {unmappedRooms.length === 0 && <div className="mini-empty">All rooms are mapped.</div>}
        {unmappedRooms.map((room) => (
          <div key={room.id} className="unmapped-room-row">
            <RoomCard room={room} onEdit={onEdit} onDelete={deleteRoom} deleting={deletingId === room.id} />
            <button type="button" onClick={() => onMapRoom(room.id)}>Map this room</button>
          </div>
        ))}
      </section>
      <section className="tips-card">
        <h3>Tips</h3>
        <p>Trace rooms directly from the blueprint for best alignment. Use mapped rooms for safety marker placement.</p>
      </section>
    </aside>
  );
}
