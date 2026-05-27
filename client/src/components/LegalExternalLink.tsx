import type { ReactNode } from "react";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

/** Opens legal documents in a new tab without toggling parent checkboxes or closing consent dialogs. */
export function LegalExternalLink({ href, className, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </a>
  );
}
