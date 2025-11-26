import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { format, invoiceIds, dateFrom, dateTo, software } = await req.json();

    // Obtener facturas
    let invoices = await base44.entities.Invoice.filter({ professional_id: user.id });
    
    // Filtrar por IDs si se especifican
    if (invoiceIds && invoiceIds.length > 0) {
      invoices = invoices.filter(inv => invoiceIds.includes(inv.id));
    }
    
    // Filtrar por fechas
    if (dateFrom) {
      invoices = invoices.filter(inv => inv.issue_date >= dateFrom);
    }
    if (dateTo) {
      invoices = invoices.filter(inv => inv.issue_date <= dateTo);
    }

    // Ordenar por fecha
    invoices.sort((a, b) => a.issue_date?.localeCompare(b.issue_date));

    if (invoices.length === 0) {
      return Response.json({ error: 'No hay facturas para exportar' }, { status: 400 });
    }

    let content, contentType, filename;

    switch (format) {
      case 'csv':
        ({ content, contentType, filename } = generateCSV(invoices, software));
        break;
      case 'xml':
        ({ content, contentType, filename } = generateXML(invoices, software));
        break;
      case 'json':
        ({ content, contentType, filename } = generateJSON(invoices));
        break;
      default:
        return Response.json({ error: 'Formato no soportado' }, { status: 400 });
    }

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateCSV(invoices, software) {
  let headers, rows;

  switch (software) {
    case 'contasimple':
      // Formato Contasimple
      headers = [
        'Número', 'Fecha', 'Cliente', 'NIF Cliente', 'Base Imponible', 
        'IVA %', 'Cuota IVA', 'Retención %', 'Cuota Retención', 'Total',
        'Estado', 'Forma de Pago', 'Fecha Cobro'
      ];
      rows = invoices.map(inv => [
        inv.invoice_number,
        inv.issue_date,
        inv.client_name,
        inv.client_nif || '',
        inv.subtotal?.toFixed(2),
        '21', // Simplificado
        inv.total_iva?.toFixed(2),
        inv.porcentaje_retencion || 0,
        inv.total_retencion?.toFixed(2) || '0.00',
        inv.total?.toFixed(2),
        inv.status === 'paid' ? 'Cobrada' : 'Pendiente',
        inv.payment_method || '',
        inv.payment_date || ''
      ]);
      break;

    case 'holded':
      // Formato Holded
      headers = [
        'docNumber', 'date', 'dueDate', 'contactName', 'contactCode',
        'contactVat', 'contactEmail', 'concept', 'units', 'subtotal',
        'taxes', 'retention', 'total', 'status', 'paymentMethod'
      ];
      rows = invoices.flatMap(inv => 
        (inv.items || []).map((item, idx) => [
          inv.invoice_number,
          inv.issue_date,
          inv.due_date || '',
          inv.client_name,
          inv.client_nif || '',
          inv.client_nif || '',
          inv.client_email || '',
          item.description,
          item.quantity,
          item.subtotal?.toFixed(2),
          item.iva_amount?.toFixed(2),
          idx === 0 ? (inv.total_retencion?.toFixed(2) || '0.00') : '0.00',
          idx === 0 ? inv.total?.toFixed(2) : '',
          inv.status,
          inv.payment_method || ''
        ])
      );
      break;

    case 'sage':
      // Formato Sage 50
      headers = [
        'TIPO', 'NUMERO', 'FECHA', 'NIF', 'NOMBRE', 'DIRECCION',
        'CP', 'POBLACION', 'PROVINCIA', 'BASE1', 'TIPO1', 'CUOTA1',
        'BASE2', 'TIPO2', 'CUOTA2', 'RETENCION', 'TOTAL'
      ];
      rows = invoices.map(inv => [
        'F', // Factura emitida
        inv.invoice_number,
        inv.issue_date?.split('-').reverse().join('/'), // DD/MM/YYYY
        inv.client_nif || '',
        inv.client_name,
        inv.client_address || '',
        inv.client_cp || '',
        inv.client_ciudad || '',
        inv.client_provincia || '',
        inv.subtotal?.toFixed(2),
        '21.00',
        inv.total_iva?.toFixed(2),
        '0.00', '0.00', '0.00', // Segunda base IVA
        inv.total_retencion?.toFixed(2) || '0.00',
        inv.total?.toFixed(2)
      ]);
      break;

    default:
      // Formato genérico
      headers = [
        'Número Factura', 'Serie', 'Fecha Emisión', 'Fecha Vencimiento',
        'Cliente', 'NIF Cliente', 'Email Cliente', 'Dirección', 'CP', 'Ciudad', 'Provincia',
        'Concepto', 'Cantidad', 'Precio Unitario', 'Descuento %', 'IVA %', 'Subtotal Línea',
        'Base Imponible Total', 'Total IVA', 'Retención %', 'Total Retención', 'Total Factura',
        'Estado', 'Método Pago', 'Fecha Pago', 'Notas'
      ];
      rows = invoices.flatMap(inv => 
        (inv.items || [{ description: 'Sin detalles', quantity: 1, unit_price: inv.total, discount_percent: 0, iva_percent: 21, subtotal: inv.subtotal }]).map((item, idx) => [
          inv.invoice_number,
          inv.serie || 'A',
          inv.issue_date,
          inv.due_date || '',
          inv.client_name,
          inv.client_nif || '',
          inv.client_email || '',
          inv.client_address || '',
          inv.client_cp || '',
          inv.client_ciudad || '',
          inv.client_provincia || '',
          item.description || '',
          item.quantity || 1,
          item.unit_price?.toFixed(2) || '0.00',
          item.discount_percent || 0,
          item.iva_percent || 21,
          item.subtotal?.toFixed(2) || '0.00',
          idx === 0 ? inv.subtotal?.toFixed(2) : '',
          idx === 0 ? inv.total_iva?.toFixed(2) : '',
          idx === 0 ? (inv.porcentaje_retencion || 0) : '',
          idx === 0 ? (inv.total_retencion?.toFixed(2) || '0.00') : '',
          idx === 0 ? inv.total?.toFixed(2) : '',
          idx === 0 ? inv.status : '',
          idx === 0 ? (inv.payment_method || '') : '',
          idx === 0 ? (inv.payment_date || '') : '',
          idx === 0 ? (inv.notes || '') : ''
        ])
      );
  }

  // Escapar campos CSV
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csv = [
    headers.join(';'), // Usar ; para compatibilidad con Excel español
    ...rows.map(row => row.map(escapeCSV).join(';'))
  ].join('\n');

  // BOM para UTF-8 (Excel)
  const bom = '\uFEFF';

  return {
    content: bom + csv,
    contentType: 'text/csv; charset=utf-8',
    filename: `facturas_${software || 'export'}_${new Date().toISOString().split('T')[0]}.csv`
  };
}

function generateXML(invoices, software) {
  let xml;

  switch (software) {
    case 'facturae':
      // Formato FacturaE (estándar español)
      xml = generateFacturaEXML(invoices);
      break;
    
    case 'sage':
      xml = generateSageXML(invoices);
      break;

    default:
      xml = generateGenericXML(invoices);
  }

  return {
    content: xml,
    contentType: 'application/xml; charset=utf-8',
    filename: `facturas_${software || 'export'}_${new Date().toISOString().split('T')[0]}.xml`
  };
}

function generateGenericXML(invoices) {
  const escapeXML = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const invoicesXML = invoices.map(inv => `
    <Invoice>
      <InvoiceNumber>${escapeXML(inv.invoice_number)}</InvoiceNumber>
      <Series>${escapeXML(inv.serie || 'A')}</Series>
      <IssueDate>${inv.issue_date}</IssueDate>
      <DueDate>${inv.due_date || ''}</DueDate>
      <Status>${inv.status}</Status>
      <Issuer>
        <Name>${escapeXML(inv.emisor_razon_social)}</Name>
        <TaxId>${escapeXML(inv.emisor_nif)}</TaxId>
        <Address>${escapeXML(inv.emisor_direccion)}</Address>
        <PostalCode>${escapeXML(inv.emisor_cp)}</PostalCode>
        <City>${escapeXML(inv.emisor_ciudad)}</City>
        <Province>${escapeXML(inv.emisor_provincia)}</Province>
        <Country>${escapeXML(inv.emisor_pais || 'España')}</Country>
        <Email>${escapeXML(inv.emisor_email)}</Email>
        <Phone>${escapeXML(inv.emisor_telefono)}</Phone>
      </Issuer>
      <Client>
        <Name>${escapeXML(inv.client_name)}</Name>
        <TaxId>${escapeXML(inv.client_nif)}</TaxId>
        <Address>${escapeXML(inv.client_address)}</Address>
        <PostalCode>${escapeXML(inv.client_cp)}</PostalCode>
        <City>${escapeXML(inv.client_ciudad)}</City>
        <Province>${escapeXML(inv.client_provincia)}</Province>
        <Country>${escapeXML(inv.client_pais || 'España')}</Country>
        <Email>${escapeXML(inv.client_email)}</Email>
      </Client>
      <Items>
        ${(inv.items || []).map(item => `
        <Item>
          <Description>${escapeXML(item.description)}</Description>
          <Quantity>${item.quantity}</Quantity>
          <UnitPrice>${item.unit_price?.toFixed(2)}</UnitPrice>
          <DiscountPercent>${item.discount_percent || 0}</DiscountPercent>
          <VATPercent>${item.iva_percent || 21}</VATPercent>
          <VATExempt>${item.exenta_iva || false}</VATExempt>
          <Subtotal>${item.subtotal?.toFixed(2)}</Subtotal>
          <VATAmount>${item.iva_amount?.toFixed(2)}</VATAmount>
          <Total>${item.total?.toFixed(2)}</Total>
        </Item>`).join('')}
      </Items>
      <Totals>
        <TaxableBase>${inv.subtotal?.toFixed(2)}</TaxableBase>
        <TotalVAT>${inv.total_iva?.toFixed(2)}</TotalVAT>
        <RetentionApplied>${inv.aplica_retencion || false}</RetentionApplied>
        <RetentionPercent>${inv.porcentaje_retencion || 0}</RetentionPercent>
        <TotalRetention>${inv.total_retencion?.toFixed(2) || '0.00'}</TotalRetention>
        <GrandTotal>${inv.total?.toFixed(2)}</GrandTotal>
      </Totals>
      <PaymentInfo>
        <Method>${escapeXML(inv.payment_method)}</Method>
        <IBAN>${escapeXML(inv.emisor_iban)}</IBAN>
        <PaymentDate>${inv.payment_date || ''}</PaymentDate>
      </PaymentInfo>
      <Notes>${escapeXML(inv.notes)}</Notes>
      <LegalText>${escapeXML(inv.legal_text)}</LegalText>
    </Invoice>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<InvoiceExport>
  <ExportDate>${new Date().toISOString()}</ExportDate>
  <TotalInvoices>${invoices.length}</TotalInvoices>
  <Invoices>${invoicesXML}
  </Invoices>
</InvoiceExport>`;
}

function generateFacturaEXML(invoices) {
  // Simplificación del formato FacturaE 3.2.2
  const escapeXML = (str) => {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<fe:Facturae xmlns:fe="http://www.facturae.gob.es/formato/Versiones/Facturaev3_2_2.xml">
  <FileHeader>
    <SchemaVersion>3.2.2</SchemaVersion>
    <Modality>I</Modality>
    <InvoiceIssuerType>EM</InvoiceIssuerType>
    <BatchIdentifier>
      <SellerParty>${escapeXML(invoices[0]?.emisor_nif)}</SellerParty>
      <InvoicesCount>${invoices.length}</InvoicesCount>
      <TotalInvoicesAmount>${invoices.reduce((s, i) => s + (i.total || 0), 0).toFixed(2)}</TotalInvoicesAmount>
    </BatchIdentifier>
  </FileHeader>
  <Parties>
    <SellerParty>
      <TaxIdentification>
        <PersonTypeCode>J</PersonTypeCode>
        <ResidenceTypeCode>R</ResidenceTypeCode>
        <TaxIdentificationNumber>${escapeXML(invoices[0]?.emisor_nif)}</TaxIdentificationNumber>
      </TaxIdentification>
      <LegalEntity>
        <CorporateName>${escapeXML(invoices[0]?.emisor_razon_social)}</CorporateName>
      </LegalEntity>
    </SellerParty>
  </Parties>
  <Invoices>
    ${invoices.map(inv => `
    <Invoice>
      <InvoiceHeader>
        <InvoiceNumber>${escapeXML(inv.invoice_number)}</InvoiceNumber>
        <InvoiceSeriesCode>${escapeXML(inv.serie || 'A')}</InvoiceSeriesCode>
        <InvoiceDocumentType>FC</InvoiceDocumentType>
        <InvoiceClass>OO</InvoiceClass>
      </InvoiceHeader>
      <InvoiceIssueData>
        <IssueDate>${inv.issue_date}</IssueDate>
      </InvoiceIssueData>
      <TaxesOutputs>
        <Tax>
          <TaxTypeCode>01</TaxTypeCode>
          <TaxRate>21.00</TaxRate>
          <TaxableBase>${inv.subtotal?.toFixed(2)}</TaxableBase>
          <TaxAmount>${inv.total_iva?.toFixed(2)}</TaxAmount>
        </Tax>
      </TaxesOutputs>
      <InvoiceTotals>
        <TotalGrossAmount>${inv.subtotal?.toFixed(2)}</TotalGrossAmount>
        <TotalTaxOutputs>${inv.total_iva?.toFixed(2)}</TotalTaxOutputs>
        <TotalTaxesWithheld>${inv.total_retencion?.toFixed(2) || '0.00'}</TotalTaxesWithheld>
        <InvoiceTotal>${inv.total?.toFixed(2)}</InvoiceTotal>
        <TotalOutstandingAmount>${inv.status !== 'paid' ? inv.total?.toFixed(2) : '0.00'}</TotalOutstandingAmount>
        <TotalExecutableAmount>${inv.total?.toFixed(2)}</TotalExecutableAmount>
      </InvoiceTotals>
      <Items>
        ${(inv.items || []).map((item, idx) => `
        <InvoiceLine>
          <ItemDescription>${escapeXML(item.description)}</ItemDescription>
          <Quantity>${item.quantity}</Quantity>
          <UnitPriceWithoutTax>${item.unit_price?.toFixed(6)}</UnitPriceWithoutTax>
          <TotalCost>${item.subtotal?.toFixed(2)}</TotalCost>
          <GrossAmount>${item.subtotal?.toFixed(2)}</GrossAmount>
        </InvoiceLine>`).join('')}
      </Items>
    </Invoice>`).join('')}
  </Invoices>
</fe:Facturae>`;
}

function generateSageXML(invoices) {
  const escapeXML = (str) => {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<SageImport>
  <DocumentType>INVOICES</DocumentType>
  <Documents>
    ${invoices.map(inv => `
    <Document>
      <Type>INVOICE</Type>
      <Number>${escapeXML(inv.invoice_number)}</Number>
      <Date>${inv.issue_date}</Date>
      <DueDate>${inv.due_date || inv.issue_date}</DueDate>
      <Customer>
        <Code>${escapeXML(inv.client_nif)}</Code>
        <Name>${escapeXML(inv.client_name)}</Name>
        <TaxId>${escapeXML(inv.client_nif)}</TaxId>
        <Address>${escapeXML(inv.client_address)}</Address>
        <City>${escapeXML(inv.client_ciudad)}</City>
        <PostCode>${escapeXML(inv.client_cp)}</PostCode>
      </Customer>
      <Lines>
        ${(inv.items || []).map((item, idx) => `
        <Line>
          <LineNumber>${idx + 1}</LineNumber>
          <Description>${escapeXML(item.description)}</Description>
          <Quantity>${item.quantity}</Quantity>
          <Price>${item.unit_price?.toFixed(2)}</Price>
          <Discount>${item.discount_percent || 0}</Discount>
          <TaxCode>IVA21</TaxCode>
          <TaxRate>${item.iva_percent || 21}</TaxRate>
          <NetAmount>${item.subtotal?.toFixed(2)}</NetAmount>
          <TaxAmount>${item.iva_amount?.toFixed(2)}</TaxAmount>
        </Line>`).join('')}
      </Lines>
      <Totals>
        <NetTotal>${inv.subtotal?.toFixed(2)}</NetTotal>
        <TaxTotal>${inv.total_iva?.toFixed(2)}</TaxTotal>
        <WithholdingTotal>${inv.total_retencion?.toFixed(2) || '0.00'}</WithholdingTotal>
        <GrossTotal>${inv.total?.toFixed(2)}</GrossTotal>
      </Totals>
      <Status>${inv.status === 'paid' ? 'PAID' : 'PENDING'}</Status>
    </Document>`).join('')}
  </Documents>
</SageImport>`;
}

function generateJSON(invoices) {
  const data = {
    exportDate: new Date().toISOString(),
    totalInvoices: invoices.length,
    invoices: invoices.map(inv => ({
      invoiceNumber: inv.invoice_number,
      series: inv.serie,
      issueDate: inv.issue_date,
      dueDate: inv.due_date,
      status: inv.status,
      issuer: {
        name: inv.emisor_razon_social,
        taxId: inv.emisor_nif,
        address: inv.emisor_direccion,
        postalCode: inv.emisor_cp,
        city: inv.emisor_ciudad,
        province: inv.emisor_provincia,
        country: inv.emisor_pais,
        email: inv.emisor_email,
        phone: inv.emisor_telefono,
        iban: inv.emisor_iban
      },
      client: {
        name: inv.client_name,
        taxId: inv.client_nif,
        email: inv.client_email,
        address: inv.client_address,
        postalCode: inv.client_cp,
        city: inv.client_ciudad,
        province: inv.client_provincia,
        country: inv.client_pais
      },
      items: inv.items || [],
      totals: {
        taxableBase: inv.subtotal,
        totalVAT: inv.total_iva,
        retentionApplied: inv.aplica_retencion,
        retentionPercent: inv.porcentaje_retencion,
        totalRetention: inv.total_retencion,
        grandTotal: inv.total
      },
      payment: {
        method: inv.payment_method,
        date: inv.payment_date
      },
      notes: inv.notes,
      legalText: inv.legal_text
    }))
  };

  return {
    content: JSON.stringify(data, null, 2),
    contentType: 'application/json; charset=utf-8',
    filename: `facturas_export_${new Date().toISOString().split('T')[0]}.json`
  };
}