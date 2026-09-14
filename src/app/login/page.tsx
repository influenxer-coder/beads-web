'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LoginCard from '@/components/onboarding/LoginCard';

/**
 * Sign in on its own page.
 *
 * The save step still defers the account until after a lesson exists; this is
 * simply a direct way back in for people who already have one.
 */
export default function LoginPage() {
  const router = useRouter();
  const [already, setAlready] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      if (data?.session?.user) setAlready(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e: any, s: any) => {
      if (s?.user) router.replace('/');
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, [router]);

  return (
    <main style={styles.page}>
      <div style={styles.inner}>
        {already ? (
          <div style={{ textAlign: 'center' }}>
            <p style={styles.note}>You are already signed in.</p>
            <button type="button" onClick={() => router.replace('/')} style={styles.cta}>
              Go to your library
            </button>
          </div>
        ) : (
          <LoginCard
            heading="Sign in"
            sub="Your PDFs and notes, as audio you can trust."
            onDone={() => router.replace('/')}
          />
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0A0A0A',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px',
  },
  inner: { width: '100%' },
  note: { fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 20 },
  cta: {
    minHeight: 48,
    padding: '0 28px',
    borderRadius: 999,
    border: 0,
    background: '#fff',
    color: '#000',
    fontSize: 15.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
