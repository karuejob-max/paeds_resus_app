import { useEffect } from "react";
import { applyPageMeta, restoreDefaultPageMeta } from "@/lib/site-meta";

type PageMetaOptions = {
  title: string;
  description: string;
  /** Path segment for canonical/og:url (defaults to current pathname). */
  path?: string;
};

/**
 * Updates document title and meta tags for the current route.
 * Restores index.html defaults on unmount.
 */
export function usePageMeta({ title, description, path }: PageMetaOptions) {
  useEffect(() => {
    applyPageMeta({ title, description, path });
    return restoreDefaultPageMeta;
  }, [title, description, path]);
}
