export function getImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // Si la imagen viene de Yupoo o servicios similares, la pasamos por el proxy
  if (url.includes('yupoo.com') || url.includes('photo.store')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

  return url;
}