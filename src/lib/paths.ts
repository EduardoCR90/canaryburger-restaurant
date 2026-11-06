/** Rutas internas y recursos locales bajo la base configurada en Astro. */
export function pathFor(path: string, configuredBase = import.meta.env?.BASE_URL || '/'): string {
  const base = configuredBase.replace(/\/$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}
