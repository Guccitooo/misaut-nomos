import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Obtener todas las tareas pendientes que necesiten recordatorio
    const allTasks = await base44.asServiceRole.entities.Task.filter({
      status: 'pending',
      notification_sent: false
    });

    let sent = 0;
    const now = new Date();

    for (const task of allTasks) {
      // Obtener preferencias del usuario
      const taskUser = await base44.asServiceRole.entities.User.filter({ id: task.professional_id });
      if (!taskUser || taskUser.length === 0) continue;

      const userPrefs = taskUser[0].notification_preferences || { task_reminders: true, task_reminder_hours_before: 24 };
      
      if (!userPrefs.task_reminders) continue;

      // Calcular cuándo enviar recordatorio
      const dueDateTime = new Date(task.due_date + 'T' + (task.due_time || '09:00'));
      const reminderTime = new Date(dueDateTime.getTime() - (userPrefs.task_reminder_hours_before || 24) * 60 * 60 * 1000);

      // Si ya pasó la hora de recordatorio y no se ha enviado
      if (now >= reminderTime && now < dueDateTime) {
        // Crear notificación
        await base44.asServiceRole.entities.Notification.create({
          user_id: task.professional_id,
          type: 'system_update',
          title: '⏰ Recordatorio de tarea',
          message: `Tarea "${task.title}" programada para ${new Date(task.due_date).toLocaleDateString('es-ES')} ${task.due_time ? 'a las ' + task.due_time : ''}`,
          link: createPageUrl("Calendar"),
          priority: task.priority === 'high' ? 'high' : 'medium'
        });

        // Enviar email si está habilitado
        if (userPrefs.email_enabled) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: taskUser[0].email,
            subject: `⏰ Recordatorio: ${task.title}`,
            body: `
<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial;background:#f8fafc;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden}.header{background:#3B82F6;padding:20px;text-align:center;color:#fff}.content{padding:30px}.task-box{background:#DBEAFE;border-left:4px solid #3B82F6;padding:15px;margin:15px 0;border-radius:6px}.button{display:inline-block;background:#3B82F6;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:15px}</style></head>
<body>
<div class="container">
  <div class="header"><h2>⏰ Recordatorio de Tarea</h2></div>
  <div class="content">
    <div class="task-box">
      <h3>${task.title}</h3>
      ${task.description ? `<p>${task.description}</p>` : ''}
      <p><strong>Fecha:</strong> ${new Date(task.due_date).toLocaleDateString('es-ES')} ${task.due_time ? 'a las ' + task.due_time : ''}</p>
      <p><strong>Prioridad:</strong> ${task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}</p>
    </div>
    <p style="text-align:center">
      <a href="https://misautonomos.es${createPageUrl("Calendar")}" class="button">Ver en calendario</a>
    </p>
  </div>
</div>
</body>
</html>`,
            from_name: "MisAutónomos - Recordatorios"
          }).catch(() => {});
        }

        // Marcar notificación como enviada
        await base44.asServiceRole.entities.Task.update(task.id, { notification_sent: true });
        sent++;
      }
    }

    return Response.json({
      success: true,
      reminders_sent: sent,
      message: `${sent} recordatorios de tareas enviados`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function createPageUrl(pageName) {
  return `/${pageName}`;
}