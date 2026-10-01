export function getProductImageUrl(url: string | undefined | null): string {
  if (!url) return '';

  if (url.includes('yupoo.com')) {
    const cleanUrl = url.replace(/^https?:\/\//, '');
    return `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&output=jpg&n=-1`;
  }

  return url;
}