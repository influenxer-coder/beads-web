'use client';

/**
 * TikTok Pixel, for retargeting people who arrived from TikTok.
 *
 * The pixel builds the audience; the click id is what ties a signup back to
 * the ad that paid for it. Neither is on by default: set
 * NEXT_PUBLIC_TIKTOK_PIXEL_ID and everything here starts working. Without it
 * every function is a no-op, so the site behaves exactly as it does now.
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

/** Where the click id is kept once TikTok has handed it over. */
const TTCLID_KEY = 'beads_ttclid';
const TTCLID_DAYS = 90;

declare global {
  interface Window {
    ttq?: any;
    TiktokAnalyticsObject?: string;
  }
}

/**
 * TikTok sends ?ttclid= on an ad click and then it is gone on the next
 * navigation. Persist it so a signup days later can still be attributed.
 */
export function captureClickId() {
  if (typeof window === 'undefined') return;
  try {
    const id = new URLSearchParams(window.location.search).get('ttclid');
    if (!id) return;
    const expires = new Date(Date.now() + TTCLID_DAYS * 864e5).toUTCString();
    document.cookie = `${TTCLID_KEY}=${encodeURIComponent(id)}; expires=${expires}; path=/; SameSite=Lax`;
    localStorage.setItem(TTCLID_KEY, id);
  } catch {
    /* a blocked cookie jar is not worth breaking the page over */
  }
}

export function clickId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromStore = localStorage.getItem(TTCLID_KEY);
    if (fromStore) return fromStore;
    const m = document.cookie.match(new RegExp(`(?:^|; )${TTCLID_KEY}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

let started = false;

/** The pixel's own loader, as TikTok publishes it, minus the copy-paste. */
export function initTikTokPixel() {
  if (started || typeof window === 'undefined' || !PIXEL_ID) return;
  started = true;

  /* eslint-disable */
  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t;
    const ttq = (w[t] = w[t] || []);
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off',
      'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie',
      'holdConsent', 'revokeConsent', 'grantConsent'];
    ttq.setAndDefer = function (obj: any, method: string) {
      obj[method] = function () {
        obj.push([method].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (id: string) {
      const inst = ttq._i[id] || [];
      for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(inst, ttq.methods[n]);
      return inst;
    };
    ttq.load = function (e: string, n?: any) {
      const url = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      const opts = n || {};
      opts.partner = undefined;
      ttq._i = ttq._i || {};
      ttq._i[e] = [];
      ttq._i[e]._u = url;
      ttq._t = ttq._t || {};
      ttq._t[e] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[e] = opts;
      const script = d.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = `${url}?sdkid=${e}&lib=${t}`;
      const first = d.getElementsByTagName('script')[0];
      first.parentNode!.insertBefore(script, first);
    };
    ttq.load(PIXEL_ID);
    ttq.page();
  })(window, document, 'ttq');
  /* eslint-enable */
}

/** A pageview on route change; the loader only fires the first one. */
export function tiktokPage() {
  if (typeof window === 'undefined' || !PIXEL_ID) return;
  window.ttq?.page?.();
}

/**
 * A standard TikTok event. Use their vocabulary where one fits -- the ad
 * platform can only optimise towards events it recognises.
 */
export function tiktokTrack(event: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !PIXEL_ID) return;
  try {
    window.ttq?.track?.(event, props);
  } catch {
    /* never let a pixel break the page */
  }
}

export const tiktokEnabled = Boolean(PIXEL_ID);
