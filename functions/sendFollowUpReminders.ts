import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('🔔 ========== FOLLOW-UP REMINDERS CRON ==========');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Obtener recordatorios pendientes que deben enviarse
        const now = new Date();
        const reminders = await base44.asServiceRole.entities.FollowUpReminder.filter({
            status: 'pending'
        });
        
        let sentCount = 0;
        
        for (const reminder of reminders) {
            const reminderDate = new Date(reminder.reminder_date);
            
            // Si la fecha del recordatorio ya pasó o es hoy
            if (reminderDate <= now) {
                try {
                    // Obtener datos del cliente
                    const users = await base44.asServiceRole.entities.User.filter({ id: reminder.client_id });
                    if (users.length === 0) continue;
                    
                    const user = users[0];
                    
                    // Obtener datos del profesional si existe
                    let professionalName = 'el profesional';
                    if (reminder.professional_id) {
                        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ 
                            user_id: reminder.professional_id 
                        });
                        if (profiles.length > 0) {
                            professionalName = profiles[0].business_name || 'el profesional';
                        }
                    }
                    
                    // Enviar email de recordatorio
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: user.email,
                        subject: `📋 Recordatorio: ${reminder.message}`,
                        body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 22px; }
    .content { padding: 30px; }
    .reminder-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Recordatorio de Seguimiento</h1>
    </div>
    <div class="content">
      <p>Hola ${user.full_name || 'Cliente'},</p>
      
      <div class="reminder-box">
        <strong>${reminder.message}</strong>
        ${reminder.context ? `<p style="margin-top: 10px; color: #64748b; font-size: 14px;">${reminder.context}</p>` : ''}
      </div>
      
      ${reminder.professional_id ? `<p>Recuerda contactar con <strong>${professionalName}</strong> para dar seguimiento.</p>` : ''}
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="https://misautonomos.es/Messages" class="button">Ver mis conversaciones →</a>
      </p>
    </div>
    <div class="footer">
      <p>MisAutónomos - Tu autónomo de confianza</p>
    </div>
  </div>
</body>
</html>`,
                        from_name: 'MisAutónomos'
                    });
                    
                    // Marcar como enviado
                    await base44.asServiceRole.entities.FollowUpReminder.update(reminder.id, {
                        status: 'sent'
                    });
                    
                    sentCount++;
                    console.log(`✅ Recordatorio enviado a ${user.email}`);
                    
                } catch (err) {
                    console.error(`❌ Error enviando recordatorio ${reminder.id}:`, err.message);
                }
            }
        }
        
        console.log(`📧 Total recordatorios enviados: ${sentCount}`);
        return Response.json({ success: true, sent: sentCount });
        
    } catch (error) {
        console.error('❌ Error en cron de recordatorios:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});