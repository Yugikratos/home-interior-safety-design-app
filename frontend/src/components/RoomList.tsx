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
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
    <section className="panel section-card">
      <div className="section-title">
        <span className="section-icon">RM</span>
        <div>
          <h2>Rooms</h2>
          <p>Review room measurements and update the plan.</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="room-list">
        {rooms.map((room) => (
          <article key={room.id} className="room-card">
            <div className="room-card-icon">{room.type.slice(0, 2).toUpperCase()}</div>
            <div className="room-card-body">
              <strong>{room.name}</strong>
              <span>{room.type}</span>
              <small>{room.length} x {room.width}</small>
            </div>
            <div className="card-actions">
              <button type="button" onClick={() => onEdit(room)}>Edit</button>
              <button type="button" className="danger" onClick={() => deleteRoom(room.id)} disabled={deletingId === room.id}>
                {deletingId === room.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </article>
        ))}
        {rooms.length === 0 && <p className="muted">No rooms added yet.</p>}
      </div>
    </section>
  );
}
