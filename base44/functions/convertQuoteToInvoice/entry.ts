import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quoteId } = await req.json();

    if (!quoteId) {
      return Response.json({ error: 'quoteId requerido' }, { status: 400 });
    }

    // Obtener el presupuesto
    const quotes = await base44.entities.Quote.filter({ id: quoteId });
    if (!quotes || quotes.length === 0) {
      return Response.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    const quote = quotes[0];

    // Verificar que solo el profesional puede convertir
    if (quote.professional_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'No tienes permiso para convertir este presupuesto' }, { status: 403 });
    }

    // Verificar que está aceptado
    if (quote.status !== 'aceptado') {
      return Response.json({ error: 'Solo se pueden convertir presupuestos aceptados' }, { status: 400 });
    }

    // Verificar que no esté ya convertido
    if (quote.converted_to_invoice) {
      return Response.json({ error: 'Este presupuesto ya fue convertido en factura' }, { status: 400 });
    }

    // Obtener configuración de facturación del profesional
    const settingsList = await base44.entities.InvoicingSettings.filter({ professional_id: user.id });
    const settings = settingsList[0];

    if (!settings) {
      return Response.json({ 
        error: 'Debes configurar tus datos de facturación primero' 
      }, { status: 400 });
    }

    // Calcular siguiente número de factura
    const nextNum = (settings.ultimo_numero_factura || 0) + 1;
    const serie = settings.serie_factura || 'A';
    const invoice_number = `${serie}-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;

    // Crear factura desde el presupuesto
    const invoiceData = {
      professional_id: user.id,
      client_contact_id: quote.client_contact_id || quote.client_id,
      client_name: quote.client_name,
      client_nif: quote.client_nif || '',
      client_email: quote.client_email,
      client_address: quote.client_address || '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: calculateDueDate(quote.payment_conditions),
      
      // Datos del emisor desde configuración
      emisor_razon_social: settings.razon_social || quote.emisor_razon_social,
      emisor_nif: settings.nif_cif || quote.emisor_nif,
      emisor_direccion: settings.direccion_fiscal || quote.emisor_direccion,
      emisor_cp: settings.codigo_postal || '',
      emisor_ciudad: settings.ciudad || '',
      emisor_provincia: settings.provincia || '',
      emisor_pais: settings.pais || 'España',
      emisor_telefono: settings.telefono || quote.emisor_telefono,
      emisor_email: settings.email || quote.emisor_email,
      emisor_iban: settings.iban || quote.emisor_iban,
      emisor_actividad: settings.actividad_economica || '',
      emisor_logo_url: settings.logo_url || quote.emisor_logo_url,
      
      // Items y totales
      items: quote.items.map(item => ({
        description: item.concept,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent || 0,
        iva_percent: item.iva_percent || 21,
        exenta_iva: false,
        subtotal: item.subtotal,
        iva_amount: item.iva_amount,
        total: item.total
      })),
      
      subtotal: quote.subtotal,
      total_iva: quote.total_iva,
      aplica_retencion: quote.aplica_retencion,
      porcentaje_retencion: quote.porcentaje_retencion,
      total_retencion: quote.total_retencion,
      total: quote.total,
      
      status: 'sent',
      payment_method: '',
      notes: quote.notes || '',
      legal_text: settings.texto_legal || quote.legal_text,
      
      // Referencia al presupuesto original
      invoice_number,
      numero: nextNum,
      serie: serie
    };

    // Crear la factura
    const invoice = await base44.entities.Invoice.create(invoiceData);

    // Actualizar el presupuesto
    await base44.entities.Quote.update(quoteId, {
      converted_to_invoice: true,
      invoice_id: invoice.id
    });

    // Actualizar último número de factura
    await base44.entities.InvoicingSettings.update(settings.id, {
      ultimo_numero_factura: nextNum
    });

    // Notificar al cliente
    try {
      await base44.functions.invoke('sendPushNotification', {
        userIds: [quote.client_id],
        title: `📄 Factura creada`,
        message: `Tu presupuesto "${quote.title}" se ha convertido en factura ${invoice_number}`,
        url: `https://misautonomos.es/facturas`
      });
    } catch {}

    return Response.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        total: invoice.total
      }
    });
  } catch (error) {
    console.error('Error converting quote to invoice:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateDueDate(paymentConditions) {
  // Intentar extraer días de las condiciones de pago
  const match = paymentConditions?.match(/(\d+)\s*días?/i);
  if (match) {
    const days = parseInt(match[1]);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate.toISOString().split('T')[0];
  }
  
  // Por defecto, 30 días
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  return dueDate.toISOString().split('T')[0];
}