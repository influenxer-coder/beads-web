'use client';

import * as React from 'react';
import { track } from '@/lib/analytics';
import Cite from './Cite';
import { type } from '@/lib/type';

export type Question = {
  question: string;
  options: string[];
  answer: number;
  why?: string;
  cite?: string;
};

export default function Quiz({
  questions,
  onCite,
}: {
  questions: Question[];
  onCite?: (cite: string) => void;
}) {
  const [i, setI] = React.useState(0);
  const [picked, setPicked] = React.useState<number | null>(null);
  const [score, setScore] = React.useState(0);

  if (!questions.length) return <p style={styles.empty}>No questions in this quiz.</p>;

  if (i >= questions.length) {
    return (
      <div style={styles.done}>
        <p style={styles.doneTitle}>
          {score} out of {questions.length}
        </p>
        <button
          type="button"
          onClick={() => {
            setI(0);
            setScore(0);
            setPicked(null);
          }}
          style={styles.secondary}
        >
          Try again
        </button>
      </div>
    );
  }

  const q = questions[i];
  const answered = picked !== null;

  return (
    <div style={styles.pad}>
      <div style={styles.counter}>
        Question {i + 1} of {questions.length}
      </div>
      <p style={styles.question}>{q.question}</p>

      <div style={styles.options}>
        {q.options.map((opt, n) => {
          const right = n === q.answer;
          const chosen = picked === n;
          return (
            <button
              key={n}
              type="button"
              disabled={answered}
              onClick={() => {
                setPicked(n);
                if (right) setScore((s) => s + 1);
                track('quiz_answered', { correct: right });
              }}
              style={{
                ...styles.option,
                borderColor: answered
                  ? right
                    ? 'rgba(94,224,138,0.6)'
                    : chosen
                      ? 'rgba(255,140,140,0.6)'
                      : 'rgba(255,255,255,0.12)'
                  : 'rgba(255,255,255,0.16)',
                background: answered && right ? 'rgba(94,224,138,0.08)' : 'transparent',
              }}
            >
              <span style={styles.optionMark}>{String.fromCharCode(65 + n)}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <>
          {q.why && <p style={styles.why}>{q.why}</p>}
          <Cite cite={q.cite} onCite={onCite} />
          <button
            type="button"
            onClick={() => {
              setI((n) => n + 1);
              setPicked(null);
            }}
            style={styles.next}
          >
            {i + 1 === questions.length ? 'See score' : 'Next question'}
          </button>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pad: { padding: '18px 16px 20px' },
  counter: { ...type.caption, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' },
  question: { ...type.subhead, margin: '12px 0 18px' },
  options: { display: 'flex', flexDirection: 'column', gap: 9 },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    minHeight: 52,
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.16)',
    color: '#fff',
    ...type.body,
    textAlign: 'left',
    cursor: 'pointer',
  },
  optionMark: {
    width: 24,
    height: 24,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.1)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...type.caption,
    flexShrink: 0,
  },
  why: { ...type.callout, color: 'rgba(255,255,255,0.7)', margin: '16px 0 0' },
  next: {
    width: '100%',
    minHeight: 48,
    marginTop: 16,
    borderRadius: 999,
    border: 0,
    background: '#fff',
    color: '#000',
    ...type.bodyStrong,
    cursor: 'pointer',
  },
  done: { padding: '38px 20px', textAlign: 'center' },
  doneTitle: { ...type.title, margin: '0 0 16px' },
  secondary: {
    minHeight: 44,
    padding: '0 20px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'transparent',
    color: '#fff',
    ...type.callout,
    cursor: 'pointer',
  },
  empty: { padding: 26, color: 'rgba(255,255,255,0.5)', ...type.callout },
};
