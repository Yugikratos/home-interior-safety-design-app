import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { BlueprintMapper } from '../components/BlueprintMapper';
import { BlueprintUpload } from '../components/BlueprintUpload';
import { Layout2D } from '../components/Layout2D';
import { MappingToolbar } from '../components/MappingToolbar';
import { PreferencesForm } from '../components/PreferencesForm';
import { RoomForm } from '../components/RoomForm';
import { RoomsPanel } from '../components/RoomsPanel';
import { SafetyChecklist } from '../components/SafetyChecklist';
import { SuggestionsView } from '../components/SuggestionsView';
import { WorkflowSteps } from '../components/WorkflowSteps';
import type { DesignSuggestion, ProjectDetail, Room, SafetyRecommendation } from '../types';

export function ProjectDetailPage({ token, projectId, onBack, onProjectMeta }: {
  token: string;
  projectId: number;
  onBack: () => void;
  onProjectMeta?: (meta: { name: string; rooms: number; ready: boolean }) => void;
}) {
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);
  const [safety, setSafety] = useState<SafetyRecommendation[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [suggestionError, setSuggestionError] = useState('');
  const [safetyError, setSafetyError] = useState('');
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [focusMapRoomId, setFocusMapRoomId] = useState<number | null>(null);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  const mapperRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    const projectDetail = await api.projectDetail(token, projectId);
    setDetail(projectDetail);
    setSuggestions([]);
    setSuggestionError('');
    setLoading(false);

    if (projectDetail.rooms.length > 0) {
      api.safety(token, projectId)
        .then((data) => {
          setSafety(data);
          setSafetyError('');
        })
        .catch((err) => setSafetyError(err instanceof Error ? err.message : 'Could not load safety recommendations'));
    } else {
      setSafety([]);
      setSafetyError('');
    }
  }, [projectId, token]);

  useEffect(() => {
    load().catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  }, [load]);

  useEffect(() => {
    if (!detail) return;
    onProjectMeta?.({
      name: detail.project.name,
      rooms: detail.rooms.length,
      ready: detail.rooms.length > 0 && Boolean(detail.preference)
    });
  }, [detail, onProjectMeta]);

  useEffect(() => {
    const listener = () => {
      generateSuggestions();
    };
    window.addEventListener('home-design-generate', listener);
    return () => window.removeEventListener('home-design-generate', listener);
  });

  async function generateSuggestions() {
    if (!detail || detail.rooms.length === 0 || !detail.preference) return;
    setSuggestionError('');
    setSuggestionsLoading(true);
    try {
      const data = await api.suggestions(token, projectId);
      setSuggestions(data);
      scrollToSuggestions();
    } catch (err) {
      setSuggestionError(err instanceof Error ? err.message : 'Could not generate suggestions');
    } finally {
      setSuggestionsLoading(false);
    }
  }

  function scrollToSuggestions() {
    window.setTimeout(() => {
      suggestionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  async function handlePreferenceSaved() {
    await load();
    scrollToSuggestions();
  }

  function focusRoomMapping(roomId: number) {
    setFocusMapRoomId(roomId);
    window.setTimeout(() => {
      mapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  if (!detail) {
    return (
      <main className="page">
        <button className="text-button" onClick={onBack}>Back to projects</button>
        <div className="empty-state">{error || 'Loading project workspace...'}</div>
      </main>
    );
  }

  const hasBlueprint = Boolean(detail.project.blueprint);
  const hasRooms = detail.rooms.length > 0;
  const hasPreference = Boolean(detail.preference);
  const canGenerateSuggestions = hasRooms && hasPreference;

  return (
    <main className="page">
      <button className="text-button" onClick={onBack}>Back to projects</button>
      {error && <p className="error">{error}</p>}
      {loading && <div className="empty-state">Refreshing project data...</div>}
      <WorkflowSteps hasBlueprint={hasBlueprint} hasRooms={hasRooms} hasPreference={hasPreference} />
      <section className="planner-workspace">
        <MappingToolbar blueprint={detail.project.blueprint} />
        <section className="canvas-column" aria-label="Blueprint workspace">
          <div className="canvas-command-bar">
            <div>
              <span className="eyebrow">Blueprint Canvas</span>
              <h1>{detail.project.name}</h1>
              <p>Trace rooms directly on the blueprint or map existing rooms to the plan.</p>
            </div>
            <div className="canvas-actions">
              <button type="button" aria-label="Zoom out">-</button>
              <button type="button" aria-label="Reset zoom">100%</button>
              <button type="button" aria-label="Zoom in">+</button>
              <button type="button">Undo</button>
              <button type="button">Redo</button>
              <button type="button" onClick={() => setFocusMapRoomId(null)}>Reset Mapping</button>
            </div>
          </div>
          <div ref={mapperRef} className="scroll-target">
            <BlueprintMapper token={token} projectId={projectId} blueprint={detail.project.blueprint} rooms={detail.rooms} focusRoomId={focusMapRoomId} onMapped={load} />
          </div>
        </section>
        <RoomsPanel token={token} projectId={projectId} rooms={detail.rooms} onEdit={setEditingRoom} onChanged={load} onMapRoom={focusRoomMapping} />
      </section>
      <section className="results-stack">
        <ResultDashboard
          ready={canGenerateSuggestions}
          suggestionsCount={suggestions.length}
          safetyCount={safety.length}
          roomsCount={detail.rooms.length}
          onPrint={() => window.print()}
        />
        <div className="primary-results-grid">
          <div ref={suggestionsRef} className="scroll-target">
            {suggestionError && <p className="error">{suggestionError}</p>}
            <SuggestionsView
              suggestions={suggestions}
              canGenerate={canGenerateSuggestions}
              hasRooms={hasRooms}
              hasPreference={hasPreference}
              preference={detail.preference}
              loading={suggestionsLoading}
              onGenerate={generateSuggestions}
            />
          </div>
          <div>
            {safetyError && <p className="error">{safetyError}</p>}
            <SafetyChecklist items={safety} hasRooms={hasRooms} />
          </div>
        </div>
        <Layout2D token={token} projectId={projectId} blueprint={detail.project.blueprint} rooms={detail.rooms} onMapRoom={focusRoomMapping} />
        <section className="panel summary-cta">
          <div>
            <span className="section-icon">PDF</span>
            <div>
              <h2>Printable Summary</h2>
              <p>Print a clean report with project details, room data, suggestions, safety checks, and layout preview.</p>
            </div>
          </div>
          <button type="button" className="primary" onClick={() => window.print()}>Print Summary</button>
        </section>
      </section>
      <section className="setup-strip" aria-label="Project setup">
        <BlueprintUpload token={token} projectId={projectId} blueprint={detail.project.blueprint} onUploaded={load} />
        <RoomForm token={token} projectId={projectId} editingRoom={editingRoom} onCancelEdit={() => setEditingRoom(null)} onSaved={load} />
        <PreferencesForm token={token} projectId={projectId} preference={detail.preference} onSaved={handlePreferenceSaved} />
      </section>
      <PrintableSummary detail={detail} suggestions={suggestions} safety={safety} />
    </main>
  );
}

function ResultDashboard({ ready, suggestionsCount, safetyCount, roomsCount, onPrint }: {
  ready: boolean;
  suggestionsCount: number;
  safetyCount: number;
  roomsCount: number;
  onPrint: () => void;
}) {
  return (
    <section className={ready ? 'panel result-dashboard ready' : 'panel result-dashboard'}>
      <div>
        <span className="eyebrow">Results</span>
        <h2>{ready ? 'Your Design Plan is Ready' : 'Complete rooms and preferences to unlock your design plan'}</h2>
        <p>{ready ? 'Review suggestions, safety recommendations, and the 2D layout preview below.' : 'Add at least one room and save preferences to generate Phase 1.6 outputs.'}</p>
      </div>
      <div className="result-summary-grid">
        <article><strong>{suggestionsCount}</strong><span>Interior Design Suggestions</span></article>
        <article><strong>{safetyCount}</strong><span>Safety Recommendations</span></article>
        <article><strong>{roomsCount}</strong><span>2D Layout Preview Rooms</span></article>
      </div>
      <button type="button" onClick={onPrint}>Print Summary</button>
    </section>
  );
}

function PrintableSummary({ detail, suggestions, safety }: {
  detail: ProjectDetail;
  suggestions: DesignSuggestion[];
  safety: SafetyRecommendation[];
}) {
  return (
    <section className="print-summary">
      <h1>{detail.project.name} Design Summary</h1>
      <p>{detail.project.description || 'No project description added.'}</p>
      <h2>Blueprint</h2>
      <p>{detail.project.blueprint?.originalFileName ?? 'No blueprint uploaded.'}</p>
      <h2>Rooms</h2>
      <ul>{detail.rooms.map((room) => <li key={room.id}>{room.name}: {room.type}, {room.length} x {room.width}</li>)}</ul>
      <h2>Preferences</h2>
      <p>{detail.preference ? `${detail.preference.style}, ${detail.preference.budget}, ${detail.preference.colorPalette ?? 'Neutral'}` : 'No preferences saved.'}</p>
      <h2>Design Suggestions</h2>
      <ul>{suggestions.map((suggestion) => <li key={suggestion.roomId}>{suggestion.roomName}: {suggestion.items.join(', ')}</li>)}</ul>
      <h2>Safety Checklist</h2>
      <ul>{safety.map((item) => <li key={`${item.category}-${item.recommendation}`}>{item.category}: {item.recommendation}</li>)}</ul>
      <h2>2D Layout Image</h2>
      <PrintLayout rooms={detail.rooms} />
    </section>
  );
}

function PrintLayout({ rooms }: { rooms: Room[] }) {
  let cursorX = 5;
  let cursorY = 5;
  let rowHeight = 0;
  const shapes = rooms.map((room) => {
    const mapped = room.mapX != null && room.mapY != null && room.mapWidth != null && room.mapHeight != null;
    if (mapped) {
      return { room, x: room.mapX ?? 0, y: room.mapY ?? 0, width: room.mapWidth ?? 20, height: room.mapHeight ?? 20 };
    }
    const width = Math.max(room.width * 3, 14);
    const height = Math.max(room.length * 3, 12);
    if (cursorX + width > 95) {
      cursorX = 5;
      cursorY += rowHeight + 5;
      rowHeight = 0;
    }
    const shape = { room, x: cursorX, y: cursorY, width, height };
    cursorX += width + 5;
    rowHeight = Math.max(rowHeight, height);
    return shape;
  });
  const viewHeight = Math.max(60, shapes.reduce((max, shape) => Math.max(max, shape.y + shape.height + 5), 0));

  return (
    <svg className="print-layout" viewBox={`0 0 100 ${viewHeight}`} role="img" aria-label="Printable 2D layout">
      <rect x="0.5" y="0.5" width="99" height={viewHeight - 1} fill="#f8fafc" stroke="#94a3b8" />
      {shapes.map(({ room, x, y, width, height }) => (
        <g key={room.id}>
          <rect x={x} y={y} width={width} height={height} fill="#dbeafe" stroke="#1e293b" />
          <text x={x + 1.5} y={y + 5} fontSize="3" fontWeight="700">{room.name}</text>
          <text x={x + 1.5} y={y + 9} fontSize="2.4">{room.type}</text>
        </g>
      ))}
    </svg>
  );
}
