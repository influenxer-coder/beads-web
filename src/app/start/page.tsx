'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';
import { ownerStamp } from '@/lib/identity';
import UploadStep from '@/components/onboarding/UploadStep';
import ParsingStep from '@/components/onboarding/ParsingStep';
import LessonCard, { type Lesson } from '@/components/onboarding/LessonCard';
import MiniPlayer from '@/components/onboarding/MiniPlayer';
import VoicesPanel, { loadLastVoiceId, type Voice } from '@/components/onboarding/VoicesPanel';
import SaveSheet from '@/components/onboarding/SaveSheet';
import Studio from '@/components/studio/Studio';

type Screen = 'upload' | 'parsing' | 'ready';

/** Rough seconds each stage takes, used for the ETA readout. */
const STAGE_ETA: Record<string, number> = {
  upload: 4,
  parse: 8,
  chunk: 6,
  beads: 8,
  scripts: 10,
  audio: 60,
};

export default function StartPage() {
  const [screen, setScreen] = React.useState<Screen>('upload');
  const [stage, setStage] = React.useState('upload');
  const [detail, setDetail] = React.useState<string | null>(null);
  const [eta, setEta] = React.useState<number | null>(null);
  const [degraded, setDegraded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const [lesson, setLesson] = React.useState<Lesson | null>(null);
  const [documentId, setDocumentId] = React.useState<string | null>(null);
  const [others, setOthers] = React.useState<{ id: string; title: string }[]>([]);
  const [toast, setToast] = React.useState<string | null>(null);

  const [playing, setPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const [voicesOpen, setVoicesOpen] = React.useState(false);
  const [voices, setVoices] = React.useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = React.useState(false);
  const [voice, setVoice] = React.useState<Voice | null>(null);

  const [saveOpen, setSaveOpen] = React.useState(false);

  /* ------------------------------ eta ticker ----------------------------- */
  React.useEffect(() => {
    if (screen !== 'parsing') return;
    const id = setInterval(() => setEta((e) => (e == null ? null : Math.max(0, e - 1))), 1000);
    return () => clearInterval(id);
  }, [screen]);

  const enter = (key: string, text?: string) => {
    setStage(key);
    setDetail(text ?? null);
    setEta(
      Object.entries(STAGE_ETA)
        .filter(([k]) => Object.keys(STAGE_ETA).indexOf(k) >= Object.keys(STAGE_ETA).indexOf(key))
        .reduce((a, [, v]) => a + v, 0),
    );
  };

  const runStage = async (documentId: string, key: string) => {
    const r = await fetch(`/api/pipeline/${documentId}/${key}`, { method: 'POST' });
    return r.json();
  };

  /* ------------------------------- the flow ------------------------------ */

  const start = async (file: File) => {
    const startedAt = Date.now();
    track('upload_started', {
      size_mb: +(file.size / 1048576).toFixed(2),
      file_type: file.type || file.name.split('.').pop(),
    });
    setError(null);
    setBusy(true);
    setScreen('parsing');
    setDegraded(false);
    enter('upload', `Uploading ${file.name}`);

    try {
      const ext = file.name.split('.').pop() || 'pdf';
      const objectName = `${Date.now()}.${ext}`;

      const up = await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
        .upload(objectName, file, { cacheControl: '3600', upsert: true, contentType: file.type || 'application/pdf' });
      if (up.error) throw up.error;

      const url = supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
        .getPublicUrl(objectName).data.publicUrl;

      const owner = await ownerStamp();
      const ins = await supabase
        .from('documents')
        .insert({ title: file.name, url, type: 'PDF', ...owner })
        .select('id, title')
        .single();
      if (ins.error) throw ins.error;

      const documentId = ins.data.id as string;

      // Render the cover in the background; the lesson does not wait on it.
      fetch(`/api/cover/${documentId}`, { method: 'POST' }).catch(() => undefined);

      // Parse. If it fails we keep going on whatever text we have rather than
      // dead-ending, which is the ElevenReader failure mode we are avoiding.
      enter('parse', 'Reading the document');
      const parsed = await runStage(documentId, 'parse');
      if (!parsed.success) setDegraded(true);
      const pages = parsed?.data?.pages ?? parsed?.data?.page_count;
      if (pages) setDetail(`Read ${pages} pages`);

      enter('chunk', 'Finding the sections');
      await runStage(documentId, 'chunk');

      enter('beads', 'Picking the key idea');
      await runStage(documentId, 'beads');

      enter('scripts', 'Writing your lesson');
      await runStage(documentId, 'scripts');

      enter('audio', 'Recording the narration');
      await runStage(documentId, 'audio');

      // Read back whatever the pipeline produced.
      const { data: beads } = await supabase
        .from('beads')
        .select('id, title, script_text, audio_url, order_index')
        .eq('document_id', documentId)
        .order('order_index')
        .limit(6);

      const list = beads ?? [];
      const first = list.find((b: any) => b.audio_url) ?? list[0];

      if (!first) {
        track('upload_failed', { reason: 'no_beads_generated', seconds: Math.round((Date.now() - startedAt) / 1000) });
        throw new Error('We could not make a lesson from that file.');
      }

      setDocumentId(documentId);
      setLesson({
        id: first.id,
        title: first.title,
        sourceTitle: ins.data.title,
        citedTo: first.order_index != null ? `section ${first.order_index}` : null,
        audioUrl: first.audio_url,
        script: first.script_text,
        durationSec: null,
      });
      setOthers(list.filter((b: any) => b.id !== first.id).map((b: any) => ({ id: b.id, title: b.title })));
      track('lesson_ready', {
        seconds_elapsed: Math.round((Date.now() - startedAt) / 1000),
        has_audio: !!first.audio_url,
        degraded,
      });
      setScreen('ready');
      setToast('Your lesson is ready');
      setTimeout(() => setToast(null), 5000);
    } catch (e: any) {
      track('upload_failed', {
        reason: e?.message ?? 'unknown',
        seconds: Math.round((Date.now() - startedAt) / 1000),
      });
      setError(e?.message ?? 'Something went wrong. Try another file.');
      setScreen('upload');
    } finally {
      setBusy(false);
    }
  };

  const startFromLink = async (url: string) => {
    setError('Links are not supported yet. Upload a file for now.');
    void url;
  };

  /* -------------------------------- audio -------------------------------- */

  const togglePlay = React.useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      if (a.currentTime === 0) track('play_started');
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      a.pause();
      setPlaying(false);
    }
  }, []);

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnd = () => setPlaying(false);
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    a.addEventListener('ended', onEnd);
    a.addEventListener('pause', onPause);
    a.addEventListener('play', onPlay);
    return () => {
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('play', onPlay);
    };
  }, [lesson]);

  /* -------------------------------- voices -------------------------------- */

  const openVoices = async () => {
    setVoicesOpen(true);
    if (voices.length) return;
    setVoicesLoading(true);
    try {
      const r = await fetch('/api/inspirations');
      const d = await r.json();
      const list: Voice[] = (d?.profiles ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        language: p.voice_settings?.language || 'English',
      }));
      setVoices(list);
      const last = loadLastVoiceId();
      if (last) setVoice(list.find((v) => v.id === last) ?? null);
    } catch {
      setVoices([]);
    } finally {
      setVoicesLoading(false);
    }
  };

  const applyVoice = async (v: Voice) => {
    if (!lesson || !documentId) return;
    track('voice_applied', { voice: v.name });

    setVoice(v);
    setVoicesOpen(false);
    setToast(`Re-narrating in ${v.name}. This takes a minute...`);

    const wasPlaying = playing;
    audioRef.current?.pause();

    try {
      // The backend reads the voice off the document's profile, so point the
      // document at the chosen inspiration before asking for new audio.
      const upd = await supabase
        .from('documents')
        .update({ profile_id: v.id })
        .eq('id', documentId);
      if (upd.error) throw upd.error;

      // Re-narrate this one bead, not the whole document.
      const r = await fetch(`/api/pipeline/${lesson.id}/bead-audio`, { method: 'POST' });
      const out = await r.json();
      if (!out.success) throw new Error(out?.error?.error ?? 'Could not re-narrate');

      // Read the fresh URL back.
      const { data: row } = await supabase
        .from('beads')
        .select('audio_url')
        .eq('id', lesson.id)
        .single();

      const fresh = row?.audio_url ?? lesson.audioUrl;
      if (!fresh) throw new Error('No audio came back');

      // The regenerated file keeps the same path, so without a cache buster the
      // browser just replays the old narration.
      const busted = `${fresh}${fresh.includes('?') ? '&' : '?'}v=${Date.now()}`;

      setLesson((l) => (l ? { ...l, audioUrl: busted } : l));

      // Point the element at the new file and pick up where we were.
      requestAnimationFrame(() => {
        const a = audioRef.current;
        if (!a) return;
        a.load();
        if (wasPlaying) a.play().catch(() => undefined);
      });

      setToast(`Now reading in ${v.name}`);
    } catch (e: any) {
      setToast(e?.message ?? 'Could not change the voice. The original is still playing.');
    }
    setTimeout(() => setToast(null), 6000);
  };

  /* -------------------------------- render -------------------------------- */

  return (
    <main style={styles.page}>
      <div style={styles.inner}>
        {screen === 'upload' && (
          <UploadStep onFile={start} onLink={startFromLink} busy={busy} error={error} />
        )}

        {screen === 'parsing' && (
          <ParsingStep activeKey={stage} detail={detail} etaSeconds={eta} degraded={degraded} />
        )}

        {screen === 'ready' && lesson && (
          <>
            <LessonCard
              lesson={lesson}
              playing={playing}
              onPlay={togglePlay}
              onOpenVoices={openVoices}
              others={others}
            />
            {documentId && (
              <div style={styles.studioWrap}>
                <Studio documentId={documentId} documentTitle={lesson.sourceTitle} />
              </div>
            )}

            <div style={styles.saveRow}>
              <button
                type="button"
                onClick={() => {
                  track('save_clicked');
                  setSaveOpen(true);
                }}
                style={styles.saveLink}
              >
                Save this lesson
              </button>
            </div>
          </>
        )}
      </div>

      {lesson?.audioUrl && (
        <>
          {/* One audio element for the whole flow. */}
          <audio ref={audioRef} src={lesson.audioUrl} preload="auto" />
          <MiniPlayer
            audioRef={audioRef}
            title={lesson.title}
            sourceTitle={lesson.sourceTitle}
            voiceName={voice?.name}
            playing={playing}
            onTogglePlay={togglePlay}
          />
        </>
      )}

      {toast && (
        <div style={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}

      <VoicesPanel
        open={voicesOpen}
        voices={voices}
        loading={voicesLoading}
        currentId={voice?.id}
        onApply={applyVoice}
        onClose={() => setVoicesOpen(false)}
        sampleText={lesson?.script || 'This is how your lesson will sound.'}
      />

      <SaveSheet
        open={saveOpen}
        lessonTitle={lesson?.title ?? ''}
        onClose={() => setSaveOpen(false)}
        onSaved={() => setSaveOpen(false)}
      />
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
    padding: '48px 20px 160px',
  },
  inner: { width: '100%' },
  studioWrap: { maxWidth: 560, margin: '40px auto 0' },
  saveRow: { maxWidth: 560, margin: '22px auto 0', textAlign: 'center' },
  saveLink: {
    background: 'none',
    border: 0,
    minHeight: 44,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14.5,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    cursor: 'pointer',
  },
  toast: {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: 104,
    zIndex: 940,
    background: 'rgba(255,255,255,0.95)',
    color: '#000',
    padding: '11px 18px',
    borderRadius: 999,
    fontSize: 14.5,
    fontWeight: 550,
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
};
