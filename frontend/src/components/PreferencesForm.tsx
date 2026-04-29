import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import type { Preference } from '../types';

export function PreferencesForm({ token, projectId, preference, onSaved }: {
  token: string;
  projectId: number;
  preference: Preference | null;
  onSaved: () => void;
}) {
  const [style, setStyle] = useState(preference?.style ?? 'Modern');
  const [budget, setBudget] = useState(preference?.budget ?? 'Medium');
  const [colorPalette, setColorPalette] = useState(preference?.colorPalette ?? 'Neutral');
  const [error, setError] = useState('');

  useEffect(() => {
    if (preference) {
      setStyle(preference.style);
      setBudget(preference.budget);
      setColorPalette(preference.colorPalette ?? 'Neutral');
    }
  }, [preference]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await api.savePreference(token, projectId, { style, budget, colorPalette });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save preferences');
    }
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <h2>Preferences</h2>
      <label>Style
        <select value={style} onChange={(e) => setStyle(e.target.value)}>
          <option>Modern</option>
          <option>Minimal</option>
          <option>Classic</option>
          <option>Industrial</option>
        </select>
      </label>
      <label>Budget
        <select value={budget} onChange={(e) => setBudget(e.target.value)}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </label>
      <label>Color palette<input value={colorPalette} onChange={(e) => setColorPalette(e.target.value)} /></label>
      {error && <p className="error">{error}</p>}
      <button type="submit">Save preferences</button>
    </form>
  );
}
