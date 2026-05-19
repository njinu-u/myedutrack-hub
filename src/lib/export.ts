import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

export type PdfSection =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "table"; head: string[]; body: (string | number)[][] };

export function downloadPdf(filename: string, title: string, sections: PdfSection[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, margin, y);
  y += 24;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, margin, y);
  y += 20;
  doc.setTextColor(20);

  for (const s of sections) {
    if (y > 760) { doc.addPage(); y = margin; }
    if (s.type === "heading") {
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text(s.text, margin, y); y += 18;
    } else if (s.type === "paragraph") {
      doc.setFont("helvetica", "normal"); doc.setFontSize(11);
      const lines = doc.splitTextToSize(s.text, 515);
      doc.text(lines, margin, y); y += lines.length * 14 + 8;
    } else {
      autoTable(doc, {
        head: [s.head], body: s.body, startY: y,
        styles: { fontSize: 9 }, headStyles: { fillColor: [15, 23, 42] },
        margin: { left: margin, right: margin },
      });
      // @ts-expect-error lastAutoTable attached by plugin
      y = (doc.lastAutoTable?.finalY ?? y) + 16;
    }
  }

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
