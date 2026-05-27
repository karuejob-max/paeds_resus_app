export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: { title: string; paragraphs?: string[]; bullets?: string[] }[];
};

export type LegalDocumentMeta = {
  title: string;
  version: string;
  lastUpdated: string;
  intro?: string;
  sections: LegalSection[];
};
