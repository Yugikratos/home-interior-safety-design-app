import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { BlueprintUpload } from '../components/BlueprintUpload';
import { Layout2D } from '../components/Layout2D';
import { PreferencesForm } from '../components/PreferencesForm';
import { RoomForm } from '../components/RoomForm';
import { RoomList } from '../components/RoomList';
import { SafetyChecklist } from '../components/SafetyChecklist';
import { SuggestionsView } from '../components/SuggestionsView';
import type { DesignSuggestion, ProjectDetail, Room, SafetyRecommendation } from '../types';

export function ProjectDetailPage({ token, projectId, onBack }: { token: string; projectId: number; onBack: () => void }) {
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);
  const [safety, setSafety] = useState<SafetyRecommendation[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [suggestionError, setSuggestionError] = useState('');
  const [safetyError, setSafetyError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    const projectDetail = await api.projectDetail(token, projectId);
    setDetail(projectDetail);
    setLoading(false);

    api.suggestions(token, projectId)
      .then((data) => {
        setSuggestions(data);
        setSuggestionError('');
      })
      .catch((err) => setSuggestionError(err instanceof Error ? err.message : 'Could not load suggestions'));

    api.safety(token, projectId)
      .then((data) => {
        setSafety(data);
        setSafetyError('');
      })
      .catch((err) => setSafetyError(err instanceof Error ? err.message : 'Could not load safety recommendations'));
  }, [projectId, token]);

  useEffect(() => {
    load().catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  }, [load]);

  if (!detail) {
    return (
      <main className="page">
        <button className="text-button" onClick={onBack}>Back to projects</button>
        <div className="empty-state">{error || 'Loading project workspace...'}</div>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="page-header hero-header">
        <div>
          <button className="text-button" onClick={onBack}>Back to projects</button>
          <span className="eyebrow">Project detail</span>
          <h1>{detail.project.name}</h1>
          <p>{detail.project.description || 'No project description added yet.'}</p>
        </div>
        <div className="metric-card">
          <strong>{detail.rooms.length}</strong>
          <span>Rooms mapped</span>
        </div>
      </section>
      {error && <p className="error">{error}</p>}
      {loading && <div className="empty-state">Refreshing project data...</div>}
      <section className="workspace">
        <div className="left-rail stack">
          <BlueprintUpload token={token} projectId={projectId} blueprint={detail.project.blueprint} onUploaded={load} />
          <RoomForm token={token} projectId={projectId} editingRoom={editingRoom} onCancelEdit={() => setEditingRoom(null)} onSaved={load} />
          <PreferencesForm token={token} projectId={projectId} preference={detail.preference} onSaved={load} />
        </div>
        <div className="main-area stack">
          <Layout2D token={token} projectId={projectId} blueprint={detail.project.blueprint} rooms={detail.rooms} />
          <RoomList token={token} projectId={projectId} rooms={detail.rooms} onEdit={setEditingRoom} onChanged={load} />
          {suggestionError && <p className="error">{suggestionError}</p>}
          <SuggestionsView suggestions={suggestions} />
          {safetyError && <p className="error">{safetyError}</p>}
          <SafetyChecklist items={safety} />
        </div>
      </section>
    </main>
  );
}
