'use client';

import * as React from 'react';
import LoginCard from './LoginCard';

/**
 * Step 6. The deferred account.
 *
 * Everything before this works signed out. The login only appears once the
 * lesson exists and the person has a reason to keep it.
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
  // Escape closes, as with any dialog.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div style={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div style={styles.sheet} role="dialog" aria-modal="true" aria-label="Save this lesson">
        <LoginCard
          heading="Save this lesson"
          sub={
            lessonTitle
              ? `Keep "${lessonTitle}" and pick up where you left off. You can keep listening without an account.`
              : undefined
          }
          onDone={onSaved}
          onSkip={onClose}
        />
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  scrim: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', zIndex: 970 },
  sheet: {
    position: 'fixed',
    left: '50%',
    bottom: 0,
    transform: 'translateX(-50%)',
    width: 'min(460px, 100vw)',
    maxHeight: '92vh',
    overflowY: 'auto',
    zIndex: 980,
    background: '#0e0e0e',
    border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: '18px 18px 0 0',
    padding: '30px 24px calc(26px + env(safe-area-inset-bottom))',
  },
};
