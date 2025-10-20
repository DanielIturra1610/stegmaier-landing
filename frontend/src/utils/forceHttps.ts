/**
 * Utility to force HTTPS in all API requests
 */

/**
 * Forces HTTPS protocol for any URL in production
 */
export function forceHttps(url: string): string {
  // Si estamos en producción o Railway, forzar HTTPS
  if (
    typeof window !== 'undefined' && 
    (window.location.protocol === 'https:' || 
     window.location.hostname.includes('stegmaierplatform.com'))
  ) {
    // Reemplazar http:// con https://
    if (url.startsWith('http://')) {
      console.warn(`⚠️ [ForceHTTPS] Converting HTTP to HTTPS: ${url}`);
      return url.replace('http://', 'https://');
    }
  }
  
  return url;
}

/**
 * Ensures the API base URL uses HTTPS in production
 */
export function ensureHttpsBaseUrl(baseUrl: string | undefined): string {
  const fallbackUrl = 'https://stegmaierplatform.com/api/v1';
  
  if (!baseUrl) {
    console.warn('⚠️ [ForceHTTPS] No base URL provided, using fallback');
    return fallbackUrl;
  }
  
  // En producción, siempre usar HTTPS
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return forceHttps(baseUrl);
  }
  
  return baseUrl;
}
