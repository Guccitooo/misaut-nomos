import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Máximo de días de trial permitido — evita trials de años por bugs
const MAX_TRIAL_DAYS = 90;

Deno.serve(async (req) => {
    console.log('⏰ ========== EXPIRE SUBSCRIPTIONS CRON ==========');
    console.log('🕐 Timestamp:', new Date().toISOString());

    try {
        const base44 = createClientFromRequest(req);
        const now = new Date();

        const results = {
            checked: 0,
            expired: 0,
            skipped_gift: 0,
            anomalous_trials: 0,
            errors: []
        };

        // Buscar todas las suscripciones activas o en trial
        const [activeSubs, trialSubs] = await Promise.all([
            base44.asServiceRole.entities.Subscription.filter({ estado: 'activo' }),
            base44.asServiceRole.entities.Subscription.filter({ estado: 'en_prueba' })
        ]);

        const candidates = [...activeSubs, ...trialSubs];
        console.log(`📦 Candidatas: ${candidates.length} (${activeSubs.length} activas + ${trialSubs.length} en trial)`);

        for (const sub of candidates) {
            results.checked++;

            try {
                const expiration = new Date(sub.fecha_expiracion);

                // ── SKIP si tiene regalo vigente ──
                if (sub.gifted_until && new Date(sub.gifted_until) > now) {
                    console.log(`🎁 Sub ${sub.id} tiene regalo vigente hasta ${sub.gifted_until} — skip`);
                    results.skipped_gift++;
                    continue;
                }

                // ── Detectar trial anómalo (>MAX_TRIAL_DAYS desde fecha_inicio) ──
                let isAnomalousTrial = false;
                if (sub.estado === 'en_prueba' && sub.fecha_inicio) {
                    const diffDays = (expiration - new Date(sub.fecha_inicio)) / (1000 * 60 * 60 * 24);
                    if (diffDays > MAX_TRIAL_DAYS) {
                        console.warn(`🚨 Trial anómalo sub ${sub.id}: ${Math.round(diffDays)} días (máx ${MAX_TRIAL_DAYS})`);
                        isAnomalousTrial = true;
                        results.anomalous_trials++;
                    }
                }

                // ── Si aún no ha expirado y no es anómalo, skip ──
                if (expiration > now && !isAnomalousTrial) {
                    continue;
                }

                // ── EXPIRAR ──
                console.log(`❌ Expirando sub ${sub.id} (user: ${sub.user_id}, estado: ${sub.estado}, expiraba: ${sub.fecha_expiracion})`);

                await base44.asServiceRole.entities.Subscription.update(sub.id, {
                    estado: 'expirado'
                });

                // Ocultar perfil profesional y crear notificación en paralelo
                const [profiles] = await Promise.all([
                    base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: sub.user_id })
                ]);

                const tasks = [];

                if (profiles.length > 0) {
                    tasks.push(
                        base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                            visible_en_busqueda: false,
                            estado_perfil: 'inactivo'
                        })
                    );
                    console.log(`🔒 Ocultando perfil: ${profiles[0].business_name || sub.user_id}`);
                }

                // Notificación in-app para el usuario
                tasks.push(
                    base44.asServiceRole.entities.Notification.create({
                        user_id: sub.user_id,
                        type: 'subscription_expired',
                        title: 'Tu suscripción ha caducado',
                        message: 'Tu período de suscripción ha finalizado. Renueva tu plan para volver a aparecer en las búsquedas y recibir contactos de clientes.',
                        link: '/precios',
                        priority: 'high'
                    })
                );

                await Promise.all(tasks);
                results.expired++;

            } catch (err) {
                console.error(`❌ Error procesando sub ${sub.id}:`, err.message);
                results.errors.push({ subscription_id: sub.id, error: err.message });
            }
        }

        console.log('✅ ========== FINALIZADO ==========');
        console.log('📊 Resultados:', results);

        return Response.json({ success: true, timestamp: now.toISOString(), results });

    } catch (error) {
        console.error('❌ Error crítico en expireSubscriptions:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});