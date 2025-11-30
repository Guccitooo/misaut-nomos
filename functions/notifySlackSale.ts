import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get Slack access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("slack");
    
    const { 
      amount, 
      currency = 'EUR', 
      customerName, 
      customerEmail, 
      invoiceNumber,
      productName,
      type = 'invoice' // 'invoice' or 'subscription'
    } = await req.json();

    // Format the message
    const emoji = type === 'subscription' ? '🎉' : '💰';
    const typeLabel = type === 'subscription' ? 'Nueva suscripción' : 'Pago de factura';
    
    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${emoji} ${typeLabel} recibido`,
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Importe:*\n${amount?.toFixed(2) || '0.00'} ${currency}`
            },
            {
              type: "mrkdwn",
              text: `*Cliente:*\n${customerName || 'No especificado'}`
            },
            {
              type: "mrkdwn",
              text: `*Email:*\n${customerEmail || 'No especificado'}`
            },
            {
              type: "mrkdwn",
              text: invoiceNumber ? `*Factura:*\n${invoiceNumber}` : `*Producto:*\n${productName || 'Suscripción'}`
            }
          ]
        },
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

    // Get list of channels to find #general or first available
    const channelsResponse = await fetch('https://slack.com/api/conversations.list?types=public_channel&limit=100', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const channelsData = await channelsResponse.json();
    
    if (!channelsData.ok) {
      console.error('Error getting channels:', channelsData.error);
      return Response.json({ error: 'Could not get Slack channels', details: channelsData.error }, { status: 500 });
    }

    // Find #ventas, #sales, #general or first channel
    const channels = channelsData.channels || [];
    let targetChannel = channels.find(c => c.name === 'ventas') ||
                        channels.find(c => c.name === 'sales') ||
                        channels.find(c => c.name === 'general') ||
                        channels[0];

    if (!targetChannel) {
      return Response.json({ error: 'No Slack channels found' }, { status: 404 });
    }

    // Send message to Slack
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: targetChannel.id,
        ...message
      })
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Slack error:', result.error);
      return Response.json({ error: result.error }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      channel: targetChannel.name,
      ts: result.ts 
    });

  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});