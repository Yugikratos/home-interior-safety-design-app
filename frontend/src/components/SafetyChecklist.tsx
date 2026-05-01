import type { SafetyRecommendation } from '../types';

const safetyIcon = (category: string) => {
  const text = category.toLowerCase();
  if (text.includes('smoke')) return 'SD';
  if (text.includes('extinguisher')) return 'FE';
  if (text.includes('exit')) return 'EX';
  if (text.includes('electrical')) return 'EL';
  return 'OK';
};

export function SafetyChecklist({ items }: { items: SafetyRecommendation[] }) {
  return (
    <section className="panel section-card">
      <div className="section-title">
        <span className="section-icon">SF</span>
        <div>
          <h2>Safety</h2>
          <p>Basic checklist for smoke, fire, exit, and electrical safety.</p>
        </div>
      </div>
      <div className="checklist">
        {items.map((item) => (
          <label key={`${item.category}-${item.recommendation}`} className="check-row">
            <input type="checkbox" />
            <span className="safety-icon">{safetyIcon(item.category)}</span>
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
