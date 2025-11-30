import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("slack");
    
    const { 
      clientName, 
      clientEmail, 
      clientType = 'client', // 'client' or 'professional'
      planName
    } = await req.json();

    const emoji = clientType === 'professional' ? '👨‍💼' : '👤';
    const typeLabel = clientType === 'professional' ? 'Nuevo Profesional' : 'Nuevo Cliente';
    
    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${emoji} ${typeLabel} registrado`,
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Nombre:*\n${clientName || 'No especificado'}`
            },
            {
              type: "mrkdwn",
              text: `*Email:*\n${clientEmail || 'No especificado'}`
            }
          ]
        },
        ...(planName ? [{
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Plan:*\n${planName}`
            }
          ]
        }] : []),
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `📅 ${new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}`
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
    let targetChannel = channels.find(c => c.name === 'clientes') ||
                        channels.find(c => c.name === 'ventas') ||
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
    return Response.json({ success: result.ok, channel: targetChannel.name });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});