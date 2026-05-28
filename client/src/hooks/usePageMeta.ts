import { useEffect } from "react";
import { applyPageMeta, restoreDefaultPageMeta } from "@/lib/site-meta";

type PageMetaOptions = {
  title: string;
  description: string;
  /** Path segment for canonical/og:url (defaults to current pathname). */
  path?: string;
  /** e.g. `noindex, nofollow` for thank-you / conversion pages. */
  robots?: string;
};

/**
 * Updates document title and meta tags for the current route.
 * Restores index.html defaults on unmount.
 */
export function usePageMeta({ title, description, path, robots }: PageMetaOptions) {
  useEffect(() => {
    applyPageMeta({ title, description, path, robots });
    return restoreDefaultPageMeta;
  }, [title, description, path, robots]);
}
