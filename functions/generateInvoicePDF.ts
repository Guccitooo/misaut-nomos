import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await req.json();

    const invoice = await base44.asServiceRole.entities.Invoice.filter({ id: invoiceId });
    if (!invoice || invoice.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const inv = invoice[0];

    if (inv.professional_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Logo si existe
    if (inv.emisor_logo_url) {
      try {
        const logoResponse = await fetch(inv.emisor_logo_url);
        const logoBlob = await logoResponse.blob();
        const logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(logoBlob);
        });
        doc.addImage(logoBase64, 'PNG', 15, yPos, 40, 15);
        yPos += 20;
      } catch (e) {
        console.error('Error loading logo:', e);
      }
    }

    // Título FACTURA
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('FACTURA', 15, yPos);
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(inv.invoice_number, 15, yPos + 8);
    yPos += 20;

    // Emisor (izquierda) y Cliente (derecha)
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('EMISOR', 15, yPos);
    doc.text('CLIENTE', pageWidth - 80, yPos);
    yPos += 5;

    doc.setFont(undefined, 'normal');
    const emisorLines = [
      inv.emisor_razon_social,
      `NIF/CIF: ${inv.emisor_nif}`,
      inv.emisor_direccion,
      `${inv.emisor_cp} ${inv.emisor_ciudad}`,
      `${inv.emisor_provincia}, ${inv.emisor_pais}`,
      inv.emisor_telefono ? `Tel: ${inv.emisor_telefono}` : null,
      inv.emisor_email ? `Email: ${inv.emisor_email}` : null,
    ].filter(Boolean);

    const clientLines = [
      inv.client_name,
      inv.client_nif ? `NIF/CIF: ${inv.client_nif}` : null,
      inv.client_address,
      inv.client_cp ? `${inv.client_cp} ${inv.client_ciudad || ''}` : null,
      inv.client_email ? `Email: ${inv.client_email}` : null,
    ].filter(Boolean);

    let maxLines = Math.max(emisorLines.length, clientLines.length);
    for (let i = 0; i < maxLines; i++) {
      if (emisorLines[i]) doc.text(emisorLines[i], 15, yPos);
      if (clientLines[i]) doc.text(clientLines[i], pageWidth - 80, yPos);
      yPos += 5;
    }

    yPos += 10;

    // Fechas y método de pago
    doc.setFont(undefined, 'bold');
    doc.text(`Fecha emisión: `, 15, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(inv.issue_date).toLocaleDateString('es-ES'), 50, yPos);
    
    doc.setFont(undefined, 'bold');
    doc.text(`Vencimiento: `, 15, yPos + 5);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(inv.due_date).toLocaleDateString('es-ES'), 50, yPos + 5);
    
    doc.setFont(undefined, 'bold');
    doc.text(`Forma de pago: `, 15, yPos + 10);
    doc.setFont(undefined, 'normal');
    doc.text(inv.payment_method || 'N/A', 50, yPos + 10);
    
    yPos += 20;

    // Tabla de conceptos
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos, pageWidth - 30, 8, 'F');
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.text('DESCRIPCIÓN', 17, yPos + 5);
    doc.text('CANT.', pageWidth - 100, yPos + 5, { align: 'center' });
    doc.text('P. UNIT.', pageWidth - 70, yPos + 5, { align: 'right' });
    doc.text('IVA', pageWidth - 45, yPos + 5, { align: 'right' });
    doc.text('TOTAL', pageWidth - 20, yPos + 5, { align: 'right' });
    yPos += 10;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    
    (inv.items || []).forEach((item) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const desc = doc.splitTextToSize(item.description || '', 90);
      doc.text(desc, 17, yPos);
      doc.text(String(item.quantity || 0), pageWidth - 100, yPos, { align: 'center' });
      doc.text(`${(item.unit_price || 0).toFixed(2)}€`, pageWidth - 70, yPos, { align: 'right' });
      doc.text(item.exenta_iva ? 'Exenta' : `${item.iva_percent}%`, pageWidth - 45, yPos, { align: 'right' });
      doc.text(`${(item.total || 0).toFixed(2)}€`, pageWidth - 20, yPos, { align: 'right' });
      
      yPos += desc.length * 5 + 3;
    });

    yPos += 10;

    // Resumen de totales
    const summaryX = pageWidth - 80;
    doc.setDrawColor(200);
    doc.line(summaryX - 5, yPos - 5, pageWidth - 15, yPos - 5);
    
    doc.setFont(undefined, 'normal');
    doc.text('Base imponible:', summaryX, yPos);
    doc.text(`${(inv.subtotal || 0).toFixed(2)}€`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 6;

    doc.text('Total IVA:', summaryX, yPos);
    doc.text(`${(inv.total_iva || 0).toFixed(2)}€`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 6;

    if (inv.aplica_retencion) {
      doc.setTextColor(200, 0, 0);
      doc.text(`Retención IRPF (${inv.porcentaje_retencion}%):`, summaryX, yPos);
      doc.text(`-${(inv.total_retencion || 0).toFixed(2)}€`, pageWidth - 20, yPos, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos += 6;
    }

    doc.setLineWidth(0.5);
    doc.line(summaryX - 5, yPos, pageWidth - 15, yPos);
    yPos += 6;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', summaryX, yPos);
    doc.text(`${(inv.total || 0).toFixed(2)}€`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 10;

    // IBAN si existe
    if (inv.emisor_iban) {
      doc.setFillColor(245, 245, 245);
      doc.rect(15, yPos, pageWidth - 30, 12, 'F');
      doc.setFont(undefined, 'bold');
      doc.setFontSize(8);
      doc.text('DATOS BANCARIOS PARA EL PAGO:', 17, yPos + 4);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(inv.emisor_iban, 17, yPos + 9);
      yPos += 15;
    }

    // Notas
    if (inv.notes) {
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text('OBSERVACIONES:', 15, yPos);
      yPos += 5;
      doc.setFont(undefined, 'normal');
      const notesLines = doc.splitTextToSize(inv.notes, pageWidth - 30);
      doc.text(notesLines, 15, yPos);
      yPos += notesLines.length * 4 + 5;
    }

    // Texto legal
    if (inv.legal_text) {
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      const legalLines = doc.splitTextToSize(inv.legal_text, pageWidth - 30);
      doc.text(legalLines, 15, yPos);
      yPos += legalLines.length * 3 + 5;
    }

    // Pie de página
    yPos = doc.internal.pageSize.getHeight() - 15;
    doc.setDrawColor(200);
    doc.line(15, yPos - 3, pageWidth - 15, yPos - 3);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`${inv.emisor_razon_social} • NIF/CIF: ${inv.emisor_nif}`, pageWidth / 2, yPos, { align: 'center' });
    if (inv.emisor_actividad) {
      doc.text(inv.emisor_actividad, pageWidth / 2, yPos + 3, { align: 'center' });
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${inv.invoice_number}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});