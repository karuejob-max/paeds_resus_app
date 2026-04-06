/**
 * Facility Training Report PDF Generator
 * 
 * Generates professional PDF reports for hospital leadership showing:
 * - Training gaps (conditions not practiced 30/60/90 days)
 * - Staff engagement metrics
 * - Facility benchmarking
 * - Recommended actions
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface TrainingGap {
  condition: string;
  lastPracticed: number;
  staffCount: number;
  riskLevel: 'critical' | 'high' | 'low';
  recommendation: string;
}

interface FacilityEngagement {
  facilityName: string;
  totalStaff: number;
  activeLastWeek: number;
  activeLastMonth: number;
  avgSessionsPerWeek: number;
  avgConditionsPerStaff: number;
  generatedDate: Date;
}

interface FacilityReportData {
  facility: FacilityEngagement;
  gaps: TrainingGap[];
  benchmark: {
    avgSessionsPerWeek: number;
    staffEngagement: number;
    criticalGaps: number;
  };
}

export function generateFacilityReportPDF(data: FacilityReportData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('ResusGPS Training Report', margin, yPosition);
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`${data.facility.facilityName}`, margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.text(`Generated: ${data.facility.generatedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, yPosition);

  // Executive Summary
  yPosition += 15;
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Executive Summary', margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  const summaryText = [
    `Total Staff: ${data.facility.totalStaff}`,
    `Active Last Week: ${data.facility.activeLastWeek} (${Math.round((data.facility.activeLastWeek / data.facility.totalStaff) * 100)}%)`,
    `Avg Sessions/Week: ${data.facility.avgSessionsPerWeek.toFixed(1)}`,
    `Critical Training Gaps: ${data.gaps.filter(g => g.riskLevel === 'critical').length}`,
  ];

  for (const line of summaryText) {
    doc.text(line, margin, yPosition);
    yPosition += 6;
  }

  // Facility Benchmark
  yPosition += 10;
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Facility Benchmark', margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  const benchmarkText = [
    `Your Facility: ${data.facility.avgSessionsPerWeek.toFixed(1)} sessions/week vs ${data.benchmark.avgSessionsPerWeek.toFixed(1)} avg`,
    `Staff Engagement: ${Math.round((data.facility.activeLastWeek / data.facility.totalStaff) * 100)}% vs ${data.benchmark.staffEngagement}% avg`,
    `Critical Gaps: ${data.gaps.filter(g => g.riskLevel === 'critical').length} vs ${data.benchmark.criticalGaps} avg`,
  ];

  for (const line of benchmarkText) {
    doc.text(line, margin, yPosition);
    yPosition += 6;
  }

  // Training Gaps Table
  yPosition += 12;
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Training Gaps Analysis', margin, yPosition);
  
  yPosition += 8;

  // Sort gaps by risk level
  const sortedGaps = [...data.gaps].sort((a, b) => {
    const riskOrder = { critical: 0, high: 1, low: 2 };
    return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
  });

  const tableData = sortedGaps.map(gap => [
    gap.condition,
    `${gap.lastPracticed} days`,
    `${gap.staffCount} staff`,
    gap.riskLevel.toUpperCase(),
    gap.recommendation.substring(0, 30) + '...',
  ]);

  (doc as any).autoTable({
    startY: yPosition,
    head: [['Condition', 'Last Practiced', 'Staff Affected', 'Risk Level', 'Action']],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [200, 16, 46], // ResusGPS red
      textColor: 255,
      fontStyle: 'bold',
    },
    bodyStyles: {
      textColor: 60,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Recommended Actions
  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Recommended Actions', margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  const criticalGaps = data.gaps.filter(g => g.riskLevel === 'critical');
  const highGaps = data.gaps.filter(g => g.riskLevel === 'high');

  if (criticalGaps.length > 0) {
    doc.setFont(undefined, 'bold');
    doc.text('IMMEDIATE (Next 7 Days):', margin, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 6;
    
    for (const gap of criticalGaps) {
      const text = `• Schedule mandatory training for ${gap.condition} (${gap.staffCount} staff affected)`;
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 5 + 2;
    }
  }

  yPosition += 4;

  if (highGaps.length > 0) {
    doc.setFont(undefined, 'bold');
    doc.text('THIS WEEK:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 6;
    
    for (const gap of highGaps.slice(0, 2)) {
      const text = `• Organize group practice session for ${gap.condition}`;
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 5 + 2;
    }
  }

  yPosition += 4;
  doc.setFont(undefined, 'bold');
  doc.text('THIS MONTH:', margin, yPosition);
  doc.setFont(undefined, 'normal');
  yPosition += 6;
  
  const engagementTarget = Math.round((data.facility.activeLastWeek / data.facility.totalStaff) * 100);
  const text = `• Increase staff engagement from ${engagementTarget}% to 75% through streak challenges and facility leaderboards`;
  const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
  doc.text(lines, margin, yPosition);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `ResusGPS Training Analytics | ${new Date().getFullYear()}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate CSV export for facility report
 */
export function generateFacilityReportCSV(data: FacilityReportData): string {
  const lines: string[] = [];

  // Header
  lines.push(`ResusGPS Training Report - ${data.facility.facilityName}`);
  lines.push(`Generated: ${data.facility.generatedDate.toISOString()}`);
  lines.push('');

  // Summary
  lines.push('EXECUTIVE SUMMARY');
  lines.push(`Total Staff,${data.facility.totalStaff}`);
  lines.push(`Active Last Week,${data.facility.activeLastWeek}`);
  lines.push(`Engagement Rate,${Math.round((data.facility.activeLastWeek / data.facility.totalStaff) * 100)}%`);
  lines.push(`Avg Sessions/Week,${data.facility.avgSessionsPerWeek.toFixed(1)}`);
  lines.push('');

  // Gaps
  lines.push('TRAINING GAPS');
  lines.push('Condition,Last Practiced (days),Staff Affected,Risk Level,Recommendation');
  
  for (const gap of data.gaps) {
    lines.push(
      `"${gap.condition}",${gap.lastPracticed},${gap.staffCount},${gap.riskLevel},"${gap.recommendation}"`
    );
  }

  return lines.join('\n');
}
