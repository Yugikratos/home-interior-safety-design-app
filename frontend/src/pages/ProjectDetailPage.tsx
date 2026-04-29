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

  const load = useCallback(async () => {
    setError('');
    const projectDetail = await api.projectDetail(token, projectId);
    setDetail(projectDetail);

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
    load().catch((err) => setError(err.message));
  }, [load]);

  if (!detail) {
    return <main className="page"><button onClick={onBack}>Back</button><p>{error || 'Loading project...'}</p></main>;
  }

  return (
    <main className="page">
      <section className="page-header with-action">
        <div>
          <button className="text-button" onClick={onBack}>Back to projects</button>
          <h1>{detail.project.name}</h1>
          <p>{detail.project.description}</p>
        </div>
      </section>
      {error && <p className="error">{error}</p>}
      <section className="workspace">
        <div className="left-rail stack">
          <BlueprintUpload token={token} projectId={projectId} blueprint={detail.project.blueprint} onUploaded={load} />
          <RoomForm token={token} projectId={projectId} editingRoom={editingRoom} onCancelEdit={() => setEditingRoom(null)} onSaved={load} />
          <PreferencesForm token={token} projectId={projectId} preference={detail.preference} onSaved={load} />
        </div>
        <div className="main-area stack">
          <Layout2D rooms={detail.rooms} />
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
