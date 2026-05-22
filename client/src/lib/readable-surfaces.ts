/**
 * Readable text/background tokens for marketing and form surfaces.
 * Avoid: horizontal gradients to white, translucent alert washes, faint hero blues (text-blue-100).
 */

/** Body copy on light mint / white page backgrounds */
export const PAGE_BODY_MUTED = "text-slate-700 dark:text-slate-300";

/** Small section labels above widgets */
export const PAGE_SECTION_KICKER =
  "text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400";

/** Card header without a fade-to-white wash */
export const CARD_HEADER_SURFACE = "border-b border-border bg-brand-surface dark:bg-card";

/** Hero badges on teal/dark gradients */
export const HERO_BADGE =
  "border-white/50 bg-white/15 text-white shadow-sm [&_svg]:text-white";

/** Solid informational alerts (opaque background) */
export const ALERT_AMBER_SOLID =
  "border-amber-300 bg-amber-50 shadow-sm dark:border-amber-800 dark:bg-amber-950/60 [&_[data-slot=alert-title]]:text-amber-950 [&_[data-slot=alert-title]]:dark:text-amber-100 [&_[data-slot=alert-description]]:text-amber-950 [&_[data-slot=alert-description]]:dark:text-amber-100";

export const ALERT_EMERALD_SOLID =
  "border-emerald-300 bg-emerald-50 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/60 [&_[data-slot=alert-title]]:text-emerald-950 [&_[data-slot=alert-title]]:dark:text-emerald-100 [&_[data-slot=alert-description]]:text-emerald-950 [&_[data-slot=alert-description]]:dark:text-emerald-100";

/** Info banner — no fade to transparent */
export const BANNER_INFO_SOLID =
  "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/40";

/** Subtle tinted card (opaque) */
export const CARD_TINT_AMBER = "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30";

/** Hero subtitle on dark gradient bands */
export const HERO_SUBTITLE = "text-white/95";
