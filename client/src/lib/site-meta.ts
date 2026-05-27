/** Canonical public site origin (www subdomain). */
export const SITE_ORIGIN = "https://www.paedsresus.com";

export const DEFAULT_PAGE_TITLE = "Paeds Resus — Paediatric emergency care platform";

export const DEFAULT_PAGE_DESCRIPTION =
  "Paeds Resus — paediatric emergency platform for Kenya & East Africa: AHA-aligned BLS, ACLS, PALS training, ResusGPS bedside guidance, Care Signal QI, Safe-Truth for families, and hospital readiness. Always follow your facility protocol.";

export const OG_IMAGE_PATH = "/og-image.png";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export function setNamedMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function setPropertyMeta(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function setCanonicalLink(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function applyPageMeta(options: {
  title: string;
  description: string;
  path?: string;
}) {
  const path = options.path ?? window.location.pathname;
  const url = `${SITE_ORIGIN}${path}`;
  const imageUrl = `${SITE_ORIGIN}${OG_IMAGE_PATH}`;

  document.title = options.title;
  setNamedMeta("description", options.description);
  setPropertyMeta("og:title", options.title);
  setPropertyMeta("og:description", options.description);
  setPropertyMeta("og:url", url);
  setPropertyMeta("og:image", imageUrl);
  setNamedMeta("twitter:title", options.title);
  setNamedMeta("twitter:description", options.description);
  setNamedMeta("twitter:image", imageUrl);
  setCanonicalLink(url);
}

export function restoreDefaultPageMeta() {
  applyPageMeta({
    title: DEFAULT_PAGE_TITLE,
    description: DEFAULT_PAGE_DESCRIPTION,
    path: "/",
  });
}
