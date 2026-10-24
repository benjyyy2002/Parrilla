/** Mail que aparece en la política de privacidad y los términos. */
export const CONTACT_EMAIL = "jmc73773@gmail.com";

/**
 * Dirección pública de la app. Los links que se comparten (WhatsApp, imágenes) siempre apuntan acá,
 * aunque estés usando la app en localhost. Si algún día hay dominio propio, se cambia con NEXT_PUBLIC_SITE_URL.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://parrilla-liga-prode.vercel.app").replace(/\/$/, "");

/** "https://parrilla-liga-prode.vercel.app/l/abc" → "parrilla-liga-prode.vercel.app/l/abc" (para mostrar). */
export const displayUrl = (url: string) => url.replace(/^https?:\/\//, "");
