import { DEFAULT_BACKEND_URL } from "../api/config";

const FALLBACK_BOARDGAME_IMAGE =
  "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600";

/**
 * Mengubah URL gambar agar kompatibel dengan sistem networking Android / iOS.
 * Gambar dari CDN Gramedia seringkali memicu TLS renegotiation yang ditolak
 * oleh Android OkHttp / Fresco, sehingga kita rutekan melalui image optimizer global
 * (wsrv.nl Cloudflare edge) atau backend proxy lokal Express.js.
 */
export function resolveImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    return FALLBACK_BOARDGAME_IMAGE;
  }

  // Jika bersumber dari cdnwpseller.gramedia.net atau gramedia
  if (
    rawUrl.includes("cdnwpseller.gramedia.net") ||
    rawUrl.includes("master-sellers.gramedia.com") ||
    rawUrl.includes("gramedia")
  ) {
    return `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&output=jpg&q=85`;
  }

  return rawUrl;
}

export function getBackendProxyUrl(rawUrl) {
  if (!rawUrl) return FALLBACK_BOARDGAME_IMAGE;
  return `${DEFAULT_BACKEND_URL}/api/proxy-image?url=${encodeURIComponent(rawUrl)}`;
}

export { FALLBACK_BOARDGAME_IMAGE };

