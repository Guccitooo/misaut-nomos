import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await req.json();

    // Obtener facturas anteriores del profesional
    const invoices = await base44.entities.Invoice.filter({ professional_id: user.id });
    
    // Obtener perfil del profesional
    const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });
    const profile = profiles[0];

    switch (action) {
      case 'suggestDescriptions': {
        // Extraer todas las descripciones de items anteriores
        const allDescriptions = [];
        invoices.forEach(inv => {
          (inv.items || []).forEach(item => {
            if (item.description && item.description.trim()) {
              allDescriptions.push({
                description: item.description,
                unit_price: item.unit_price,
                quantity: item.quantity,
                count: 1
              });
            }
          });
        });

        // Agrupar por descripción similar y contar frecuencia
        const descriptionMap = {};
        allDescriptions.forEach(d => {
          const key = d.description.toLowerCase().trim();
          if (descriptionMap[key]) {
            descriptionMap[key].count++;
            descriptionMap[key].avgPrice = (descriptionMap[key].avgPrice + d.unit_price) / 2;
          } else {
            descriptionMap[key] = {
              description: d.description,
              avgPrice: d.unit_price,
              count: 1
            };
          }
        });

        // Ordenar por frecuencia y obtener top 10
        const suggestions = Object.values(descriptionMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
          .map(s => ({
            description: s.description,
            suggestedPrice: Math.round(s.avgPrice * 100) / 100,
            usageCount: s.count
          }));

        // Si hay pocas sugerencias, añadir algunas genéricas según categoría
        if (suggestions.length < 5 && profile?.categories?.length > 0) {
          const category = profile.categories[0];
          const genericSuggestions = getGenericSuggestions(category);
          genericSuggestions.forEach(gs => {
            if (!suggestions.find(s => s.description.toLowerCase() === gs.description.toLowerCase())) {
              suggestions.push(gs);
            }
          });
        }

        return Response.json({ suggestions: suggestions.slice(0, 10) });
      }

      case 'validateInvoice': {
        const errors = [];
        const warnings = [];
        const invoice = data.invoice;

        // Validar fechas
        const issueDate = new Date(invoice.issue_date);
        const dueDate = new Date(invoice.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dueDate < issueDate) {
          errors.push({
            type: 'date_error',
            field: 'due_date',
            message: 'La fecha de vencimiento no puede ser anterior a la fecha de emisión'
          });
        }

        if (issueDate > today) {
          warnings.push({
            type: 'future_date',
            field: 'issue_date',
            message: 'La fecha de emisión es futura. ¿Es correcto?'
          });
        }

        // Validar datos del cliente
        if (!invoice.client_name || invoice.client_name.trim() === '') {
          errors.push({
            type: 'missing_field',
            field: 'client_name',
            message: 'El nombre del cliente es obligatorio'
          });
        }

        if (!invoice.client_email || invoice.client_email.trim() === '') {
          warnings.push({
            type: 'missing_email',
            field: 'client_email',
            message: 'Sin email no podrás enviar la factura automáticamente'
          });
        }

        // Validar items
        if (!invoice.items || invoice.items.length === 0) {
          errors.push({
            type: 'no_items',
            field: 'items',
            message: 'La factura debe tener al menos una línea'
          });
        } else {
          invoice.items.forEach((item, idx) => {
            if (!item.description || item.description.trim() === '') {
              errors.push({
                type: 'empty_description',
                field: `items[${idx}].description`,
                message: `La línea ${idx + 1} no tiene descripción`
              });
            }
            if (item.unit_price <= 0) {
              warnings.push({
                type: 'zero_price',
                field: `items[${idx}].unit_price`,
                message: `La línea ${idx + 1} tiene precio 0 o negativo`
              });
            }
            if (item.quantity <= 0) {
              errors.push({
                type: 'invalid_quantity',
                field: `items[${idx}].quantity`,
                message: `La línea ${idx + 1} tiene cantidad inválida`
              });
            }
          });
        }

        // Validar total
        if (invoice.total <= 0) {
          warnings.push({
            type: 'zero_total',
            field: 'total',
            message: 'El total de la factura es 0 o negativo'
          });
        }

        // Comparar precios con histórico
        if (invoices.length > 0) {
          const priceHistory = {};
          invoices.forEach(inv => {
            (inv.items || []).forEach(item => {
              const key = item.description?.toLowerCase().trim();
              if (key) {
                if (!priceHistory[key]) priceHistory[key] = [];
                priceHistory[key].push(item.unit_price);
              }
            });
          });

          invoice.items?.forEach((item, idx) => {
            const key = item.description?.toLowerCase().trim();
            if (key && priceHistory[key]) {
              const avgPrice = priceHistory[key].reduce((a, b) => a + b, 0) / priceHistory[key].length;
              const diff = Math.abs(item.unit_price - avgPrice) / avgPrice;
              
              if (diff > 0.3) { // Más del 30% de diferencia
                warnings.push({
                  type: 'price_deviation',
                  field: `items[${idx}].unit_price`,
                  message: `El precio de "${item.description}" (${item.unit_price}€) difiere significativamente de tu precio habitual (${avgPrice.toFixed(2)}€)`
                });
              }
            }
          });
        }

        // Validar NIF si está presente
        if (invoice.client_nif && invoice.client_nif.length > 0) {
          const nifRegex = /^[0-9]{8}[A-Z]$|^[A-Z][0-9]{7}[A-Z0-9]$|^[XYZ][0-9]{7}[A-Z]$/;
          if (!nifRegex.test(invoice.client_nif.toUpperCase())) {
            warnings.push({
              type: 'invalid_nif',
              field: 'client_nif',
              message: 'El formato del NIF/CIF del cliente parece incorrecto'
            });
          }
        }

        return Response.json({ errors, warnings, isValid: errors.length === 0 });
      }

      case 'recommendPlan': {
        // Calcular métricas de facturación
        const last6Months = new Date();
        last6Months.setMonth(last6Months.getMonth() - 6);
        
        const recentInvoices = invoices.filter(inv => new Date(inv.issue_date) >= last6Months);
        const totalRevenue = recentInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const monthlyAverage = totalRevenue / 6;
        const invoiceCount = recentInvoices.length;
        
        let recommendation = {
          plan: 'plan_monthly',
          reason: '',
          savings: 0,
          metrics: {
            totalRevenue: Math.round(totalRevenue),
            monthlyAverage: Math.round(monthlyAverage),
            invoiceCount,
            activity: profile?.categories?.[0] || 'General'
          }
        };

        // Lógica de recomendación basada en volumen
        if (monthlyAverage > 3000 || invoiceCount > 15) {
          recommendation.plan = 'plan_annual';
          recommendation.reason = `Con un volumen de facturación de ${monthlyAverage.toFixed(0)}€/mes y ${invoiceCount} facturas en 6 meses, el plan anual te ahorra 138€/año (2 meses gratis).`;
          recommendation.savings = 138;
        } else if (monthlyAverage > 1000 || invoiceCount > 8) {
          recommendation.plan = 'plan_quarterly';
          recommendation.reason = `Con ${invoiceCount} facturas en 6 meses, el plan trimestral es ideal. Ahorras 30€ cada 3 meses.`;
          recommendation.savings = 120;
        } else {
          recommendation.reason = `El plan mensual es ideal para empezar. Cuando tu volumen crezca, considera el trimestral para ahorrar.`;
        }

        return Response.json({ recommendation });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in invoice AI assistant:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Sugerencias genéricas por categoría
function getGenericSuggestions(category) {
  const suggestions = {
    'Electricista': [
      { description: 'Revisión instalación eléctrica', suggestedPrice: 80, usageCount: 0 },
      { description: 'Instalación punto de luz', suggestedPrice: 45, usageCount: 0 },
      { description: 'Cambio cuadro eléctrico', suggestedPrice: 350, usageCount: 0 },
      { description: 'Reparación avería eléctrica', suggestedPrice: 65, usageCount: 0 },
    ],
    'Fontanero': [
      { description: 'Desatasco tubería', suggestedPrice: 75, usageCount: 0 },
      { description: 'Instalación grifo/monomando', suggestedPrice: 55, usageCount: 0 },
      { description: 'Reparación cisterna', suggestedPrice: 60, usageCount: 0 },
      { description: 'Instalación calentador', suggestedPrice: 120, usageCount: 0 },
    ],
    'Pintor': [
      { description: 'Pintura habitación (m²)', suggestedPrice: 12, usageCount: 0 },
      { description: 'Pintura exterior fachada (m²)', suggestedPrice: 18, usageCount: 0 },
      { description: 'Aplicación gotelé (m²)', suggestedPrice: 8, usageCount: 0 },
      { description: 'Lacado puertas (unidad)', suggestedPrice: 85, usageCount: 0 },
    ],
    'Carpintero': [
      { description: 'Instalación puerta interior', suggestedPrice: 150, usageCount: 0 },
      { description: 'Montaje mueble a medida', suggestedPrice: 200, usageCount: 0 },
      { description: 'Reparación puerta/ventana', suggestedPrice: 65, usageCount: 0 },
      { description: 'Instalación tarima (m²)', suggestedPrice: 25, usageCount: 0 },
    ],
    'Albañil / Reformas': [
      { description: 'Reforma baño completo', suggestedPrice: 3500, usageCount: 0 },
      { description: 'Alicatado (m²)', suggestedPrice: 35, usageCount: 0 },
      { description: 'Solado (m²)', suggestedPrice: 30, usageCount: 0 },
      { description: 'Tabique de pladur (m²)', suggestedPrice: 45, usageCount: 0 },
    ],
    'Cerrajero': [
      { description: 'Apertura puerta', suggestedPrice: 70, usageCount: 0 },
      { description: 'Cambio cerradura completa', suggestedPrice: 120, usageCount: 0 },
      { description: 'Copia llave seguridad', suggestedPrice: 25, usageCount: 0 },
      { description: 'Instalación cerradura antibumping', suggestedPrice: 180, usageCount: 0 },
    ],
    'default': [
      { description: 'Servicio profesional (hora)', suggestedPrice: 40, usageCount: 0 },
      { description: 'Desplazamiento', suggestedPrice: 20, usageCount: 0 },
      { description: 'Materiales', suggestedPrice: 0, usageCount: 0 },
      { description: 'Consultoría / Presupuesto', suggestedPrice: 30, usageCount: 0 },
    ]
  };
  
  return suggestions[category] || suggestions['default'];
}