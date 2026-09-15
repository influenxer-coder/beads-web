'use client';

import * as React from 'react';
import CoverStudio from '@/components/CoverStudio';

export default function CoverPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Square cover</h1>
        <p className="mb-7 text-[15px] text-white/55">
          Spotify wants 1:1 artwork. Drop in a PDF or image and fit page one into a 1400 square.
        </p>
        <CoverStudio />
      </div>
    </main>
  );
}
