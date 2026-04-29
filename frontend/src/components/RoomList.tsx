import { useState } from 'react';
import { api } from '../api';
import type { Room } from '../types';

export function RoomList({ token, projectId, rooms, onEdit, onChanged }: {
  token: string;
  projectId: number;
  rooms: Room[];
  onEdit: (room: Room) => void;
  onChanged: () => void;
}) {
  const [error, setError] = useState('');

  async function deleteRoom(roomId: number) {
    setError('');
    try {
      await api.deleteRoom(token, projectId, roomId);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete room');
    }
  }

  return (
    <section className="panel">
      <h2>Rooms</h2>
      {error && <p className="error">{error}</p>}
      <div className="room-list">
        {rooms.map((room) => (
          <article key={room.id} className="room-row">
            <span>
              <strong>{room.name}</strong>
              {room.type} · {room.length} x {room.width}
            </span>
            <div className="card-actions">
              <button type="button" onClick={() => onEdit(room)}>Edit</button>
              <button type="button" className="danger" onClick={() => deleteRoom(room.id)}>Delete</button>
            </div>
          </article>
        ))}
        {rooms.length === 0 && <p className="muted">No rooms added yet.</p>}
      </div>
    </section>
  );
}
