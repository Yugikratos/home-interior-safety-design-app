import type { DesignSuggestion } from '../types';

export function SuggestionsView({ suggestions }: { suggestions: DesignSuggestion[] }) {
  return (
    <section className="panel">
      <h2>Design suggestions</h2>
      <div className="cards">
        {suggestions.map((suggestion) => (
          <article key={suggestion.roomId} className="mini-card">
            <h3>{suggestion.roomName}</h3>
            <p>{suggestion.roomType} · {suggestion.style}</p>
            <ul>
              {suggestion.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <small>{suggestion.note}</small>
          </article>
        ))}
        {suggestions.length === 0 && <p className="muted">Add rooms to generate rule-based suggestions.</p>}
      </div>
    </section>
  );
}
