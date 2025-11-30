import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("slack");
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const startOfDay = new Date(todayStr + 'T00:00:00.000Z');
    
    // Obtener datos del día
    const [users, subscriptions, invoices, profiles, reviews] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Subscription.list(),
      base44.asServiceRole.entities.Invoice.list(),
      base44.asServiceRole.entities.ProfessionalProfile.list(),
      base44.asServiceRole.entities.Review.list()
    ]);

    // Calcular métricas
    const newUsersToday = users.filter(u => u.created_date && new Date(u.created_date) >= startOfDay).length;
    const totalUsers = users.length;
    const professionals = users.filter(u => u.user_type === 'professionnel').length;
    const clients = users.filter(u => u.user_type === 'client').length;

    const activeSubscriptions = subscriptions.filter(s => 
      s.estado === 'activo' || s.estado === 'en_prueba'
    ).length;
    const trialSubscriptions = subscriptions.filter(s => s.estado === 'en_prueba').length;

    const visibleProfiles = profiles.filter(p => p.visible_en_busqueda).length;
    const completedOnboarding = profiles.filter(p => p.onboarding_completed).length;

    const paidInvoicesToday = invoices.filter(i => 
      i.status === 'paid' && i.payment_date === todayStr
    );
    const totalRevenue = paidInvoicesToday.reduce((sum, i) => sum + (i.total || 0), 0);

    const newReviewsToday = reviews.filter(r => 
      r.created_date && new Date(r.created_date) >= startOfDay
    ).length;

    // Calcular MRR (Monthly Recurring Revenue)
    const monthlyRevenue = subscriptions
      .filter(s => s.estado === 'activo')
      .reduce((sum, s) => sum + (s.plan_precio || 0), 0);

    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `📊 Reporte Diario - ${today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`,
            emoji: true
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*👥 USUARIOS*"
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Total usuarios:*\n${totalUsers}` },
            { type: "mrkdwn", text: `*Nuevos hoy:*\n${newUsersToday} 🆕` },
            { type: "mrkdwn", text: `*Profesionales:*\n${professionals}` },
            { type: "mrkdwn", text: `*Clientes:*\n${clients}` }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*💼 SUSCRIPCIONES*"
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Activas:*\n${activeSubscriptions}` },
            { type: "mrkdwn", text: `*En prueba:*\n${trialSubscriptions}` },
            { type: "mrkdwn", text: `*MRR:*\n${monthlyRevenue.toFixed(2)}€` }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*📋 PERFILES PROFESIONALES*"
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Visibles:*\n${visibleProfiles}` },
            { type: "mrkdwn", text: `*Onboarding completo:*\n${completedOnboarding}` }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*💰 FACTURACIÓN HOY*"
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Facturas pagadas:*\n${paidInvoicesToday.length}` },
            { type: "mrkdwn", text: `*Ingresos:*\n${totalRevenue.toFixed(2)}€` }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*⭐ Nuevas reseñas:*\n${newReviewsToday}` }
          ]
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `🕐 Generado: ${new Date().toLocaleString('es-ES')}`
            }
          ]
        }
      ]
    };

    // Get channels
    const channelsResponse = await fetch('https://slack.com/api/conversations.list?types=public_channel&limit=100', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const channelsData = await channelsResponse.json();
    
    if (!channelsData.ok) {
      return Response.json({ error: channelsData.error }, { status: 500 });
    }

    const channels = channelsData.channels || [];
    let targetChannel = channels.find(c => c.name === 'reportes') ||
                        channels.find(c => c.name === 'reports') ||
                        channels.find(c => c.name === 'general') ||
                        channels[0];

    if (!targetChannel) {
      return Response.json({ error: 'No channels found' }, { status: 404 });
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ channel: targetChannel.id, ...message })
    });

    const result = await response.json();
    
    return Response.json({ 
      success: result.ok, 
      channel: targetChannel.name,
      stats: {
        totalUsers,
        newUsersToday,
        activeSubscriptions,
        visibleProfiles,
        totalRevenue
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});