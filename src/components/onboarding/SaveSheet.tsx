'use client';

import * as React from 'react';
import { ui } from './ui';
import { supabase } from '@/lib/supabase';

/**
 * Step 6. Deferred account.
 *
 * Everything before this works signed out. We only ask once the user has heard
 * their lesson and has a reason to keep it.
 */
export default function SaveSheet({
  open,
  lessonTitle,
  onClose,
  onSaved,
}: {
  open: boolean;
  lessonTitle: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [studying, setStudying] = React.useState('');

  if (!open) return null;

  const emailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setErr(e?.message ?? 'Could not send the link.');
    } finally {
      setBusy(false);
    }
  };

  const googleSignIn = async () => {
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
      });
      if (error) throw error;
    } catch (e: any) {
      setErr(e?.message ?? 'Could not sign in.');
      setBusy(false);
    }
  };

  return (
    <>
      <div style={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div style={styles.sheet} role="dialog" aria-modal="true" aria-label="Save this lesson">
        {!sent ? (
          <>
            <h3 style={styles.h3}>Save this lesson?</h3>
            <p style={styles.sub}>
              Keep “{lessonTitle}” and pick up where you left off. You can keep
              listening without an account.
            </p>

            <button type="button" onClick={googleSignIn} disabled={busy} style={{ ...ui.ghostBtn, width: '100%', marginBottom: 10 }}>
              Continue with Google
            </button>

            <form onSubmit={emailSignIn}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                aria-label="Email address"
                style={styles.input}
              />
              <button type="submit" disabled={busy} style={{ ...ui.primaryBtn, width: '100%', marginTop: 10 }}>
                {busy ? 'Sending...' : 'Email me a link'}
              </button>
            </form>

            {err && <p style={styles.err}>{err}</p>}

            <button type="button" onClick={onClose} style={styles.skip}>
              Not now
            </button>
          </>
        ) : (
          <>
            <h3 style={styles.h3}>Check your email</h3>
            <p style={styles.sub}>We sent a sign-in link to {email}.</p>

            <label style={styles.label} htmlFor="studying">
              What are you studying? Optional.
            </label>
            <input
              id="studying"
              value={studying}
              onChange={(e) => setStudying(e.target.value)}
              placeholder="e.g. second year law"
              style={styles.input}
            />

            <button type="button" onClick={onSaved} style={{ ...ui.primaryBtn, width: '100%', marginTop: 14 }}>
              Done
            </button>
            <button type="button" onClick={onSaved} style={styles.skip}>
              Skip
            </button>
          </>
        )}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  scrim: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 970 },
  sheet: {
    position: 'fixed',
    left: '50%',
    bottom: 0,
    transform: 'translateX(-50%)',
    width: 'min(460px, 100vw)',
    zIndex: 980,
    background: '#0e0e0e',
    border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: '18px 18px 0 0',
    padding: '26px 24px calc(26px + env(safe-area-inset-bottom))',
  },
  h3: { margin: '0 0 8px', fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em' },
  sub: { margin: '0 0 22px', fontSize: 15, lineHeight: 1.55, color: 'rgba(255,255,255,0.6)' },
  input: {
    width: '100%',
    minHeight: 48,
    padding: '0 15px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: 15.5,
    outline: 'none',
  },
  label: { display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '18px 0 8px' },
  err: { marginTop: 12, fontSize: 13.5, color: '#ff9f9f' },
  skip: {
    display: 'block',
    width: '100%',
    minHeight: 44,
    marginTop: 12,
    background: 'none',
    border: 0,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14.5,
    cursor: 'pointer',
  },
};
