import { FormEvent, useState } from 'react';
import { api } from '../api';
import type { UserSession } from '../types';

export function AuthPage({ onAuth }: { onAuth: (session: UserSession) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const session = mode === 'login'
        ? await api.login({ email, password })
        : await api.register({ name, email, password });
      onAuth(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <h1>Home Interior & Safety Design App</h1>
        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
        </div>
        <form onSubmit={submit} className="stack">
          {mode === 'register' && (
            <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
          )}
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit">{mode === 'login' ? 'Login' : 'Create account'}</button>
        </form>
      </section>
    </main>
  );
}
