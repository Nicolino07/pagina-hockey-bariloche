import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_NAME = "Hockey Bariloche";
const SITE_URL = "https://hockeybariloche.com.ar";
const DEFAULT_IMAGE = `${SITE_URL}/logoAHBLS.png`;

export interface SeoOptions {
  /** Título de la pestaña. Se le agrega " | Hockey Bariloche" salvo que sea el home. */
  title: string;
  /** Meta description (ideal entre 120 y 160 caracteres). */
  description: string;
  /** Imagen para compartir en redes (URL absoluta). */
  image?: string;
  /** Ruta canónica. Por defecto usa la ruta actual sin query string. */
  canonicalPath?: string;
  /** Si es true, pide a los buscadores no indexar la página. */
  noIndex?: boolean;
  /** Tipo de Open Graph: "website" (default) o "article" para noticias. */
  type?: "website" | "article";
  /** Datos estructurados schema.org de la página (se inyectan como JSON-LD). */
  jsonLd?: Record<string, unknown> | null;
}

/**
 * Actualiza los meta tags del documento según la página actual.
 *
 * El sitio es una SPA sin renderizado en servidor: los buscadores ejecutan JS,
 * así que los tags se escriben en el <head> al montar cada página.
 */
function setMeta(selector: string, attr: "name" | "property", key: string, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

const JSON_LD_ID = "seo-jsonld";

function setJsonLd(data: Record<string, unknown> | null | undefined): void {
  const previo = document.getElementById(JSON_LD_ID);
  if (previo) previo.remove();
  if (!data) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = JSON_LD_ID;
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function setCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

export function useSeo({
  title,
  description,
  image = DEFAULT_IMAGE,
  canonicalPath,
  noIndex = false,
  type = "website",
  jsonLd = null,
}: SeoOptions): void {
  const location = useLocation();

  useEffect(() => {
    const tituloCompleto = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const url = `${SITE_URL}${canonicalPath ?? location.pathname}`;

    document.title = tituloCompleto;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      noIndex ? "noindex, nofollow" : "index, follow"
    );
    setCanonical(url);

    setMeta('meta[property="og:title"]', "property", "og:title", tituloCompleto);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    setMeta('meta[property="og:image"]', "property", "og:image", image);
    setMeta('meta[property="og:type"]', "property", "og:type", type);

    setMeta('meta[name="twitter:title"]', "name", "twitter:title", tituloCompleto);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);

    setJsonLd(jsonLd);
    return () => setJsonLd(null);
  }, [title, description, image, canonicalPath, noIndex, type, jsonLd, location.pathname]);
}

export default useSeo;
