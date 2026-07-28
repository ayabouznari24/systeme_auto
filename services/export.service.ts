import { Parser as CsvParser } from "json2csv";
import PDFDocument from "pdfkit";
import type { Email } from "@prisma/client";
import { CATEGORY_META } from "@/lib/constants";

export function emailsToCsv(emails: Email[]): string {
  const parser = new CsvParser({
    fields: [
      { label: "Date", value: (e: Email) => e.receivedAt.toISOString() },
      { label: "Expéditeur", value: (e: Email) => e.fromName ?? e.fromAddress },
      { label: "Email", value: "fromAddress" },
      { label: "Sujet", value: "subject" },
      { label: "Catégorie", value: (e: Email) => (e.category ? CATEGORY_META[e.category].label : "") },
      { label: "Score", value: "priorityScore" },
      { label: "Sentiment", value: "sentiment" },
      { label: "Action recommandée", value: "recommendedAction" },
      { label: "Résumé", value: (e: Email) => e.summary?.replace(/\n/g, " | ") ?? "" },
      { label: "Traité", value: (e: Email) => (e.isProcessed ? "Oui" : "Non") },
    ],
  });
  return parser.parse(emails);
}

export function emailsToPdf(emails: Email[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Mail Intelligence — Export", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#555").text(`Généré le ${new Date().toLocaleString("fr-FR")}`);
    doc.moveDown();

    emails.forEach((email, index) => {
      if (index > 0) doc.moveDown(0.75);
      const meta = email.category ? CATEGORY_META[email.category] : undefined;

      doc
        .fillColor("#111")
        .fontSize(12)
        .text(`${meta?.emoji ?? ""} ${email.subject}`, { continued: false });
      doc
        .fontSize(9)
        .fillColor("#555")
        .text(
          `${email.fromName ?? email.fromAddress}  •  ${email.receivedAt.toLocaleString("fr-FR")}  •  Score: ${email.priorityScore ?? "-"}  •  ${meta?.label ?? ""}`
        );
      if (email.summary) {
        doc.moveDown(0.25).fontSize(9).fillColor("#222").text(email.summary);
      }
      if (index < emails.length - 1) {
        doc.moveDown(0.25);
        doc
          .strokeColor("#ddd")
          .moveTo(doc.x, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .stroke();
      }
    });

    doc.end();
  });
}
