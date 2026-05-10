import DOMPurify from 'dompurify';

/**
 * Sanitize HTML before `dangerouslySetInnerHTML`.
 * Course content is treated as trusted-ish after this pass; admin/AI-generated HTML
 * must still go through this layer (Codex audit: XSS policy).
 */
const SANITIZE_CONFIG = {
  USE_PROFILES: { html: true },
  RETURN_TRUSTED_TYPE: false as const,
};

export function sanitizeCourseHtml(html: string): string {
  if (!html?.trim()) return '';
  return DOMPurify.sanitize(html, SANITIZE_CONFIG) as string;
}
