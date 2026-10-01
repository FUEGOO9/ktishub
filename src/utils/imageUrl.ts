export function getProductImageUrl(url: string | undefined | null): string {
  if (!url) return '';

  if (url.includes('yupoo.com')) {
    return `https://yupoo-proxy.elfuegodelawwe.workers.dev/?url=${encodeURIComponent(url)}`;
  }

  return url;
}