/**
 * Points a listener flagged while a lesson played, kept per paper.
 *
 * Stored in localStorage so it works signed out and needs nothing from the
 * backend. It is per device, the same trade the flashcard reviewer makes.
 */

export type Bookmark = {
  id: string;
  lessonId: string;
  lessonTitle: string;
  /** seconds into the lesson audio */
  at: number;
  /** the line being read when it was flagged */
  line: string;
  createdAt: number;
};

const key = (paper: string) => `beads.bookmarks.${paper}`;

export function loadBookmarks(paper: string): Bookmark[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key(paper)) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(paper: string, list: Bookmark[]) {
  try {
    localStorage.setItem(key(paper), JSON.stringify(list));
  } catch {
    /* private mode or storage full: the list still works for this visit */
  }
}

/** Two flags on the same line a moment apart are one flag, not two cards. */
export function isDuplicate(list: Bookmark[], b: Omit<Bookmark, 'id' | 'createdAt'>) {
  return list.some((x) => x.lessonId === b.lessonId && x.line === b.line
    && Math.abs(x.at - b.at) < 3);
}
