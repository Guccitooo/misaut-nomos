import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Carga una imagen URL como base64 para insertarla en el PDF
async function loadImageAsBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Genera el PDF de forma asíncrona (soporta logo)
export async function generateQuotePDFAsync(quote) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Logo del profesional ─────────────────────────────────
  let logoLoaded = false;
  if (quote.emisor_logo_url) {
    try {
      const logoData = await loadImageAsBase64(quote.emisor_logo_url);
      if (logoData) {
        // Insertar logo en esquina superior derecha, máx 35x20mm
        doc.addImage(logoData, 'JPEG', pageWidth - 50, 10, 36, 20, undefined, 'FAST');
        logoLoaded = true;
      }
    } catch { /* sin logo */ }
  }

  // ── Header: título + número ──────────────────────────────
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.setFont(undefined, 'bold');
  doc.text('PRESUPUESTO', 14, 22);
  doc.setFont(undefined, 'normal');

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  if (quote.quote_number) doc.text(`Nº ${quote.quote_number}`, 14, 29);
  const issueDate = quote.issue_date ? new Date(quote.issue_date).toLocaleDateString('es-ES') : '';
  const validDate = quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('es-ES') : '';
  if (issueDate) doc.text(`Fecha: ${issueDate}`, 14, 35);
  if (validDate) doc.text(`Válido hasta: ${validDate}`, 14, 41);

  // ── Datos emisor (derecha, debajo del logo si existe) ────
  const emisorY = logoLoaded ? 34 : 22;
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.setFont(undefined, 'bold');
  doc.text(quote.emisor_razon_social || '', pageWidth - 14, emisorY, { align: 'right' });
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  let eY = emisorY + 6;
  if (quote.emisor_nif) { doc.text(`NIF: ${quote.emisor_nif}`, pageWidth - 14, eY, { align: 'right' }); eY += 5; }
  if (quote.emisor_direccion) { doc.text(quote.emisor_direccion, pageWidth - 14, eY, { align: 'right' }); eY += 5; }
  if (quote.emisor_telefono) { doc.text(`Tel: ${quote.emisor_telefono}`, pageWidth - 14, eY, { align: 'right' }); eY += 5; }
  if (quote.emisor_email) { doc.text(quote.emisor_email, pageWidth - 14, eY, { align: 'right' }); }

  // ── Línea separadora ────────────────────────────────────
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 52, pageWidth - 14, 52);

  // ── Datos cliente (caja) ────────────────────────────────
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(14, 56, pageWidth - 28, 30, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('FACTURAR A:', 18, 63);
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.setFont(undefined, 'bold');
  doc.text(quote.client_name || '', 18, 70);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  let clientY = 76;
  if (quote.client_nif) { doc.text(`NIF: ${quote.client_nif}`, 18, clientY); clientY += 5; }
  if (quote.client_email) { doc.text(quote.client_email, 18, clientY); clientY += 5; }
  if (quote.client_address) { doc.text(quote.client_address, 18, clientY); }

  // ── Título y descripción ─────────────────────────────────
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.setFont(undefined, 'bold');
  doc.text(quote.title || '', 14, 96);
  doc.setFont(undefined, 'normal');
  let descY = 102;
  if (quote.description) {
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(quote.description, pageWidth - 28);
    doc.text(lines, 14, descY);
    descY += lines.length * 5 + 2;
  }

  // ── Tabla de items ───────────────────────────────────────
  const tableStartY = Math.max(descY + 4, 108);
  const tableBody = (quote.items || []).map(item => [
    item.concept || '',
    item.unit ? `${item.quantity || 0} ${item.unit}` : String(item.quantity || 0),
    `${parseFloat(item.unit_price || 0).toFixed(2)}€`,
    item.discount_percent ? `${item.discount_percent}%` : '-',
    `${item.iva_percent ?? 21}%`,
    `${parseFloat(item.total || 0).toFixed(2)}€`
  ]);

  doc.autoTable({
    startY: tableStartY,
    head: [['Concepto', 'Cantidad', 'Precio unit.', 'Dto.', 'IVA', 'Total']],
    body: tableBody,
    theme: 'plain',
    headStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    styles: { cellPadding: 3 },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // ── Totales ──────────────────────────────────────────────
  let y = doc.lastAutoTable.finalY + 8;
  const rightX = pageWidth - 14;
  const labelX = pageWidth - 65;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  doc.text('Subtotal:', labelX, y);
  doc.text(`${parseFloat(quote.subtotal || 0).toFixed(2)}€`, rightX, y, { align: 'right' });
  y += 6;

  doc.text('IVA:', labelX, y);
  doc.text(`${parseFloat(quote.total_iva || 0).toFixed(2)}€`, rightX, y, { align: 'right' });
  y += 6;

  if (quote.aplica_retencion) {
    doc.text(`Retención IRPF (${quote.porcentaje_retencion}%):`, labelX, y);
    doc.text(`-${parseFloat(quote.total_retencion || 0).toFixed(2)}€`, rightX, y, { align: 'right' });
    y += 6;
  }

  doc.setDrawColor(30, 30, 30);
  doc.line(labelX, y, rightX, y);
  y += 6;

  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL:', labelX, y);
  doc.text(`${parseFloat(quote.total || 0).toFixed(2)}€`, rightX, y, { align: 'right' });
  doc.setFont(undefined, 'normal');

  // ── Condiciones y texto legal ────────────────────────────
  y += 12;
  if (quote.payment_conditions) {
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.setFont(undefined, 'bold');
    doc.text('Condiciones de pago:', 14, y);
    doc.setFont(undefined, 'normal');
    y += 5;
    doc.setTextColor(80, 80, 80);
    const condLines = doc.splitTextToSize(quote.payment_conditions, pageWidth - 28);
    doc.text(condLines, 14, y);
    y += condLines.length * 4 + 4;
  }

  if (quote.notes) {
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.setFont(undefined, 'bold');
    doc.text('Notas:', 14, y);
    doc.setFont(undefined, 'normal');
    y += 5;
    doc.setTextColor(80, 80, 80);
    const noteLines = doc.splitTextToSize(quote.notes, pageWidth - 28);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 4 + 4;
  }

  if (quote.legal_text) {
    y += 4;
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    const legalLines = doc.splitTextToSize(quote.legal_text, pageWidth - 28);
    doc.text(legalLines, 14, y);
    y += legalLines.length * 4 + 4;
  }

  // ── Firma digital (si aceptado) ──────────────────────────
  if (quote.client_signature) {
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.setFont(undefined, 'bold');
    doc.text('Firma digital del cliente:', 14, y);
    doc.setFont(undefined, 'normal');
    y += 5;
    doc.text(quote.client_signature, 14, y);
    if (quote.client_signature_date) {
      y += 4;
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(7.5);
      doc.text(`Aceptado el ${new Date(quote.client_signature_date).toLocaleString('es-ES')}`, 14, y);
    }
  }

  return doc;
}

// Versión síncrona (sin logo) — compatibilidad con código existente
export function generateQuotePDF(quote) {
  // Reutiliza la misma lógica sin el await del logo
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.setFont(undefined, 'bold');
  doc.text('PRESUPUESTO', 14, 22);
  doc.setFont(undefined, 'normal');

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  if (quote.quote_number) doc.text(`Nº ${quote.quote_number}`, 14, 29);
  const issueDate = quote.issue_date ? new Date(quote.issue_date).toLocaleDateString('es-ES') : '';
  const validDate = quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('es-ES') : '';
  if (issueDate) doc.text(`Fecha: ${issueDate}`, 14, 35);
  if (validDate) doc.text(`Válido hasta: ${validDate}`, 14, 41);

  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.setFont(undefined, 'bold');
  doc.text(quote.emisor_razon_social || '', pageWidth - 14, 22, { align: 'right' });
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  if (quote.emisor_nif) doc.text(`NIF: ${quote.emisor_nif}`, pageWidth - 14, 28, { align: 'right' });
  if (quote.emisor_direccion) doc.text(quote.emisor_direccion, pageWidth - 14, 34, { align: 'right' });
  if (quote.emisor_telefono) doc.text(`Tel: ${quote.emisor_telefono}`, pageWidth - 14, 40, { align: 'right' });
  if (quote.emisor_email) doc.text(quote.emisor_email, pageWidth - 14, 46, { align: 'right' });

  doc.setDrawColor(220, 220, 220);
  doc.line(14, 52, pageWidth - 14, 52);

  doc.setFillColor(248, 248, 248);
  doc.roundedRect(14, 56, pageWidth - 28, 30, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('FACTURAR A:', 18, 63);
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.setFont(undefined, 'bold');
  doc.text(quote.client_name || '', 18, 70);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  let clientY = 76;
  if (quote.client_nif) { doc.text(`NIF: ${quote.client_nif}`, 18, clientY); clientY += 5; }
  if (quote.client_email) { doc.text(quote.client_email, 18, clientY); clientY += 5; }
  if (quote.client_address) { doc.text(quote.client_address, 18, clientY); }

  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.setFont(undefined, 'bold');
  doc.text(quote.title || '', 14, 96);
  doc.setFont(undefined, 'normal');
  let descY = 102;
  if (quote.description) {
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(quote.description, pageWidth - 28);
    doc.text(lines, 14, descY);
    descY += lines.length * 5 + 2;
  }

  const tableStartY = Math.max(descY + 4, 108);
  const tableBody = (quote.items || []).map(item => [
    item.concept || '',
    item.unit ? `${item.quantity || 0} ${item.unit}` : String(item.quantity || 0),
    `${parseFloat(item.unit_price || 0).toFixed(2)}€`,
    item.discount_percent ? `${item.discount_percent}%` : '-',
    `${item.iva_percent ?? 21}%`,
    `${parseFloat(item.total || 0).toFixed(2)}€`
  ]);

  doc.autoTable({
    startY: tableStartY,
    head: [['Concepto', 'Cantidad', 'Precio unit.', 'Dto.', 'IVA', 'Total']],
    body: tableBody,
    theme: 'plain',
    headStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    styles: { cellPadding: 3 },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'right', fontStyle: 'bold' } }
  });

  let y = doc.lastAutoTable.finalY + 8;
  const rightX = pageWidth - 14;
  const labelX = pageWidth - 65;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotal:', labelX, y);
  doc.text(`${parseFloat(quote.subtotal || 0).toFixed(2)}€`, rightX, y, { align: 'right' });
  y += 6;
  doc.text('IVA:', labelX, y);
  doc.text(`${parseFloat(quote.total_iva || 0).toFixed(2)}€`, rightX, y, { align: 'right' });
  y += 6;
  if (quote.aplica_retencion) {
    doc.text(`Retención IRPF (${quote.porcentaje_retencion}%):`, labelX, y);
    doc.text(`-${parseFloat(quote.total_retencion || 0).toFixed(2)}€`, rightX, y, { align: 'right' });
    y += 6;
  }
  doc.setDrawColor(30, 30, 30);
  doc.line(labelX, y, rightX, y);
  y += 6;
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL:', labelX, y);
  doc.text(`${parseFloat(quote.total || 0).toFixed(2)}€`, rightX, y, { align: 'right' });
  doc.setFont(undefined, 'normal');

  y += 12;
  if (quote.payment_conditions) {
    doc.setFontSize(9); doc.setTextColor(60, 60, 60); doc.setFont(undefined, 'bold');
    doc.text('Condiciones de pago:', 14, y); doc.setFont(undefined, 'normal'); y += 5;
    doc.setTextColor(80, 80, 80);
    const condLines = doc.splitTextToSize(quote.payment_conditions, pageWidth - 28);
    doc.text(condLines, 14, y); y += condLines.length * 4 + 4;
  }
  if (quote.notes) {
    doc.setFontSize(9); doc.setTextColor(60, 60, 60); doc.setFont(undefined, 'bold');
    doc.text('Notas:', 14, y); doc.setFont(undefined, 'normal'); y += 5;
    doc.setTextColor(80, 80, 80);
    const noteLines = doc.splitTextToSize(quote.notes, pageWidth - 28);
    doc.text(noteLines, 14, y); y += noteLines.length * 4 + 4;
  }
  if (quote.legal_text) {
    y += 4; doc.setFontSize(7.5); doc.setTextColor(140, 140, 140);
    const legalLines = doc.splitTextToSize(quote.legal_text, pageWidth - 28);
    doc.text(legalLines, 14, y);
  }
  if (quote.client_signature) {
    y += 10;
    doc.setFontSize(8); doc.setTextColor(60, 60, 60); doc.setFont(undefined, 'bold');
    doc.text('Firma digital del cliente:', 14, y); doc.setFont(undefined, 'normal'); y += 5;
    doc.text(quote.client_signature, 14, y);
    if (quote.client_signature_date) {
      y += 4; doc.setTextColor(120, 120, 120); doc.setFontSize(7.5);
      doc.text(`Aceptado el ${new Date(quote.client_signature_date).toLocaleString('es-ES')}`, 14, y);
    }
  }

  return doc;
}

export async function downloadQuotePDFWithLogo(quote) {
  const doc = await generateQuotePDFAsync(quote);
  const filename = quote.quote_number ? `${quote.quote_number}.pdf` : `presupuesto.pdf`;
  doc.save(filename);
}

export function downloadQuotePDF(quote) {
  const doc = generateQuotePDF(quote);
  const filename = quote.quote_number ? `${quote.quote_number}.pdf` : `presupuesto.pdf`;
  doc.save(filename);
}

export function getQuotePDFBlob(quote) {
  const doc = generateQuotePDF(quote);
  return doc.output('blob');
}

export function getQuotePDFBase64(quote) {
  const doc = generateQuotePDF(quote);
  return doc.output('datauristring');
}