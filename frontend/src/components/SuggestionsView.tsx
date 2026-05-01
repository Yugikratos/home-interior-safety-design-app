import type { DesignSuggestion } from '../types';

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

export function SuggestionsView({ suggestions }: { suggestions: DesignSuggestion[] }) {
  return (
    <section className="panel section-card">
      <div className="section-title">
        <span className="section-icon">ID</span>
        <div>
          <h2>Suggestions</h2>
          <p>Furniture and finish ideas generated from room type and style.</p>
        </div>
      </div>
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
                <span key={item} className="furniture-chip">
                  <strong>{itemIcon(item)}</strong>
                  {item}
                </span>
              ))}
            </div>
            <small>{suggestion.note}</small>
          </article>
        ))}
        {suggestions.length === 0 && <p className="muted">Add rooms to generate rule-based suggestions.</p>}
      </div>
    </section>
  );
}
