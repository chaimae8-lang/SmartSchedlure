// utils/export.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ==================== CSV EXPORT ==================== */
export function exportScheduleCSV(slots) {
  if (!slots || slots.length === 0) {
    alert("Aucune donnée à exporter");
    return;
  }

  const rows = [
    ['Classe', 'Matière', 'Enseignant', 'Salle', 'Jour', 'Période']
  ];

  slots.forEach((s) => {
    rows.push([
      s.class_name || s.class_id,
      s.subject?.code || s.subject?.name || s.subject_id,
      `${s.teacher?.first_name || ''} ${s.teacher?.last_name || ''}`.trim() || '-',
      s.room?.name || s.room_id || '-',
      s.day,
      s.period
    ]);
  });

  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(',')
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `emploi-du-temps-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ==================== PDF EXPORT ==================== */
export async function exportSchedulePDF(slots, filter = 'all') {
  if (!slots || slots.length === 0) {
    alert("Aucune donnée à exporter");
    return;
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("EMPLOI DU TEMPS", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Généré le ${new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}`,
    pageWidth / 2,
    26,
    { align: "center" }
  );

  if (filter !== 'all') {
    doc.text(`Filtre : Classe ${filter}`, pageWidth / 2, 33, { align: "center" });
  }

  // Table
  const headers = ["Jour", "Période", "Matière", "Enseignant", "Classe", "Salle"];
  const colWidths = [28, 18, 45, 48, 35, 35];
  let y = 45;

  // Table Header
  doc.setFillColor(30, 58, 138); // Blue-800
  doc.rect(12, y - 8, pageWidth - 24, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");

  let x = 12;
  headers.forEach((header, i) => {
    doc.text(header, x + 3, y - 1.5);
    x += colWidths[i];
  });

  // Table Rows
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  slots.forEach((slot) => {
    if (y > 190) {
      doc.addPage();
      y = 20;
    }

    x = 12;
    const rowData = [
      slot.day,
      `P${slot.period}`,
      slot.subject?.name || slot.subject?.code || '-',
      `${slot.teacher?.first_name || ''} ${slot.teacher?.last_name || ''}`.trim() || '-',
      slot.class_name || slot.class_id || '-',
      slot.room?.name || slot.room_id || '-'
    ];

    rowData.forEach((text, i) => {
      const maxWidth = colWidths[i] - 6;
      const lines = doc.splitTextToSize(String(text), maxWidth);
      doc.text(lines, x + 3, y + 5);
      x += colWidths[i];
    });

    y += 9;
  });

  // Footer
  doc.setFontSize(8);
  doc.text("Smart Scheduler ", pageWidth - 20, 200, { align: "right" });

  const filename = `emploi-du-temps-${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
}