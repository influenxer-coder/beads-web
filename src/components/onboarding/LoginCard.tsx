'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';

/**
 * Social-first sign in.
 *
 * Two states, as in the reference: provider buttons by default, and an
 * expanded email form once "Continue with email" is pressed. No password
 * anywhere; email is a magic link.
 *
 * Provider buttons are rendered from what the Supabase project actually has
 * enabled. A disabled provider would fail with "provider is not enabled", so
 * rather than show a dead button we ask the server and only offer what works.
 * Enabling Google or Apple later makes the button appear with no code change.
 */

type Provider = 'google' | 'apple';

const VALUE_LINE = 'Your PDFs and notes, as audio you can trust.';

export default function LoginCard({
  onDone,
  onSkip,
  heading = 'Save this lesson',
  sub,
}: {
  onDone?: () => void;
  onSkip?: () => void;
  heading?: string;
  sub?: string;
}) {
  const [enabled, setEnabled] = React.useState<Provider[]>([]);
  const [checking, setChecking] = React.useState(true);
  const [expanded, setExpanded] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [busy, setBusy] = React.useState<null | Provider | 'email'>(null);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Ask the project which providers are live.
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const r = await fetch(`${base}/auth/v1/settings`, { headers: { apikey: key } });
        const d = await r.json();
        const ext = d?.external ?? {};
        const on: Provider[] = (['google', 'apple'] as Provider[]).filter((p) => ext[p]);
        if (alive) setEnabled(on);
      } catch {
        if (alive) setEnabled([]);
      } finally {
        if (alive) setChecking(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const redirectTo = typeof window !== 'undefined' ? window.location.href : undefined;

  const oauth = async (provider: Provider) => {
    setBusy(provider);
    setError(null);
    try {
      const { error: e } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (e) throw e;
      // Browser navigates away on success.
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      setError(
        /not enabled/i.test(msg)
          ? `${provider === 'google' ? 'Google' : 'Apple'} sign in is not switched on yet. Use email for now.`
          : msg || 'Could not sign in.',
      );
      setBusy(null);
    }
  };

  const magicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy('email');
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (err) throw err;
      track('signin_link_sent');
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? 'Could not send the link.');
    } finally {
      setBusy(null);
    }
  };

  if (sent) {
    return (
      <div style={styles.card}>
        <div style={styles.logo}>Beads</div>
        <h2 style={styles.h2}>Check your email</h2>
        <p style={styles.sub}>
          We sent a sign-in link to <strong style={{ color: '#fff' }}>{email}</strong>. Open it on
          this device and your lesson will be waiting.
        </p>
        <button type="button" onClick={onDone} style={{ ...styles.btn, ...styles.btnPrimary }}>
          Done
        </button>
        <button type="button" onClick={() => setSent(false)} style={styles.textLink}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.logo}>Beads</div>
      <h2 style={styles.h2}>{heading}</h2>
      <p style={styles.sub}>{sub ?? VALUE_LINE}</p>

      <div style={styles.stack}>
        {checking && <div style={styles.skeletonBtn} aria-hidden="true" />}

        {!checking &&
          enabled.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => oauth(p)}
              disabled={busy !== null}
              style={{
                ...styles.btn,
                ...(p === 'google' ? styles.btnPrimary : styles.btnOutline),
              }}
            >
              {busy === p ? (
                <Spinner dark={p === 'google'} />
              ) : (
                <>
                  {p === 'google' ? <GoogleMark /> : <AppleMark />}
                  Continue with {p === 'google' ? 'Google' : 'Apple'}
                </>
              )}
            </button>
          ))}

        {!expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            disabled={busy !== null}
            style={{
              ...styles.btn,
              // With no social providers live, email is the primary action.
              ...(enabled.length ? styles.btnOutline : styles.btnPrimary),
            }}
          >
            Continue with Email
          </button>
        ) : (
          <>
            {enabled.length > 0 && (
              <div style={styles.divider}>
                <span style={styles.dividerLine} />
                <span style={styles.dividerText}>Or continue with email</span>
                <span style={styles.dividerLine} />
              </div>
            )}

            <form onSubmit={magicLink} style={styles.form}>
              <label htmlFor="beads-email" style={styles.label}>
                Email
              </label>
              <input
                id="beads-email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="Enter your email address"
                style={styles.input}
              />
              <p style={styles.hint}>We send a link. There is no password to remember.</p>
              <button
                type="submit"
                disabled={busy !== null || !email.trim()}
                style={{
                  ...styles.btn,
                  ...styles.btnPrimary,
                  marginTop: 14,
                  opacity: busy !== null || !email.trim() ? 0.55 : 1,
                }}
              >
                {busy === 'email' ? <Spinner dark /> : 'Send me a link'}
              </button>
            </form>
          </>
        )}
      </div>

      {error && (
        <p style={styles.error} role="alert">
          {error}
        </p>
      )}

      <p style={styles.footer}>
        New here?{' '}
        <button type="button" onClick={() => setExpanded(true)} style={styles.footerLink}>
          Create account
        </button>
      </p>

      {onSkip && (
        <button type="button" onClick={onSkip} style={styles.textLink}>
          Not now
        </button>
      )}
    </div>
  );
}

/* --------------------------------- marks --------------------------------- */

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.2-5.3C29.8 34.9 27 36 24 36c-5.2 0-9.6-3.1-11.3-7.6l-6.6 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.3C36.9 40.2 44 35 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.5 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.2 1.3-2.5 1.3-2.5s-2.5-1-2.5-3.6zM14.3 5.4c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.9 1 0 2.1-.5 2.7-1.3z" />
    </svg>
  );
}

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="onb-spin" aria-label="Working">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={dark ? '#000' : '#fff'}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="40 18"
      />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { width: '100%', maxWidth: 400, margin: '0 auto', textAlign: 'center' },
  logo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 22 },
  h2: { fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' },
  sub: { fontSize: 15, lineHeight: 1.55, color: 'rgba(255,255,255,0.55)', margin: '0 0 26px' },
  stack: { display: 'flex', flexDirection: 'column', gap: 10 },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    minHeight: 50,
    padding: '0 22px',
    borderRadius: 999,
    fontSize: 15.5,
    fontWeight: 600,
    cursor: 'pointer',
    border: 0,
  },
  btnPrimary: { background: '#fff', color: '#000' },
  btnOutline: { background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.28)' },
  skeletonBtn: { height: 50, borderRadius: 999, background: 'rgba(255,255,255,0.07)' },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0' },
  dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.14)' },
  dividerText: { fontSize: 13, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' },
  form: { textAlign: 'left' },
  label: { display: 'block', fontSize: 14, marginBottom: 8, color: 'rgba(255,255,255,0.8)' },
  input: {
    width: '100%',
    minHeight: 50,
    padding: '0 16px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.28)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: 15.5,
    outline: 'none',
  },
  hint: { fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '10px 0 0' },
  error: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 1.5,
    color: '#ffb0b0',
    background: 'rgba(255,90,90,0.08)',
    border: '1px solid rgba(255,90,90,0.24)',
    borderRadius: 10,
    padding: '10px 12px',
    textAlign: 'left',
  },
  footer: { marginTop: 26, fontSize: 14.5, color: 'rgba(255,255,255,0.5)' },
  footerLink: {
    background: 'none',
    border: 0,
    padding: 0,
    color: '#fff',
    fontSize: 14.5,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },
  textLink: {
    display: 'block',
    width: '100%',
    minHeight: 44,
    marginTop: 10,
    background: 'none',
    border: 0,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14.5,
    cursor: 'pointer',
  },
};
