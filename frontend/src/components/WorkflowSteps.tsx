type StepState = 'completed' | 'active' | 'pending';

export function WorkflowSteps({ hasBlueprint, hasRooms, hasPreference }: {
  hasBlueprint: boolean;
  hasRooms: boolean;
  hasPreference: boolean;
}) {
  const steps: Array<{ label: string; state: StepState }> = [
    { label: 'Upload Blueprint', state: hasBlueprint ? 'completed' : 'active' },
    { label: 'Define Rooms', state: hasRooms ? 'completed' : hasBlueprint ? 'active' : 'pending' },
    { label: 'Set Preferences', state: hasPreference ? 'completed' : hasRooms ? 'active' : 'pending' },
    { label: 'Review & Design', state: hasRooms && hasPreference ? 'active' : 'pending' }
  ];

  return (
    <section className="workflow-steps" aria-label="Project workflow">
      {steps.map((step, index) => (
        <article key={step.label} className={`workflow-step ${step.state}`}>
          <span>{step.state === 'completed' ? '✓' : index + 1}</span>
          <strong>{step.label}</strong>
        </article>
      ))}
    </section>
  );
}
