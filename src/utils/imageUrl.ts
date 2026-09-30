export function getProductImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  if (url.includes('yupoo.com') || url.includes('photo.store')) {
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  }

  return url;
}