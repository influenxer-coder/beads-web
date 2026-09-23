/**
 * The papers published as public pages.
 *
 * An explicit allowlist, not a query. The library holds documents people
 * uploaded for themselves -- a client overview, an internal report, someone's
 * personal PDF -- and there is no public/private flag on the table to tell
 * them apart. Publishing "everything with audio" would put private documents
 * on the open web. A paper appears here only because someone put it here.
 *
 * `doc` matches documents.title exactly; that is the join key.
 */

export type Paper = {
  slug: string;
  /** documents.title in Supabase */
  doc: string;
  /** what the page calls it */
  title: string;
  authors: string;
  year: string;
  /** one line on why it is worth an hour of anyone's attention */
  blurb: string;
  /** where to read the original, free */
  source: string;
};

export const PAPERS: Paper[] = [
  {
    slug: 'superhuman-ai-for-multiplayer-poker',
    doc: 'poker-pluribus.pdf',
    title: 'Superhuman AI for Multiplayer Poker',
    authors: 'Noam Brown and Tuomas Sandholm',
    year: '2019',
    blurb:
      'Pluribus beat five elite professionals at once, in a game where the '
      + 'maths guarantees nothing. It also disagreed with poker folklore, and won.',
    source: 'https://par.nsf.gov/servlets/purl/10119653',
  },
  {
    slug: 'computing-machinery-and-intelligence',
    doc: 'Computing Machinery and Intelligence (Turing, 1950).pdf',
    title: 'Computing Machinery and Intelligence',
    authors: 'A. M. Turing',
    year: '1950',
    blurb:
      'The paper that asked whether machines can think, and answered with a '
      + 'party game about telling a man from a woman.',
    source: 'https://academic.oup.com/mind/article/LIX/236/433/986238',
  },
  {
    slug: 'attention-is-all-you-need',
    doc: 'Attention Is All You Need (Vaswani et al., 2017).pdf',
    title: 'Attention Is All You Need',
    authors: 'Vaswani et al.',
    year: '2017',
    blurb:
      'The Transformer. It threw out twenty years of sequential processing and '
      + 'everything you now call AI is built on it.',
    source: 'https://arxiv.org/abs/1706.03762',
  },
  {
    slug: 'can-quantum-mechanical-description-be-complete',
    doc: 'Can Quantum-Mechanical Description of Reality Be Complete (Einstein, Podolsky & Rosen, 1935).pdf',
    title: 'Can Quantum-Mechanical Description of Physical Reality Be Considered Complete?',
    authors: 'Einstein, Podolsky and Rosen',
    year: '1935',
    blurb:
      'Einstein’s attempt to show quantum mechanics must be incomplete. '
      + 'He was wrong, and being wrong opened a field.',
    source: 'https://journals.aps.org/pr/abstract/10.1103/PhysRev.47.777',
  },
  {
    slug: 'bell-nonlocality',
    doc: 'Bell Nonlocality (Brunner et al., 2014).pdf',
    title: 'Bell Nonlocality',
    authors: 'Brunner et al.',
    year: '2014',
    blurb:
      'The experiment that settled the argument Einstein started, and showed '
      + 'the universe really is as strange as it looked.',
    source: 'https://arxiv.org/abs/1303.2849',
  },
  {
    slug: 'facing-up-to-the-problem-of-consciousness',
    doc: 'Facing Up to the Problem of Consciousness (Chalmers, 1995).pdf',
    title: 'Facing Up to the Problem of Consciousness',
    authors: 'David J. Chalmers',
    year: '1995',
    blurb:
      'Names the hard problem: why any of this feels like anything at all. '
      + 'Still unanswered.',
    source: 'https://consc.net/papers/facing.html',
  },
];

export function paperBySlug(slug: string) {
  return PAPERS.find((p) => p.slug === slug);
}

export type Lesson = {
  id: string;
  title: string;
  audio_url: string;
  script_text: string | null;
  order_index: number | null;
};

/**
 * The lessons for one paper, fetched on the server so the transcript is in
 * the HTML a crawler receives rather than appearing after hydration.
 */
export async function lessonsFor(paper: Paper): Promise<Lesson[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const q = new URLSearchParams({
    select: 'id,title,audio_url,script_text,order_index,documents!inner(title)',
    'documents.title': `eq.${paper.doc}`,
    audio_url: 'not.is.null',
    order: 'order_index.asc',
  });

  const r = await fetch(`${url}/rest/v1/beads?${q}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    // the shelf changes when a paper is ingested, not on every request
    next: { revalidate: 3600 },
  });
  if (!r.ok) return [];
  return (await r.json()) as Lesson[];
}


export type PaperSummary = Paper & {
  lessons: number;
  /** the first lesson's id, which is where its cover art lives */
  coverId: string | null;
  firstTitle: string | null;
};

/**
 * Enough about every published paper to render the shelf: how many lessons it
 * has and which cover to show. One request for all of them rather than one per
 * paper, since the shelf is built as a single page.
 */
export async function paperSummaries(): Promise<PaperSummary[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return PAPERS.map((p) => ({ ...p, lessons: 0, coverId: null, firstTitle: null }));

  const titles = PAPERS.map((p) => `"${p.doc.replace(/"/g, '\\"')}"`).join(',');
  const q = new URLSearchParams({
    select: 'id,title,order_index,documents!inner(title)',
    'documents.title': `in.(${titles})`,
    audio_url: 'not.is.null',
    order: 'order_index.asc',
  });

  const r = await fetch(`${url}/rest/v1/beads?${q}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 3600 },
  });
  if (!r.ok) return PAPERS.map((p) => ({ ...p, lessons: 0, coverId: null, firstTitle: null }));

  const rows = (await r.json()) as Array<{
    id: string; title: string; documents: { title: string };
  }>;

  return PAPERS.map((p) => {
    const mine = rows.filter((b) => b.documents?.title === p.doc);
    return {
      ...p,
      lessons: mine.length,
      coverId: mine[0]?.id ?? null,
      firstTitle: mine[0]?.title ?? null,
    };
  });
}
