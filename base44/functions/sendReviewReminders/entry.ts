
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ✅ CRON JOB: Enviar recordatorios de reseñas
 * 
 * Ejecutar diariamente para enviar recordatorios a clientes
 * que tuvieron conversaciones bidireccionales hace 7 días
 * y aún no han dejado reseña.
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        console.log('📬 Iniciando envío de recordatorios de reseñas');
        
        // Fecha de hace 7 días
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // 1. Obtener todos los mensajes de hace 7 días
        const allMessages = await base44.asServiceRole.entities.Message.list();
        
        // 2. Filtrar mensajes de hace ~7 días
        const oldMessages = allMessages.filter(msg => {
            const msgDate = new Date(msg.created_date);
            const daysDiff = Math.floor((new Date().getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff >= 7 && daysDiff <= 8; // Entre 7 y 8 días
        });
        
        console.log(`📊 Mensajes de hace 7 días: ${oldMessages.length}`);
        
        // 3. Agrupar por conversación
        const conversations = {};
        oldMessages.forEach(msg => {
            if (!conversations[msg.conversation_id]) {
                conversations[msg.conversation_id] = {
                    messages: [],
                    participants: new Set()
                };
            }
            conversations[msg.conversation_id].messages.push(msg);
            conversations[msg.conversation_id].participants.add(msg.sender_id);
            conversations[msg.conversation_id].participants.add(msg.recipient_id);
        });
        
        let remindersSent = 0;
        
        // 4. Para cada conversación bidireccional
        for (const [convId, conv] of Object.entries(conversations)) {
            const participants = Array.from(conv.participants);
            
            if (participants.length !== 2) continue;
            
            const [user1, user2] = participants;
            
            // Verificar que sea bidireccional
            const user1Sent = conv.messages.some(m => m.sender_id === user1);
            const user2Sent = conv.messages.some(m => m.sender_id === user2);
            
            if (!user1Sent || !user2Sent) continue;
            
            // Identificar cliente y profesional
            const users = await base44.asServiceRole.entities.User.filter({
                id: { $in: participants }
            });
            
            const client = users.find(u => u.user_type === 'client');
            const professional = users.find(u => u.user_type === 'professionnel');
            
            if (!client || !professional) {
                console.warn(`⚠️ No client or professional found for conversation ID: ${convId}. Skipping reminder.`);
                continue;
            }
            
            // Verificar si ya dejó reseña
            const existingReviews = await base44.asServiceRole.entities.Review.filter({
                client_id: client.id,
                professional_id: professional.id
            });
            
            if (existingReviews.length > 0) {
                console.log(`⏭️ Cliente ${client.email} ya dejó reseña para profesional ${professional.email}`);
                continue;
            }
            
            // Obtener perfil profesional
            const professionalProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                user_id: professional.id
            });
            
            const professionalProfile = professionalProfiles[0];
            
            if (!professionalProfile || !professionalProfile.business_name) {
                console.warn(`⚠️ No professional profile or business name found for professional ID: ${professional.id}. Skipping reminder for conversation ID: ${convId}.`);
                continue; 
            }
            
            // Enviar recordatorio
            await base44.asServiceRole.functions.invoke('createNotification', {
                userId: client.id,
                type: 'review_reminder',
                title: '⭐ Valora tu experiencia',
                message: `¿Qué tal tu experiencia con ${professionalProfile.business_name}? Tu opinión ayuda a otros usuarios.`,
                link: `/Messages?conversation=${convId}&professional=${professional.id}`,
                priority: 'medium',
                sendEmail: true,
                emailSubject: `⭐ Valora tu experiencia con ${professionalProfile.business_name}`,
                emailBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 60px; height: 60px; background: white; border-radius: 16px; display: inline-block; line-height: 60px; font-size: 32px; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .info-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-box p { color: #78350f; margin: 5px 0; }
    .cta { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; line-height: 1.8; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px; }
    .footer .tagline { color: #60a5fa; margin-bottom: 15px; font-style: italic; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⭐</div>
      <h1>Valora tu experiencia</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola,</p>
      
      <p class="message">
        Hace una semana contactaste con <strong>${professionalProfile.business_name}</strong> en Misautónomos.
      </p>
      
      <div class="info-box">
        <p><strong>👤 Profesional:</strong> ${professionalProfile.business_name}</p>
        <p><strong>📅 Contacto:</strong> Hace 7 días</p>
      </div>
      
      <p class="message">
        ¿Qué tal fue tu experiencia? Tu valoración ayuda a otros usuarios a tomar mejores decisiones y al profesional a mejorar su servicio.
      </p>
      
      <p class="message">
        <strong>La valoración incluye:</strong>
      </p>
      <ul style="color: #4b5563; line-height: 1.8; margin-bottom: 25px;">
        <li>⚡ Rapidez de respuesta</li>
        <li>💬 Calidad de comunicación</li>
        <li>✨ Calidad del trabajo</li>
        <li>💰 Relación calidad/precio</li>
      </ul>
      
      <div class="cta">
        <a href="https://misautonomos.es/Messages?conversation=${convId}" class="button">
          Dejar mi valoración →
        </a>
      </div>
      
      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
        Solo te llevará 2 minutos y ayudarás mucho a la comunidad.
      </p>
    </div>
    
    <div class="footer">
      <strong>Equipo Misautónomos</strong>
      <p class="tagline">Tu autónomo de confianza</p>
      <p>
        <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a><br/>
        <a href="https://misautonomos.es">misautonomos.es</a>
      </p>
    </div>
  </div>
</body>
</html>
                    `
            });
            
            remindersSent++;
            console.log(`✅ Recordatorio enviado a ${client.email} sobre ${professionalProfile.business_name}`);
        }
        
        console.log(`📬 Total recordatorios enviados: ${remindersSent}`);
        
        return Response.json({
            ok: true,
            remindersSent,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error enviando recordatorios:', error);
        return Response.json({
            ok: false,
            error: error.message
        }, { status: 500 });
    }
});
