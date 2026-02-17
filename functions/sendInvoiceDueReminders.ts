import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Obtener facturas pendientes
    const allInvoices = await base44.asServiceRole.entities.Invoice.filter({
      status: 'sent'
    });

    let sent = 0;
    const now = new Date();

    for (const invoice of allInvoices) {
      if (!invoice.due_date) continue;

      // Obtener preferencias del profesional
      const professional = await base44.asServiceRole.entities.User.filter({ id: invoice.professional_id });
      if (!professional || professional.length === 0) continue;

      const userPrefs = professional[0].notification_preferences || { invoice_reminders: true, invoice_reminder_days_before: 3 };
      
      if (!userPrefs.invoice_reminders) continue;

      const dueDate = new Date(invoice.due_date);
      const daysBefore = userPrefs.invoice_reminder_days_before || 3;
      const reminderDate = new Date(dueDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);

      // Verificar si hoy es día de recordatorio
      const todayStr = now.toISOString().split('T')[0];
      const reminderStr = reminderDate.toISOString().split('T')[0];

      if (todayStr === reminderStr) {
        // Verificar si ya se envió recordatorio hoy
        const lastReminder = invoice.last_reminder_date ? new Date(invoice.last_reminder_date).toISOString().split('T')[0] : null;
        if (lastReminder === todayStr) continue;

        // Crear notificación
        await base44.asServiceRole.entities.Notification.create({
          user_id: invoice.professional_id,
          type: 'system_update',
          title: '💳 Factura próxima a vencer',
          message: `La factura ${invoice.invoice_number || invoice.id.slice(-6)} de ${invoice.client_name} vence en ${daysBefore} días (${dueDate.toLocaleDateString('es-ES')}) - Total: ${invoice.total.toFixed(2)}€`,
          link: createPageUrl("Invoices") + `?id=${invoice.id}`,
          priority: 'high'
        });

        // Enviar email si está habilitado
        if (userPrefs.email_enabled) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: professional[0].email,
            subject: `💳 Recordatorio: Factura vence en ${daysBefore} días`,
            body: `
<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial;background:#f8fafc;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden}.header{background:#F97316;padding:20px;text-align:center;color:#fff}.content{padding:30px}.invoice-box{background:#FED7AA;border-left:4px solid #F97316;padding:15px;margin:15px 0;border-radius:6px}.button{display:inline-block;background:#F97316;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:15px}</style></head>
<body>
<div class="container">
  <div class="header"><h2>💳 Factura Próxima a Vencer</h2></div>
  <div class="content">
    <p>Hola,</p>
    <div class="invoice-box">
      <p><strong>Factura:</strong> ${invoice.invoice_number || invoice.id.slice(-6)}</p>
      <p><strong>Cliente:</strong> ${invoice.client_name}</p>
      <p><strong>Total:</strong> ${invoice.total.toFixed(2)}€</p>
      <p><strong>Vence:</strong> ${dueDate.toLocaleDateString('es-ES')} (en ${daysBefore} días)</p>
    </div>
    <p style="text-align:center">
      <a href="https://misautonomos.es${createPageUrl("Invoices")}?id=${invoice.id}" class="button">Ver factura</a>
    </p>
  </div>
</div>
</body>
</html>`,
            from_name: "MisAutónomos - Recordatorios"
          }).catch(() => {});
        }

        // Marcar que se envió recordatorio
        await base44.asServiceRole.entities.Invoice.update(invoice.id, {
          last_reminder_date: now.toISOString()
        });

        sent++;
      }
    }

    return Response.json({
      success: true,
      reminders_sent: sent,
      message: `${sent} recordatorios de facturas enviados`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function createPageUrl(pageName) {
  return `/${pageName}`;
}