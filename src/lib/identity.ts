import { supabase } from '@/lib/supabase';

/**
 * Who owns an upload.
 *
 * Uploads happen before anyone signs in, so each browser gets a stable
 * anonymous id. When a person later signs in, everything that browser made is
 * claimed into their account, so lessons created before the account survive.
 */

const ANON_KEY = 'beads.anonId';

export function anonId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    // Private mode: a per-tab id is still better than none.
    return 'ephemeral';
  }
}

/** Ownership stamp to attach to a newly created document. */
export async function ownerStamp(): Promise<{ user_id: string | null; anon_id: string }> {
  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getSession();
    userId = data?.session?.user?.id ?? null;
  } catch {
    /* signed out */
  }
  return { user_id: userId, anon_id: anonId() };
}

/**
 * Hand this browser's documents to the signed-in user.
 * Safe to call repeatedly; it only touches rows that have no owner.
 */
export async function claimAnonymousDocuments(userId: string): Promise<number> {
  const id = anonId();
  if (!id) return 0;
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({ user_id: userId })
      .eq('anon_id', id)
      .is('user_id', null)
      .select('id');
    if (error) throw error;
    return data?.length ?? 0;
  } catch {
    return 0;
  }
}
