'use client';

import * as React from 'react';
import { Upload, Download, Wand2, Loader2, Save, Check } from 'lucide-react';
import { track } from '@/lib/analytics';

/**
 * Square cover generator.
 *
 * Spotify wants 1:1 artwork; documents are portrait. This renders page one of
 * a PDF (or an uploaded image), fits it inside a 1400x1400 canvas with
 * padding, and fills the remaining space with a solid colour, a colour taken
 * from the page's own edge, or a blurred blow-up of the page itself.
 */

const SIZE = 1400;

type Fill = 'solid' | 'auto' | 'blur';

export default function CoverStudio({
  documentId,
  documentUrl,
  documentTitle,
}: {
  /** When present, the finished cover can be saved back to the library. */
  documentId?: string;
  /** Load this file instead of asking for an upload. */
  documentUrl?: string | null;
  documentTitle?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const pageRef = React.useRef<HTMLCanvasElement | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [padding, setPadding] = React.useState(80);
  const [fill, setFill] = React.useState<Fill>('blur');
  const [colour, setColour] = React.useState('#101014');
  const [saving, setSaving] = React.useState<'idle' | 'working' | 'done'>('idle');

  /* ------------------------------ load source ----------------------------- */

  const loadFromBlob = React.useCallback(async (blob: Blob, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const isPdf = blob.type === 'application/pdf' || /\.pdf$/i.test(name);

      if (isPdf) {
        // The modern build uses syntax this Next version's webpack cannot
        // parse, and bundling the worker with new URL() fails for the same
        // reason. The legacy build parses, and the worker is loaded from a
        // CDN copy pinned to the installed version.
        const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc =
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.worker.min.mjs`;

        const data = new Uint8Array(await blob.arrayBuffer());
        const pdf = await pdfjs.getDocument({ data }).promise;
        const page = await pdf.getPage(1);

        // Render well above the canvas size so downscaling stays sharp.
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (SIZE * 1.4) / base.width });

        const c = document.createElement('canvas');
        c.width = Math.ceil(viewport.width);
        c.height = Math.ceil(viewport.height);
        const ctx = c.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');
        await page.render({ canvas: c, canvasContext: ctx, viewport }).promise;
        pageRef.current = c;
      } else {
        const img = await blobToImage(blob);
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d')?.drawImage(img, 0, 0);
        pageRef.current = c;
      }

      setReady(true);
    } catch (e: any) {
      setError(e?.message ?? 'Could not read that file.');
      setReady(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the linked document automatically.
  React.useEffect(() => {
    if (!documentUrl) return;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(documentUrl);
        if (!r.ok) throw new Error(`Could not fetch the document (${r.status})`);
        await loadFromBlob(await r.blob(), documentUrl);
      } catch (e: any) {
        setError(e?.message ?? 'Could not load the document.');
        setLoading(false);
      }
    })();
  }, [documentUrl, loadFromBlob]);

  /* -------------------------------- draw ---------------------------------- */

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const page = pageRef.current;
    if (!canvas || !page) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = SIZE;
    canvas.height = SIZE;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Background
    if (fill === 'blur') {
      // Cover the square with the page, blown up and blurred, so the fill
      // always belongs to the document rather than being an arbitrary colour.
      const scale = Math.max(SIZE / page.width, SIZE / page.height) * 1.25;
      const w = page.width * scale;
      const h = page.height * scale;
      ctx.save();
      ctx.filter = 'blur(38px) saturate(1.25) brightness(0.72)';
      ctx.drawImage(page, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = fill === 'auto' ? edgeColour(page) : colour;
      ctx.fillRect(0, 0, SIZE, SIZE);
    }

    // Page, fitted inside the padding and centred
    const box = SIZE - padding * 2;
    const scale = Math.min(box / page.width, box / page.height);
    const w = page.width * scale;
    const h = page.height * scale;
    const x = (SIZE - w) / 2;
    const y = (SIZE - h) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 42;
    ctx.shadowOffsetY = 12;
    ctx.drawImage(page, x, y, w, h);
    ctx.restore();
  }, [padding, fill, colour]);

  React.useEffect(() => {
    if (ready) draw();
  }, [ready, draw]);

  /* ------------------------------- actions -------------------------------- */

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    track('cover_downloaded', { fill, padding });
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        a.download = `${(documentTitle || 'cover').replace(/\.[a-z0-9]+$/i, '')}-1400.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
      },
      'image/png',
      1,
    );
  };

  const saveToLibrary = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !documentId) return;
    setSaving('working');
    try {
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode failed'))), 'image/png', 1),
      );
      const form = new FormData();
      form.append('file', blob, `${documentId}.png`);
      const r = await fetch(`/api/cover/${documentId}/square`, { method: 'POST', body: form });
      if (!r.ok) throw new Error(await r.text());
      setSaving('done');
      track('cover_saved');
      setTimeout(() => setSaving('idle'), 2500);
    } catch {
      setSaving('idle');
      setError('Could not save that cover.');
    }
  };

  /* -------------------------------- render -------------------------------- */

  return (
    <div className="w-full text-white">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Canvas */}
        <div className="min-w-0">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03]">
            <canvas
              ref={canvasRef}
              className="h-full w-full"
              style={{ imageRendering: 'auto' }}
              aria-label="Square cover preview"
            />

            {(loading || !ready) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/55">
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm">Rendering page one</span>
                  </>
                ) : (
                  <>
                    <Upload size={22} />
                    <span className="text-sm">Add a PDF or image to begin</span>
                  </>
                )}
              </div>
            )}
          </div>
          <p className="mt-2.5 text-center text-xs text-white/35">1400 × 1400 · PNG</p>
        </div>

        {/* Controls */}
        <div className="space-y-5">
          {!documentUrl && (
            <label className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-full border border-white/25 px-5 text-[15px] font-semibold transition hover:border-white/50">
              <Upload size={16} />
              Choose a file
              <input
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadFromBlob(f, f.name);
                  e.target.value = '';
                }}
              />
            </label>
          )}

          <div>
            <label htmlFor="pad" className="mb-2 block text-[13.5px] text-white/70">
              Padding · {padding}px
            </label>
            <input
              id="pad"
              type="range"
              min={0}
              max={340}
              step={10}
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
              className="w-full accent-white"
            />
          </div>

          <div>
            <span className="mb-2 block text-[13.5px] text-white/70">Background</span>
            <div className="flex gap-2">
              {(
                [
                  ['blur', 'Blurred'],
                  ['auto', 'Auto'],
                  ['solid', 'Solid'],
                ] as [Fill, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFill(key)}
                  aria-pressed={fill === key}
                  className={`min-h-[38px] flex-1 rounded-full border px-3 text-[13px] transition ${
                    fill === key
                      ? 'border-white bg-white font-semibold text-black'
                      : 'border-white/18 text-white/75 hover:border-white/40'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {fill === 'solid' && (
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="color"
                  value={colour}
                  onChange={(e) => setColour(e.target.value)}
                  aria-label="Background colour"
                  className="h-10 w-14 cursor-pointer rounded border border-white/20 bg-transparent"
                />
                <span className="font-mono text-[13px] text-white/55">{colour}</span>
              </div>
            )}

            {fill === 'auto' && (
              <p className="mt-2.5 flex items-start gap-2 text-[12.5px] leading-relaxed text-white/45">
                <Wand2 size={13} className="mt-0.5 shrink-0" />
                Takes the dominant colour from the edge of the page.
              </p>
            )}
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={download}
              disabled={!ready}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-black transition disabled:opacity-40"
            >
              <Download size={16} />
              Download PNG
            </button>

            {documentId && (
              <button
                type="button"
                onClick={saveToLibrary}
                disabled={!ready || saving === 'working'}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full border border-white/25 text-[14.5px] font-semibold transition hover:border-white/50 disabled:opacity-40"
              >
                {saving === 'working' ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : saving === 'done' ? (
                  <Check size={15} />
                ) : (
                  <Save size={15} />
                )}
                {saving === 'done' ? 'Saved' : 'Save as cover'}
              </button>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-[13.5px] text-red-200">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- helpers -------------------------------- */

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image'));
    };
    img.src = url;
  });
}

/**
 * Average the page's outer border.
 *
 * The edge is usually the document's paper or margin, so it blends into the
 * fill rather than fighting it. Sampling the whole page instead would average
 * the text into a flat grey.
 */
function edgeColour(page: HTMLCanvasElement): string {
  const ctx = page.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '#101014';
  const band = Math.max(2, Math.floor(Math.min(page.width, page.height) * 0.04));

  const strips = [
    ctx.getImageData(0, 0, page.width, band),
    ctx.getImageData(0, page.height - band, page.width, band),
    ctx.getImageData(0, 0, band, page.height),
    ctx.getImageData(page.width - band, 0, band, page.height),
  ];

  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (const strip of strips) {
    const d = strip.data;
    // Every 8th pixel is plenty and keeps this instant on large pages.
    for (let i = 0; i < d.length; i += 32) {
      r += d[i];
      g += d[i + 1];
      b += d[i + 2];
      n++;
    }
  }
  if (!n) return '#101014';

  // Darken slightly so the page still reads as the foreground.
  const f = 0.82;
  const hex = (v: number) =>
    Math.round(Math.min(255, (v / n) * f))
      .toString(16)
      .padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}
