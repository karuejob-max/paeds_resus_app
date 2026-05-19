/**
 * ExportDocumentsPanel
 *
 * A slide-up sheet inside ResusGPS that lets the provider generate and export:
 *   1. Referral Letter (SBAR-structured inter-facility transfer letter)
 *   2. Nursing Progress Note (SOAPIE + ISBAR handover for cardex / doctor notes)
 *   3. Medical Continuation Note (same engine, medical framing)
 *
 * Each document can be:
 *   - Copied to clipboard (for EHR paste)
 *   - Downloaded as a .txt file (for printing / faxing)
 *
 * Optional context fields (facility name, provider name, patient name/ID, bed)
 * are collected in a lightweight form before generation. All fields are optional
 * — the document generates with placeholder brackets if left blank.
 */

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ClipboardCopy,
  Download,
  CheckCircle2,
  Stethoscope,
  ArrowRightLeft,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ResusSession } from '@/lib/resus/abcdeEngine';
import {
  generateReferralLetter,
  generateProgressNote,
} from '@/lib/resus/clinicalDocuments';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContextFields {
  patientName: string;
  patientId: string;
  bedNumber: string;
  ward: string;
  fromFacility: string;
  toFacility: string;
  providerName: string;
  designation: string;
}

interface ExportDocumentsPanelProps {
  open: boolean;
  onClose: () => void;
  session: ResusSession;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function downloadTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate a print-ready PDF from plain text using the browser's print dialog.
 * This is fully offline — no server call, no library required.
 * The provider can print to PDF or to a physical printer/fax.
 */
function printAsPdf(content: string, title: string) {
  const printWindow = window.open('', '_blank', 'width=794,height=1123');
  if (!printWindow) {
    toast.error('Pop-up blocked — allow pop-ups and try again');
    return;
  }
  const lines = content.split('\n').map(line => {
    if (line.startsWith('═')) return `<hr style="border:2px solid #000;margin:8px 0">`;
    if (line.startsWith('──')) return `<h3 style="font-size:11pt;font-weight:bold;margin:12px 0 4px;border-bottom:1px solid #ccc;padding-bottom:2px">${line.replace(/^──\s*/, '').replace(/\s*──$/, '')}</h3>`;
    if (line.trim() === '') return '<br>';
    return `<p style="margin:2px 0;font-size:10pt">${line.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`;
  }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page { size: A4; margin: 20mm 15mm; }
        body { font-family: 'Times New Roman', serif; font-size: 10pt; color: #000; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      ${lines}
      <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }<\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function copyToClipboard(content: string, label: string) {
  navigator.clipboard.writeText(content).then(
    () => toast.success(`${label} copied to clipboard`),
    () => toast.error('Could not copy — use Download instead')
  );
}

// ─── Context Form ─────────────────────────────────────────────────────────────

function ContextForm({
  fields,
  onChange,
  mode,
}: {
  fields: ContextFields;
  onChange: (f: Partial<ContextFields>) => void;
  mode: 'referral' | 'nursing' | 'medical';
}) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="col-span-2 space-y-1">
        <Label htmlFor="patientName">Patient Name</Label>
        <Input
          id="patientName"
          placeholder="e.g. Baby Kamau"
          value={fields.patientName}
          onChange={(e) => onChange({ patientName: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="patientId">IP / OP Number</Label>
        <Input
          id="patientId"
          placeholder="e.g. 00123456"
          value={fields.patientId}
          onChange={(e) => onChange({ patientId: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="bedNumber">Bed Number</Label>
        <Input
          id="bedNumber"
          placeholder="e.g. Bed 4"
          value={fields.bedNumber}
          onChange={(e) => onChange({ bedNumber: e.target.value })}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <Label htmlFor="providerName">
          {mode === 'referral' ? 'Referring Provider Name' : 'Your Name'}
        </Label>
        <Input
          id="providerName"
          placeholder="e.g. Sr. Akinyi / Dr. Omondi"
          value={fields.providerName}
          onChange={(e) => onChange({ providerName: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="designation">Designation</Label>
        <Input
          id="designation"
          placeholder="e.g. RN / MO / CO"
          value={fields.designation}
          onChange={(e) => onChange({ designation: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ward">Ward / Unit</Label>
        <Input
          id="ward"
          placeholder="e.g. Paeds Ward"
          value={fields.ward}
          onChange={(e) => onChange({ ward: e.target.value })}
        />
      </div>
      {mode === 'referral' && (
        <>
          <div className="space-y-1">
            <Label htmlFor="fromFacility">From Facility</Label>
            <Input
              id="fromFacility"
              placeholder="e.g. Kiambu County Hospital"
              value={fields.fromFacility}
              onChange={(e) => onChange({ fromFacility: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="toFacility">To Facility</Label>
            <Input
              id="toFacility"
              placeholder="e.g. KNH / Gertrude's"
              value={fields.toFacility}
              onChange={(e) => onChange({ toFacility: e.target.value })}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Document Preview ─────────────────────────────────────────────────────────

function DocumentPreview({
  content,
  label,
  filename,
}: {
  content: string;
  label: string;
  filename: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5"
          onClick={() => copyToClipboard(content, label)}
        >
          <ClipboardCopy className="h-3.5 w-3.5" />
          Copy to Clipboard
        </Button>
        <Button
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => {
            downloadTxt(content, filename);
            toast.success(`${label} downloaded`);
          }}
        >
          <Download className="h-3.5 w-3.5" />
          Download .txt
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="flex-1 gap-1.5"
          onClick={() => printAsPdf(content, label)}
          title="Print or save as PDF"
        >
          <FileText className="h-3.5 w-3.5" />
          Print / PDF
        </Button>
      </div>
      <Textarea
        readOnly
        value={content}
        className="font-mono text-xs h-80 resize-none bg-muted/40 border-muted"
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExportDocumentsPanel({
  open,
  onClose,
  session,
}: ExportDocumentsPanelProps) {
  const [fields, setFields] = useState<ContextFields>({
    patientName: '',
    patientId: '',
    bedNumber: '',
    ward: '',
    fromFacility: '',
    toFacility: '',
    providerName: '',
    designation: '',
  });

  const [activeTab, setActiveTab] = useState<'referral' | 'nursing' | 'medical'>('referral');
  const [generated, setGenerated] = useState<Record<string, string>>({});

  const updateFields = (partial: Partial<ContextFields>) =>
    setFields((prev) => ({ ...prev, ...partial }));

  const generate = (type: 'referral' | 'nursing' | 'medical') => {
    let doc = '';
    if (type === 'referral') {
      doc = generateReferralLetter(session, {
        fromFacility: fields.fromFacility || undefined,
        toFacility: fields.toFacility || undefined,
        fromProvider: fields.providerName
          ? `${fields.providerName}${fields.designation ? ' (' + fields.designation + ')' : ''}`
          : undefined,
        patientName: fields.patientName || undefined,
        patientId: fields.patientId || undefined,
      });
    } else {
      doc = generateProgressNote(session, {
        nurseName: fields.providerName || undefined,
        designation: fields.designation || undefined,
        ward: fields.ward || undefined,
        patientName: fields.patientName || undefined,
        patientId: fields.patientId || undefined,
        bedNumber: fields.bedNumber || undefined,
        noteType: type === 'medical' ? 'medical' : 'nursing',
      });
    }
    setGenerated((prev) => ({ ...prev, [type]: doc }));
  };

  const tabConfig = {
    referral: {
      icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
      label: 'Referral Letter',
      description: 'SBAR inter-facility transfer letter',
      filename: `referral-letter-${new Date().toISOString().slice(0, 10)}.txt`,
    },
    nursing: {
      icon: <Stethoscope className="h-3.5 w-3.5" />,
      label: 'Nursing Progress Note',
      description: 'SOAPIE note for cardex / handover',
      filename: `nursing-progress-note-${new Date().toISOString().slice(0, 10)}.txt`,
    },
    medical: {
      icon: <BookOpen className="h-3.5 w-3.5" />,
      label: 'Medical Continuation Note',
      description: "Doctor's continuation note",
      filename: `medical-continuation-note-${new Date().toISOString().slice(0, 10)}.txt`,
    },
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[92vh] overflow-y-auto rounded-t-2xl px-4 pb-8"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Clinical Documents
          </SheetTitle>
          <SheetDescription className="text-xs">
            Pre-filled from this ResusGPS session. Fill in optional context fields then
            generate, copy, or download.
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-3 w-full h-auto">
            {(Object.keys(tabConfig) as Array<keyof typeof tabConfig>).map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex flex-col gap-0.5 py-2 text-[11px] leading-tight h-auto"
              >
                {tabConfig[key].icon}
                <span>{tabConfig[key].label}</span>
                {generated[key] && (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(tabConfig) as Array<keyof typeof tabConfig>).map((key) => (
            <TabsContent key={key} value={key} className="space-y-4 mt-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-normal">
                  {tabConfig[key].description}
                </Badge>
              </div>

              {/* Context form */}
              <ContextForm
                fields={fields}
                onChange={updateFields}
                mode={key}
              />

              {/* Generate button */}
              <Button
                className="w-full gap-2"
                onClick={() => generate(key)}
              >
                <FileText className="h-4 w-4" />
                Generate {tabConfig[key].label}
              </Button>

              {/* Preview + export */}
              {generated[key] && (
                <DocumentPreview
                  content={generated[key]}
                  label={tabConfig[key].label}
                  filename={tabConfig[key].filename}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
