/**
 * Helper to ensure product images (including Yupoo photos) load reliably
 * by routing them through our server proxy to bypass anti-hotlinking headers.
 */
export function getProductImageUrl(url?: string): string {
  if (!url) return '';
  if (url.includes('yupoo.com') || url.includes('photo.yupoo.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}
