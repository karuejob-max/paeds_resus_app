import { useEffect } from "react";

const SCRIPT_ID = "page-json-ld";

type JsonLdScriptProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * Injects JSON-LD structured data for the current page.
 * Removed on unmount so route changes do not leave stale schema.
 */
export function JsonLdScript({ data }: JsonLdScriptProps) {
  const serialized = JSON.stringify(data);

  useEffect(() => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.type = "application/ld+json";
    script.textContent = serialized;
    document.head.appendChild(script);

    return () => {
      document.getElementById(SCRIPT_ID)?.remove();
    };
  }, [serialized]);

  return null;
}
