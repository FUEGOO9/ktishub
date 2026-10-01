export function getProductImageUrl(url: string | undefined | null): string {
  if (!url) return '';

  // Si es una imagen alojada en Yupoo (photo.yupoo.com o similar)
  if (url.includes('yupoo.com')) {
    // wsrv.nl funciona mejor pasando la URL limpia y forzando no-cache / output jpg
    const cleanUrl = url.replace(/^https?:\/\//, '');
    return `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&output=jpg&n=-1`;
  }

  return url;
}