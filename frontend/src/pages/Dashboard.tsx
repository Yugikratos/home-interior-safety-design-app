import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import type { Project } from '../types';

export function Dashboard({ token, onOpenProject }: { token: string; onOpenProject: (id: number) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setProjects(await api.projects(token));
      setError('');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { name: name.trim(), description };
      if (!payload.name) {
        setError('Project name is required');
        return;
      }
      const project = editingId
        ? await api.updateProject(token, editingId, payload)
        : await api.createProject(token, payload);
      setName('');
      setDescription('');
      setEditingId(null);
      setProjects((current) => editingId
        ? current.map((item) => item.id === project.id ? project : item)
        : [project, ...current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save project');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(project: Project) {
    setEditingId(project.id);
    setName(project.name);
    setDescription(project.description ?? '');
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setName('');
    setDescription('');
  }

  async function deleteProject(id: number) {
    setError('');
    try {
      await api.deleteProject(token, id);
      setProjects((current) => current.filter((project) => project.id !== id));
      if (editingId === id) {
        cancelEdit();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete project');
    }
  }

  return (
    <main className="page">
      <section className="page-header hero-header">
        <div>
          <span className="eyebrow">Workspace</span>
          <h1>Design projects</h1>
          <p>Upload blueprints, define rooms, and review rule-based design and safety guidance.</p>
        </div>
        <div className="metric-card">
          <strong>{projects.length}</strong>
          <span>Active projects</span>
        </div>
      </section>
      <section className="two-column">
        <form onSubmit={submit} className="panel stack">
          <h2>{editingId ? 'Edit project' : 'New project'}</h2>
          <label>Project name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} /></label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save project' : 'Create project'}</button>
          {editingId && <button type="button" onClick={cancelEdit}>Cancel edit</button>}
        </form>
        <div className="project-grid">
          {loading && <div className="empty-state">Loading projects...</div>}
          {projects.map((project) => (
            <article key={project.id} className="project-card">
              <button className="project-open" onClick={() => onOpenProject(project.id)}>
                <span className="project-icon">PLAN</span>
                <strong>{project.name}</strong>
                <span>{project.description || 'No description'}</span>
                <small>{project.blueprint ? `Blueprint: ${project.blueprint.originalFileName}` : 'No blueprint uploaded'}</small>
              </button>
              <div className="card-actions">
                <button type="button" onClick={() => startEdit(project)}>Edit</button>
                <button type="button" className="danger" onClick={() => deleteProject(project.id)}>Delete</button>
              </div>
            </article>
          ))}
          {!loading && projects.length === 0 && <div className="empty-state">Create a project to start designing.</div>}
        </div>
      </section>
    </main>
  );
}
