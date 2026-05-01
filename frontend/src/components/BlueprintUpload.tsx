import { FormEvent, useState } from 'react';
import { api } from '../api';
import type { Blueprint } from '../types';

export function BlueprintUpload({ token, projectId, blueprint, onUploaded }: {
  token: string;
  projectId: number;
  blueprint?: Blueprint | null;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setError('');
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const lowerName = file.name.toLowerCase();
    if (!allowedTypes.includes(file.type) || !allowedExtensions.some((extension) => lowerName.endsWith(extension))) {
      setError('Blueprint must be a PDF, PNG, JPG, or JPEG file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Blueprint file must be 10MB or smaller');
      return;
    }
    setUploading(true);
    try {
      await api.uploadBlueprint(token, projectId, file);
      setFile(null);
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="panel stack section-card" onSubmit={submit}>
      <div className="section-title">
        <span className="section-icon">BP</span>
        <div>
          <h2>Blueprint Preview</h2>
          <p>{blueprint ? 'Current uploaded plan' : 'Upload a floor plan to anchor the project.'}</p>
        </div>
      </div>
      <div className="blueprint-preview">
        <strong>{blueprint ? blueprint.originalFileName : 'No blueprint uploaded'}</strong>
        <span>{blueprint ? `${Math.round(blueprint.sizeBytes / 1024)} KB` : 'PDF, PNG, JPG, or JPEG up to 10MB'}</span>
      </div>
      <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={!file || uploading}>{uploading ? 'Uploading...' : 'Upload blueprint'}</button>
    </form>
  );
}
