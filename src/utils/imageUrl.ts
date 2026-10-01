export function getProductImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (url.includes('yupoo.com')) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}