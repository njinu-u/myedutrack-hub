// Guarded service worker registration.
// Never registers inside Lovable preview iframes/hosts, dev, or non-browser envs.
const PREVIEW_HOST_RE = /(lovable\.app|lovableproject\.com|lovableproject-dev\.com)$/i;
const PREVIEW_SUBDOMAIN_RE = /^(id-preview|preview)--/i;

export function registerSWGuarded() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;
  // Skip inside iframes (Lovable preview embeds the site in an iframe)
  try { if (window.self !== window.top) return; } catch { return; }

  const host = window.location.hostname;
  if (PREVIEW_HOST_RE.test(host) && PREVIEW_SUBDOMAIN_RE.test(host)) return;
  if (/\.lovableproject\.com$/i.test(host) || /\.lovableproject-dev\.com$/i.test(host)) return;

  // Dynamic import so the SW client glue isn't pulled into the main bundle.
  import("workbox-window").then(({ Workbox }) => {
    const wb = new Workbox("/sw.js");
    wb.addEventListener("waiting", () => wb.messageSkipWaiting());
    wb.register().catch((e) => console.warn("[SW] registration failed", e));
  }).catch(() => {});
}
