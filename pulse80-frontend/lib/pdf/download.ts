export type PdfClient = { name: string; logoUrl?: string | null };
export type PdfSection = { title: string; lines: string[]; client?: PdfClient };
export type PdfReport = { title: string; subtitle?: string; client?: PdfClient; sections: PdfSection[] };

/** Creates a paginated text report without sending page data to another service. */
export async function createReportPdf(report: PdfReport) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const supported = new Set(regular.getCharacterSet());
  const clean = (text: string) => Array.from(text.normalize("NFC")).map((char) =>
    char === "\n" ? char : supported.has(char.codePointAt(0)!) ? char : "?",
  ).join("");
  const navy = rgb(0.08, 0.17, 0.33);
  const muted = rgb(0.28, 0.33, 0.40);
  let page = pdf.addPage([595.28, 841.89]);
  let y = 770;
  let activeClient = report.client;
  const pageClients: (PdfClient | undefined)[] = [activeClient];
  const newPage = () => {
    page = pdf.addPage([595.28, 841.89]);
    pageClients.push(activeClient);
    y = activeClient ? 710 : 770;
  };
  if (activeClient) y = 710;
  const write = (text: string, size = 11, heading = false) => {
    const font = heading ? bold : regular;
    for (const paragraph of clean(text).split("\n")) {
      let line = "";
      const draw = () => {
        if (y < 65) newPage();
        page.drawText(line, { x: 44, y, size, font, color: heading ? navy : muted });
        y -= size + 6;
        line = "";
      };
      // Wrap even long identifiers and URLs, which may have no spaces.
      for (const word of paragraph.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= 507) { line = candidate; continue; }
        if (line) draw();
        for (const char of word) {
          if (font.widthOfTextAtSize(line + char, size) > 507) draw();
          line += char;
        }
      }
      draw();
    }
  };
  pdf.setTitle(clean(report.title));
  pdf.setAuthor("Pulse80");
  write(report.title, 22, true);
  if (report.subtitle) write(report.subtitle);
  write(`Generated: ${new Date().toISOString().slice(0, 10)}`, 9);
  y -= 14;
  if (!report.sections.length) write("No records match the current filters.");
  for (const section of report.sections) {
    const client = section.client ?? report.client;
    if (client?.name !== activeClient?.name || client?.logoUrl !== activeClient?.logoUrl) {
      activeClient = client;
      newPage();
    }
    if (y < 115) newPage();
    write(section.title, 14, true);
    for (const line of section.lines) write(line);
    y -= 14;
  }
  const pulse80LogoUrl = "/images/pulse80-logo.png";
  const pages = pdf.getPages();
  const logos = new Map<string, Awaited<ReturnType<typeof pdf.embedPng>>>();
  for (const client of pageClients) {
    if (!client?.logoUrl || logos.has(client.logoUrl)) continue;
    const response = await fetch(client.logoUrl, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error("Could not load the client logo.");
    let bytes = new Uint8Array(await response.arrayBuffer());
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
    if (!isJpeg && !isPng) {
      // Uploaded WebP logos are converted to PNG in the browser for PDF embedding.
      const bitmap = await createImageBitmap(new Blob([bytes]));
      try {
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not prepare the client logo.");
        context.drawImage(bitmap, 0, 0);
        bytes = new Uint8Array(await (await fetch(canvas.toDataURL("image/png"))).arrayBuffer());
      } finally { bitmap.close(); }
    }
    logos.set(client.logoUrl, isJpeg ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes));
  }
  let pulse80Logo: Awaited<ReturnType<typeof pdf.embedPng>> | undefined;
  try {
    const response = await fetch(pulse80LogoUrl);
    if (response.ok) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
      pulse80Logo = isJpeg ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
    }
  } catch { /* Text footer remains as a safe fallback. */ }
  pages.forEach((item, index) => {
    const client = pageClients[index];
    if (client) {
      const logo = client.logoUrl ? logos.get(client.logoUrl) : undefined;
      const textX = logo ? 166 : 44;
      if (logo) {
        const size = logo.scaleToFit(104, 52);
        item.drawImage(logo, { x: 44, y: 746 + (52 - size.height) / 2, ...size });
      }
      const name = clean(client.name).replace(/\s+/g, " ");
      if (bold.widthOfTextAtSize(name, 16) <= 551 - textX) {
        item.drawText(name, { x: textX, y: 768, size: 16, font: bold, color: navy });
      } else {
        const lines: string[] = [];
        let line = "";
        for (const char of name) {
          if (bold.widthOfTextAtSize(line + char, 10) > 551 - textX) {
            lines.push(line);
            line = "";
          }
          line += char;
        }
        lines.push(line);
        lines.forEach((text, lineIndex) => item.drawText(text, { x: textX, y: 790 - lineIndex * 13, size: 10, font: bold, color: navy }));
      }
      item.drawLine({ start: { x: 44, y: 735 }, end: { x: 551, y: 735 }, thickness: 0.5, color: muted });
    }
    item.drawText("PULSE80 | Insights", { x: 44, y: 810, size: 9, font: bold, color: navy });
    item.drawLine({ start: { x: 44, y: 48 }, end: { x: 551, y: 48 }, thickness: 0.5, color: muted });
    if (pulse80Logo) {
      const logoSize = pulse80Logo.scaleToFit(62, 20);
      item.drawImage(pulse80Logo, { x: 44, y: 20, ...logoSize });
      item.drawText(`Page ${index + 1} of ${pages.length}`, { x: 490, y: 28, size: 8, font: regular, color: muted });
    } else {
      item.drawText(`Pulse80 | Page ${index + 1} of ${pages.length}`, { x: 44, y: 32, size: 8, font: regular, color: muted });
    }
  });
  return pdf.save();
}

export async function downloadPdf(report: PdfReport) {
  const bytes = await createReportPdf(report);
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "pulse80-report"}.pdf`;
  document.body.appendChild(link);
  try { link.click(); } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
