import type { SafetyRecommendation } from '../types';

export function SafetyChecklist({ items }: { items: SafetyRecommendation[] }) {
  return (
    <section className="panel">
      <h2>Safety checklist</h2>
      <div className="checklist">
        {items.map((item) => (
          <label key={`${item.category}-${item.recommendation}`} className="check-row">
            <input type="checkbox" />
            <span>
              <strong>{item.category}</strong>
              {item.recommendation}
              {item.required && <em>Required</em>}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
