import type { SafetyRecommendation } from '../types';

const safetyIcon = (category: string) => {
  const text = category.toLowerCase();
  if (text.includes('smoke')) return 'SD';
  if (text.includes('extinguisher')) return 'FE';
  if (text.includes('exit')) return 'EX';
  if (text.includes('electrical')) return 'EL';
  return 'OK';
};

function groupName(category: string) {
  const text = category.toLowerCase();
  if (text.includes('smoke')) return 'Smoke Detection';
  if (text.includes('exit')) return 'Exit Path';
  if (text.includes('electrical')) return 'Electrical Safety';
  return 'Fire';
}

function priority(category: string) {
  const group = groupName(category);
  if (group === 'Fire' || group === 'Smoke Detection') return 'High';
  if (group === 'Exit Path') return 'Medium';
  return 'Low';
}

function groupIcon(group: string) {
  if (group === 'Fire') return 'FE';
  if (group === 'Smoke Detection') return 'SD';
  if (group === 'Exit Path') return 'EX';
  return 'EL';
}

export function SafetyChecklist({ items, hasRooms }: { items: SafetyRecommendation[]; hasRooms: boolean }) {
  const groups = ['Fire', 'Smoke Detection', 'Exit Path', 'Electrical Safety'].map((group) => ({
    group,
    items: items.filter((item) => groupName(item.category) === group)
  }));
  const highPriorityCount = items.filter((item) => priority(item.category) === 'High').length;

  return (
    <section className="panel section-card result-card">
      <div className="section-title">
        <span className="section-icon">SF</span>
        <div>
          <h2>Safety Recommendations</h2>
          <p>Basic checklist for smoke, fire, exit, and electrical safety.</p>
        </div>
      </div>
      {!hasRooms && <div className="empty-state">No rooms yet: Add room measurements to generate safety recommendations.</div>}
      {hasRooms && items.length === 0 && <div className="empty-state">Safety recommendations will appear after rooms are added.</div>}
      {hasRooms && items.length > 0 && (
        <>
          <div className="safety-insight">
            <strong>{highPriorityCount} high priority safety items detected</strong>
            <span>Review fire and smoke recommendations before finalizing the plan.</span>
          </div>
          <div className="safety-groups">
            {groups.map(({ group, items }) => (
              <article key={group} className="safety-group">
                <div className="safety-group-title">
                  <span className="safety-icon">{groupIcon(group)}</span>
                  <h3>{group}</h3>
                </div>
                {items.length === 0 && <p className="muted">No Phase 1.5 recommendation for this category yet.</p>}
                <div className="checklist">
                  {items.map((item) => (
                    <label key={`${item.category}-${item.recommendation}`} className={`check-row priority-row-${priority(item.category).toLowerCase()}`}>
                      <input type="checkbox" />
                      <span className="safety-icon">{safetyIcon(item.category)}</span>
                      <span>
                        <strong>{item.category}</strong>
                        {item.recommendation}
                        <em className={`priority priority-${priority(item.category).toLowerCase()}`}>{priority(item.category)}</em>
                      </span>
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
