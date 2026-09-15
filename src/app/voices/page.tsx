'use client';

import * as React from 'react';
import VoicePicker, { type Voice } from '@/components/VoicePicker';

export default function VoicesPage() {
  const [picked, setPicked] = React.useState<Voice | null>(null);

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Voices</h1>
        <p className="mb-7 text-[15px] text-white/55">
          Anything marked policy safe can be published. Cloned voices are for listening in the app
          only.
        </p>

        {picked && (
          <div className="mb-6 rounded-xl border border-white/15 bg-white/[0.05] p-4 text-[14px]">
            Selected <strong>{picked.name}</strong>
            <span className="ml-2 font-mono text-white/45">{picked.id}</span>
          </div>
        )}

        <VoicePicker onSelect={setPicked} selectedId={picked?.id} />
      </div>
    </main>
  );
}
