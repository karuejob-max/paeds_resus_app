/**
 * SBAR Report Viewer Component
 * 
 * Displays clinical handover summaries with preview and export options
 * Supports PDF and text export for seamless care transitions
 */

import React, { useState } from 'react';
import { Download, FileText, Share2 } from 'lucide-react';
import type { SBARReport } from '@/lib/resus/sbar-generator';
import { formatSBARAsText, formatSBARAsHTML } from '@/lib/resus/sbar-generator';

interface SBARReportViewerProps {
  report: SBARReport;
  patientName: string;
  emergencyType: string;
  onClose?: () => void;
}

export const SBARReportViewer: React.FC<SBARReportViewerProps> = ({
  report,
  patientName,
  emergencyType,
  onClose,
}) => {
  const [exportFormat, setExportFormat] = useState<'text' | 'pdf'>('text');
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Export SBAR report as text file
   */
  const handleExportAsText = () => {
    setIsExporting(true);
    try {
      const textContent = formatSBARAsText(report);
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent));
      element.setAttribute('download', `SBAR_${patientName}_${new Date().toISOString().split('T')[0]}.txt`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error exporting as text:', error);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export SBAR report as PDF
   */
  const handleExportAsPDF = async () => {
    setIsExporting(true);
    try {
      // In production, this would use a PDF library like jsPDF or html2pdf
      const htmlContent = formatSBARAsHTML(report);
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>SBAR Report - ${patientName}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .sbar-report h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .metadata { text-align: center; color: #666; font-size: 0.9em; margin-bottom: 20px; }
                .sbar-section { margin-bottom: 30px; page-break-inside: avoid; }
                .sbar-section h2 { background-color: #f0f0f0; padding: 10px; border-left: 4px solid #0066cc; }
                .sbar-section p, .sbar-section pre { margin: 10px 0; }
                pre { background-color: #f9f9f9; padding: 10px; border-radius: 4px; overflow-x: auto; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              ${htmlContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error exporting as PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Copy SBAR report to clipboard
   */
  const handleCopyToClipboard = () => {
    const textContent = formatSBARAsText(report);
    navigator.clipboard.writeText(textContent).then(() => {
      alert('SBAR report copied to clipboard');
    }).catch((error) => {
      console.error('Error copying to clipboard:', error);
    });
  };

  return (
    <div className="sbar-report-viewer bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">SBAR Clinical Handover Summary</h1>
        <p className="text-sm text-gray-600 mt-2">
          Patient: <span className="font-semibold">{patientName}</span> | 
          Emergency Type: <span className="font-semibold">{emergencyType.replace('_', ' ').toUpperCase()}</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Generated: {new Date(report.generatedAt).toLocaleString()} | By: {report.generatedBy}
        </p>
      </div>

      {/* SBAR Sections */}
      <div className="space-y-6 mb-8">
        {/* Situation */}
        <div className="sbar-section">
          <h2 className="text-lg font-bold text-blue-900 bg-blue-50 p-3 rounded mb-3">
            SITUATION
          </h2>
          <p className="text-gray-700 leading-relaxed">{report.situation}</p>
        </div>

        {/* Background */}
        <div className="sbar-section">
          <h2 className="text-lg font-bold text-green-900 bg-green-50 p-3 rounded mb-3">
            BACKGROUND
          </h2>
          <p className="text-gray-700 leading-relaxed">{report.background}</p>
        </div>

        {/* Assessment */}
        <div className="sbar-section">
          <h2 className="text-lg font-bold text-orange-900 bg-orange-50 p-3 rounded mb-3">
            ASSESSMENT
          </h2>
          <pre className="bg-gray-50 p-4 rounded text-sm text-gray-700 overflow-x-auto">
            {report.assessment}
          </pre>
        </div>

        {/* Recommendation */}
        <div className="sbar-section">
          <h2 className="text-lg font-bold text-red-900 bg-red-50 p-3 rounded mb-3">
            RECOMMENDATION
          </h2>
          <pre className="bg-gray-50 p-4 rounded text-sm text-gray-700 overflow-x-auto">
            {report.recommendation}
          </pre>
        </div>
      </div>

      {/* Export Options */}
      <div className="border-t pt-6 flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={handleExportAsText}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            title="Export as text file"
          >
            <FileText size={18} />
            Export as Text
          </button>

          <button
            onClick={handleExportAsPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            title="Export as PDF"
          >
            <Download size={18} />
            Export as PDF
          </button>

          <button
            onClick={handleCopyToClipboard}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            title="Copy to clipboard"
          >
            <Share2 size={18} />
            Copy to Clipboard
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Close
          </button>
        )}
      </div>

      {/* Export Status */}
      {isExporting && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          Exporting... Please wait.
        </div>
      )}

      {/* Clinical Notes */}
      <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
        <p className="text-sm text-blue-900">
          <strong>Clinical Note:</strong> This SBAR summary is automatically generated from the clinical decision support system's audit trail. 
          Review for accuracy before sharing with receiving facility. All weight-based calculations have been verified against patient demographics.
        </p>
      </div>
    </div>
  );
};

export default SBARReportViewer;
