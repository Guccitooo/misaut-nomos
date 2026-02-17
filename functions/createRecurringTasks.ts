import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Obtener todas las tareas recurrentes activas
    const allTasks = await base44.asServiceRole.entities.Task.filter({
      is_recurring: true,
      status: 'pending'
    });

    let created = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const task of allTasks) {
      // Si ya tiene tarea hija creada para hoy, saltar
      const existingNext = await base44.asServiceRole.entities.Task.filter({
        parent_task_id: task.id,
        due_date: today.toISOString().split('T')[0]
      });

      if (existingNext.length > 0) continue;

      // Verificar si debe crear nueva instancia según el patrón
      const lastDue = new Date(task.due_date);
      const daysDiff = Math.floor((today - lastDue) / (1000 * 60 * 60 * 24));

      let shouldCreate = false;
      let nextDate = null;

      switch (task.recurrence_pattern) {
        case 'daily':
          shouldCreate = daysDiff >= 1;
          nextDate = new Date(today);
          break;
        case 'weekly':
          shouldCreate = daysDiff >= 7;
          nextDate = new Date(today);
          break;
        case 'biweekly':
          shouldCreate = daysDiff >= 14;
          nextDate = new Date(today);
          break;
        case 'monthly':
          shouldCreate = daysDiff >= 28;
          nextDate = new Date(today);
          break;
      }

      // Verificar si ya pasó la fecha de fin de recurrencia
      if (task.recurrence_end_date) {
        const endDate = new Date(task.recurrence_end_date);
        if (nextDate > endDate) {
          shouldCreate = false;
        }
      }

      if (shouldCreate && nextDate) {
        await base44.asServiceRole.entities.Task.create({
          professional_id: task.professional_id,
          title: task.title,
          description: task.description,
          due_date: nextDate.toISOString().split('T')[0],
          due_time: task.due_time,
          priority: task.priority,
          status: 'pending',
          category: task.category,
          related_client_id: task.related_client_id,
          related_job_id: task.related_job_id,
          related_project_id: task.related_project_id,
          is_recurring: false,
          parent_task_id: task.id,
          notification_sent: false
        });

        // Actualizar la tarea padre con la nueva fecha
        await base44.asServiceRole.entities.Task.update(task.id, {
          due_date: nextDate.toISOString().split('T')[0]
        });

        created++;
      }
    }

    return Response.json({
      success: true,
      tasks_created: created,
      message: `${created} tareas recurrentes creadas`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});