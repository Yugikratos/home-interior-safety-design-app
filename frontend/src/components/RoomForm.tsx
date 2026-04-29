import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import type { Room } from '../types';

export function RoomForm({ token, projectId, editingRoom, onCancelEdit, onSaved }: {
  token: string;
  projectId: number;
  editingRoom: Room | null;
  onCancelEdit: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Bedroom');
  const [length, setLength] = useState(12);
  const [width, setWidth] = useState(10);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingRoom) {
      setName(editingRoom.name);
      setType(editingRoom.type);
      setLength(editingRoom.length);
      setWidth(editingRoom.width);
    }
  }, [editingRoom]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }
    if (length <= 0 || width <= 0) {
      setError('Length and width must be greater than zero');
      return;
    }
    try {
      const payload = { name: name.trim(), type, length, width };
      if (editingRoom) {
        await api.updateRoom(token, projectId, editingRoom.id, payload);
      } else {
        await api.addRoom(token, projectId, payload);
      }
      setName('');
      setLength(12);
      setWidth(10);
      onCancelEdit();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save room');
    }
  }

  function cancelEdit() {
    setName('');
    setType('Bedroom');
    setLength(12);
    setWidth(10);
    setError('');
    onCancelEdit();
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <h2>{editingRoom ? 'Edit room' : 'Room'}</h2>
      <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
      <label>Type
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>Bedroom</option>
          <option>Living room</option>
          <option>Kitchen</option>
          <option>Bathroom</option>
          <option>Dining room</option>
        </select>
      </label>
      <div className="split">
        <label>Length<input type="number" min="1" step="0.1" value={length} onChange={(e) => setLength(Number(e.target.value))} /></label>
        <label>Width<input type="number" min="1" step="0.1" value={width} onChange={(e) => setWidth(Number(e.target.value))} /></label>
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit">{editingRoom ? 'Save room' : 'Add room'}</button>
      {editingRoom && <button type="button" onClick={cancelEdit}>Cancel edit</button>}
    </form>
  );
}
