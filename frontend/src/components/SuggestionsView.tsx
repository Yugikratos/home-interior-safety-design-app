import type { DesignSuggestion, Preference } from '../types';

const itemIcon = (item: string) => {
  const text = item.toLowerCase();
  if (text.includes('bed')) return 'BED';
  if (text.includes('wardrobe') || text.includes('storage') || text.includes('shelving')) return 'STO';
  if (text.includes('lighting') || text.includes('light')) return 'LIT';
  if (text.includes('sofa')) return 'SOF';
  if (text.includes('table')) return 'TAB';
  if (text.includes('tv')) return 'TV';
  if (text.includes('floor')) return 'FLR';
  return 'ITM';
};

export function SuggestionsView({ suggestions, canGenerate, hasRooms, hasPreference, preference, loading, onGenerate }: {
  suggestions: DesignSuggestion[];
  canGenerate: boolean;
  hasRooms: boolean;
  hasPreference: boolean;
  preference: Preference | null;
  loading: boolean;
  onGenerate: () => void;
}) {
  const emptyMessage = !hasRooms
    ? 'No rooms yet: Add room measurements to generate your 2D layout.'
    : !hasPreference
      ? 'No preferences yet: Save your design style and budget to generate suggestions.'
      : 'Generate design suggestions based on your rooms and preferences.';

  return (
    <section className="panel section-card result-card suggestions-result">
      <div className="section-title">
        <span className="section-icon">ID</span>
        <div>
          <h2>Interior Design Suggestions</h2>
          <p>Furniture and finish ideas generated from room type and style.</p>
        </div>
      </div>
      <div className="section-actions">
        <button type="button" onClick={onGenerate} disabled={!canGenerate || loading}>
          {loading ? 'Generating...' : 'Generate Suggestions'}
        </button>
      </div>
      {suggestions.length > 0 && <div className="ready-message">Your design suggestions are ready below</div>}
      {suggestions.length === 0 && (
        <div className="empty-state elevated-empty">
          <strong>{emptyMessage}</strong>
          <button type="button" className="primary" onClick={onGenerate} disabled={!canGenerate || loading}>
            {loading ? 'Generating...' : 'Generate Suggestions'}
          </button>
        </div>
      )}
      <div className="cards suggestion-grid">
        {suggestions.map((suggestion) => (
          <article key={suggestion.roomId} className="suggestion-card">
            <div className="suggestion-header">
              <span>{suggestion.roomType.slice(0, 2).toUpperCase()}</span>
              <div>
                <h3>{suggestion.roomName}</h3>
                <p>{suggestion.roomType} / {suggestion.style}</p>
              </div>
            </div>
            <div className="furniture-list">
              {suggestion.items.map((item) => (
                <span key={item} className="furniture-chip furniture-card">
                  <strong>{itemIcon(item)}</strong>
                  {item}
                </span>
              ))}
            </div>
            <small>{suggestion.note}</small>
            <p className="suggestion-why">
              Suggested because {suggestion.roomName} is a {suggestion.roomType.toLowerCase()} with a {suggestion.style.toLowerCase()} style preference and {preference?.budget.toLowerCase() ?? 'selected'} budget level.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
