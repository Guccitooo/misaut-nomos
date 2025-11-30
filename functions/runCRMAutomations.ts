import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Esta función puede ser llamada por un cron job o manualmente
    const body = await req.json().catch(() => ({}));
    const { professional_id, trigger_event, client_id, client_data } = body;

    if (!professional_id) {
      return Response.json({ error: 'professional_id requerido' }, { status: 400 });
    }

    // Obtener automatizaciones activas del profesional
    const automations = await base44.asServiceRole.entities.CRMAutomation.filter({
      professional_id,
      is_active: true
    });

    const results = [];

    for (const automation of automations) {
      // Verificar si el disparador coincide
      if (trigger_event && automation.trigger.event !== trigger_event) {
        continue;
      }

      // Verificar condiciones del disparador
      const shouldTrigger = await checkTriggerConditions(
        base44,
        automation,
        client_id,
        client_data,
        trigger_event
      );

      if (!shouldTrigger) continue;

      // Ejecutar acciones
      for (let i = 0; i < automation.actions.length; i++) {
        const action = automation.actions[i];
        
        if (action.delay_days > 0) {
          // Programar ejecución futura
          const scheduledDate = new Date();
          scheduledDate.setDate(scheduledDate.getDate() + action.delay_days);
          
          await base44.asServiceRole.entities.AutomationExecution.create({
            professional_id,
            automation_id: automation.id,
            client_id,
            status: 'pending',
            scheduled_date: scheduledDate.toISOString(),
            action_index: i,
            action_type: action.type
          });
          
          results.push({
            automation: automation.name,
            action: action.type,
            scheduled: scheduledDate.toISOString()
          });
        } else {
          // Ejecutar inmediatamente
          const result = await executeAction(base44, professional_id, client_id, action);
          results.push({
            automation: automation.name,
            action: action.type,
            result
          });
        }
      }

      // Actualizar contador de ejecución
      await base44.asServiceRole.entities.CRMAutomation.update(automation.id, {
        execution_count: (automation.execution_count || 0) + 1,
        last_execution: new Date().toISOString()
      });
    }

    return Response.json({ ok: true, results });
  } catch (error) {
    console.error('Error en automatización:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function checkTriggerConditions(base44, automation, clientId, clientData, triggerEvent) {
  const { trigger } = automation;
  const conditions = trigger.conditions || {};

  switch (trigger.event) {
    case 'client_created':
      if (conditions.status && clientData?.status !== conditions.status) {
        return false;
      }
      return triggerEvent === 'client_created';

    case 'status_changed':
      if (conditions.to_status && clientData?.status !== conditions.to_status) {
        return false;
      }
      return triggerEvent === 'status_changed';

    case 'job_completed':
      return triggerEvent === 'job_completed';

    case 'jobs_count':
      if (!clientId) return false;
      const jobs = await base44.asServiceRole.entities.Job.filter({ client_contact_id: clientId });
      return jobs.length >= (conditions.min_jobs || 2);

    case 'days_inactive':
      if (!clientData?.last_contact_date) return false;
      const lastContact = new Date(clientData.last_contact_date);
      const daysSince = Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince >= (conditions.days || 30);

    case 'birthday':
      if (!clientData?.birthday) return false;
      const today = new Date();
      const birthday = new Date(clientData.birthday);
      return today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate();

    default:
      return true;
  }
}

async function executeAction(base44, professionalId, clientId, action) {
  const { type, params } = action;

  try {
    switch (type) {
      case 'add_tag':
        if (params.tag && clientId) {
          const clients = await base44.asServiceRole.entities.ClientContact.filter({ id: clientId });
          if (clients[0]) {
            const currentTags = clients[0].tags || [];
            if (!currentTags.includes(params.tag)) {
              await base44.asServiceRole.entities.ClientContact.update(clientId, {
                tags: [...currentTags, params.tag]
              });
            }
          }
        }
        return 'Tag añadida';

      case 'remove_tag':
        if (params.tag && clientId) {
          const clients = await base44.asServiceRole.entities.ClientContact.filter({ id: clientId });
          if (clients[0]) {
            const currentTags = clients[0].tags || [];
            await base44.asServiceRole.entities.ClientContact.update(clientId, {
              tags: currentTags.filter(t => t !== params.tag)
            });
          }
        }
        return 'Tag eliminada';

      case 'change_status':
        if (params.status && clientId) {
          await base44.asServiceRole.entities.ClientContact.update(clientId, {
            status: params.status
          });
        }
        return 'Estado cambiado';

      case 'change_segment':
        if (params.segment && clientId) {
          await base44.asServiceRole.entities.ClientContact.update(clientId, {
            segment: params.segment
          });
        }
        return 'Segmento cambiado';

      case 'create_reminder':
        await base44.asServiceRole.entities.ClientActivity.create({
          professional_id: professionalId,
          client_id: clientId,
          type: 'reminder',
          title: params.title || 'Recordatorio automático',
          description: params.description || '',
          is_reminder: true,
          reminder_date: new Date().toISOString(),
          reminder_completed: false
        });
        return 'Recordatorio creado';

      case 'create_activity':
        await base44.asServiceRole.entities.ClientActivity.create({
          professional_id: professionalId,
          client_id: clientId,
          type: params.activity_type || 'note',
          title: params.title || 'Actividad automática',
          description: params.description || 'Generado automáticamente'
        });
        return 'Actividad registrada';

      default:
        return 'Acción no reconocida';
    }
  } catch (error) {
    console.error(`Error ejecutando acción ${type}:`, error);
    return `Error: ${error.message}`;
  }
}