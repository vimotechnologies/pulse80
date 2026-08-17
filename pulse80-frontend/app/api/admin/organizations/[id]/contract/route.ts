import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { loadAdminOrganisation } from "@/app/actions/admin-organisations";

export const dynamic = "force-dynamic";

function safeFilename(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value || "Not specified"
    : new Intl.DateTimeFormat("en-BW", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export async function GET(
  _request: Request,
  context: RouteContext<"/api/admin/organizations/[id]/contract">,
) {
  const { id } = await context.params;
  const organisation = await loadAdminOrganisation(id);
  if (!organisation) return Response.json({ error: "Contract not found." }, { status: 404 });

  const document = await PDFDocument.create();
  const page = document.addPage([595.28, 841.89]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const logoBytes = await readFile(path.join(process.cwd(), "public", "brand", "pulse80-logo-full.png"));
  const logo = await document.embedPng(logoBytes);
  const navy = rgb(20 / 255, 43 / 255, 83 / 255);
  const red = rgb(186 / 255, 19 / 255, 37 / 255);
  const muted = rgb(71 / 255, 84 / 255, 103 / 255);

  page.drawImage(logo, { x: 42, y: 730, width: 210, height: 87.5 });
  page.drawText("ORGANISATION SERVICE CONTRACT", { x: 42, y: 690, size: 18, font: bold, color: navy });
  page.drawRectangle({ x: 42, y: 676, width: 511, height: 3, color: red });

  page.drawText(organisation.name, { x: 42, y: 638, size: 20, font: bold, color: navy });
  page.drawText(`Reference: ${organisation.code}`, { x: 42, y: 617, size: 10, font: regular, color: muted });

  const rows = [
    ["Industry", organisation.industry],
    ["Primary location", `${organisation.primaryLocation}, ${organisation.region}, ${organisation.country}`],
    ["Workforce size", organisation.employees.toLocaleString("en-BW")],
    ["Wellness package", organisation.package],
    ["Contract start", formatDate(organisation.contractStart)],
    ["Contract end", formatDate(organisation.contractEnd)],
    ["Organisation status", organisation.status],
  ];

  let y = 570;
  for (const [label, value] of rows) {
    page.drawText(label!, { x: 42, y, size: 10, font: bold, color: navy });
    page.drawText(value || "Not specified", { x: 205, y, size: 10, font: regular, color: muted, maxWidth: 340 });
    page.drawLine({ start: { x: 42, y: y - 10 }, end: { x: 553, y: y - 10 }, thickness: 0.5, color: rgb(0.88, 0.9, 0.93) });
    y -= 42;
  }

  page.drawText("Primary contact", { x: 42, y: 255, size: 12, font: bold, color: navy });
  const contact = organisation.contacts.find((item) => item.primary) ?? organisation.contacts[0];
  page.drawText(contact ? `${contact.name} | ${contact.roleLabel} | ${contact.email}` : "No primary contact recorded", {
    x: 42, y: 234, size: 9, font: regular, color: muted, maxWidth: 511,
  });

  if (organisation.customPackageNotes) {
    page.drawText("Package notes", { x: 42, y: 196, size: 12, font: bold, color: navy });
    page.drawText(organisation.customPackageNotes, { x: 42, y: 176, size: 9, font: regular, color: muted, maxWidth: 511, lineHeight: 13 });
  }

  page.drawLine({ start: { x: 42, y: 70 }, end: { x: 553, y: 70 }, thickness: 0.5, color: rgb(0.82, 0.85, 0.89) });
  page.drawText("Pulse80 Insights | Workplace wellness insights reimagined", { x: 42, y: 50, size: 8, font: regular, color: muted });
  page.drawText("Page 1 of 1", { x: 490, y: 50, size: 8, font: regular, color: muted });

  const bytes = await document.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${safeFilename(organisation.name)}-contract.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
