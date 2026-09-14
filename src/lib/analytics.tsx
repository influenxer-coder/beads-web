'use client';

import * as React from 'react';
import posthog from 'posthog-js';
import { usePathname } from 'next/navigation';

/**
 * Product analytics.
 *
 * The whole onboarding happens at one URL, so pageviews say nothing useful.
 * What matters is the funnel inside /start, which these named events track,
 * plus session replay, which is worth more than any dashboard while there are
 * only a handful of testers.
 */

// PostHog project keys are public by design: they ship in the client bundle
// whatever we do, and can only write events. The env var overrides it so a
// different project can be pointed at without a code change.
const KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ??
  'phc_AAnoqoG3kPqdpVxEpeooEaKqQKpn2HrFHNmjaCgSaGCc';
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let ready = false;

export function initAnalytics() {
  if (ready || typeof window === 'undefined' || !KEY) return;
  posthog.init(KEY, {
    api_host: HOST,
    // We send pageviews ourselves on route change; the App Router does not
    // trigger the automatic capture reliably.
    capture_pageview: false,
    capture_pageleave: true,
    session_recording: { maskAllInputs: true },
    persistence: 'localStorage+cookie',
  });
  ready = true;
}

/** Fire an event. Safe to call before init or without a key. */
export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !KEY) return;
  try {
    posthog.capture(event, props);
  } catch {
    /* never let analytics break the app */
  }
}

/** Tie the anonymous session to a person once they sign in. */
export function identify(userId: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !KEY) return;
  try {
    posthog.identify(userId, props);
  } catch {
    /* ignore */
  }
}

export function resetIdentity() {
  if (typeof window === 'undefined' || !KEY) return;
  try {
    posthog.reset();
  } catch {
    /* ignore */
  }
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  React.useEffect(() => {
    initAnalytics();
  }, []);

  React.useEffect(() => {
    if (!pathname) return;
    track('$pageview', { $current_url: window.location.href, path: pathname });
  }, [pathname]);

  return <>{children}</>;
}
