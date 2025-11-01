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
            const daysDiff = Math.floor((new Date() - msgDate) / (1000 * 60 * 60 * 24));
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
            
            if (!client || !professional) continue;
            
            // Verificar si ya dejó reseña
            const existingReviews = await base44.asServiceRole.entities.Review.filter({
                client_id: client.id,
                professional_id: professional.id
            });
            
            if (existingReviews.length > 0) {
                console.log(`⏭️ Cliente ${client.email} ya dejó reseña`);
                continue;
            }
            
            // Obtener perfil profesional
            const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                user_id: professional.id
            });
            
            const professionalName = profiles[0]?.business_name || professional.full_name || professional.email;
            
            // Enviar recordatorio
            await base44.asServiceRole.functions.invoke('createNotification', {
                userId: client.id,
                type: 'review_reminder',
                title: '⭐ Valora tu experiencia',
                message: `¿Qué te pareció el servicio de ${professionalName}? Tu opinión ayuda a otros usuarios.`,
                link: `/Messages?conversation=${convId}`,
                priority: 'medium',
                sendEmail: true,
                emailSubject: '⭐ Valora tu experiencia con ' + professionalName,
                emailBody: `Hola ${client.full_name || ''},

Hace una semana contactaste con ${professionalName} en milautonomos.

¿Qué tal fue tu experiencia?

Tu opinión es muy valiosa y ayuda a otros usuarios a tomar mejores decisiones. Solo te tomará un minuto.

👉 Dejar valoración: https://milautonomos.com/Messages?conversation=${convId}

Gracias por formar parte de milautonomos,
Equipo milautonomos`
            });
            
            remindersSent++;
            console.log(`✅ Recordatorio enviado a ${client.email} sobre ${professionalName}`);
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