import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import type { Preference } from '../types';

export function PreferencesForm({ token, projectId, preference, onSaved }: {
  token: string;
  projectId: number;
  preference: Preference | null;
  onSaved: () => void | Promise<void>;
}) {
  const [style, setStyle] = useState(preference?.style ?? 'Modern');
  const [budget, setBudget] = useState(preference?.budget ?? 'Medium');
  const [colorPalette, setColorPalette] = useState(preference?.colorPalette ?? 'Neutral');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      await api.savePreference(token, projectId, { style, budget, colorPalette });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save preferences');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel stack section-card" onSubmit={submit}>
      <div className="section-title">
        <span className="section-icon">ST</span>
        <div>
          <h2>Preferences</h2>
          <p>Set the design direction and budget level.</p>
        </div>
      </div>
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
      <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save preferences'}</button>
    </form>
  );
}
