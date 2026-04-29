import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

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
            renewed: 0,
            skipped_gift: 0,
            skipped_trial_cap: 0,
            errors: []
        };

        // 1️⃣ Buscar todas las suscripciones activas o en trial
        const activeSubs = await base44.asServiceRole.entities.Subscription.filter({
            estado: 'activo'
        });
        const trialSubs = await base44.asServiceRole.entities.Subscription.filter({
            estado: 'en_prueba'
        });

        const candidates = [...activeSubs, ...trialSubs];
        console.log(`📦 Candidatas a verificar: ${candidates.length} (${activeSubs.length} activas + ${trialSubs.length} en trial)`);

        for (const sub of candidates) {
            results.checked++;

            try {
                const expiration = new Date(sub.fecha_expiracion);

                // ── GUARDIA: trial con fecha_expiracion > MAX_TRIAL_DAYS desde fecha_inicio ──
                // Esto detecta los bugs históricos (trials de años)
                if (sub.estado === 'en_prueba' && sub.fecha_inicio) {
                    const inicio = new Date(sub.fecha_inicio);
                    const diffDays = (expiration - inicio) / (1000 * 60 * 60 * 24);
                    if (diffDays > MAX_TRIAL_DAYS) {
                        console.warn(`🚨 Trial anómalo detectado sub ${sub.id}: ${Math.round(diffDays)} días (máx ${MAX_TRIAL_DAYS}). Expirando.`);
                        // No skippear — forzar expiración abajo
                        results.skipped_trial_cap++;
                        // Corregir la fecha de expiración a hoy para que caiga en el bloque de expiración
                        // (simplemente no hacemos continue, la lógica abajo la expirará)
                    }
                }

                // ── SKIP si tiene regalo vigente ──
                if (sub.gifted_until) {
                    const giftedUntil = new Date(sub.gifted_until);
                    if (giftedUntil > now) {
                        console.log(`🎁 Sub ${sub.id} tiene regalo vigente hasta ${sub.gifted_until} — skip`);
                        results.skipped_gift++;
                        continue;
                    }
                }

                // ── Si aún no ha expirado, skip normal ──
                if (expiration > now) {
                    // Pero si es trial anómalo (capturado arriba), continuar igualmente
                    if (sub.estado === 'en_prueba' && sub.fecha_inicio) {
                        const inicio = new Date(sub.fecha_inicio);
                        const diffDays = (expiration - inicio) / (1000 * 60 * 60 * 24);
                        if (diffDays <= MAX_TRIAL_DAYS) {
                            continue; // Trial legítimo, aún vigente
                        }
                        // Trial anómalo: caer al bloque de expiración aunque fecha_expiracion sea futura
                        console.warn(`🚨 Forzando expiración de trial anómalo: sub ${sub.id}`);
                    } else {
                        continue; // Suscripción activa legítima, aún vigente
                    }
                }

                // ── Intentar renovar si tiene Stripe y renovación automática ──
                if (sub.renovacion_automatica && sub.metodo_pago === 'stripe' && sub.stripe_subscription_id) {
                    console.log(`🔄 Verificando renovación Stripe para sub ${sub.id}...`);
                    try {
                        const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);

                        // Si Stripe la tiene activa/trialing y la fecha de Stripe es futura, está renovada
                        if (['active', 'trialing'].includes(stripeSub.status)) {
                            const stripeExpiration = new Date(stripeSub.current_period_end * 1000);
                            if (stripeExpiration > now) {
                                // Sincronizar fecha con Stripe — ya se renovó automáticamente
                                await base44.asServiceRole.entities.Subscription.update(sub.id, {
                                    fecha_expiracion: stripeExpiration.toISOString(),
                                    estado: stripeSub.status === 'trialing' ? 'en_prueba' : 'activo',
                                    fecha_ultima_renovacion: new Date().toISOString()
                                });
                                console.log(`✅ Sub ${sub.id} renovada automáticamente por Stripe hasta ${stripeExpiration.toISOString()}`);
                                results.renewed++;
                                continue;
                            }
                        }
                        // Si Stripe la tiene cancelada o expirada, caer al bloque de expiración
                        console.log(`⚠️ Stripe confirma expiración sub ${sub.id}: status=${stripeSub.status}`);
                    } catch (stripeErr) {
                        console.warn(`⚠️ Error consultando Stripe para sub ${sub.id}: ${stripeErr.message} — expirando igualmente`);
                    }
                }

                // ── EXPIRAR la suscripción ──
                console.log(`❌ Expirando sub ${sub.id} (user: ${sub.user_id}, estado: ${sub.estado}, expiraba: ${sub.fecha_expiracion})`);

                await base44.asServiceRole.entities.Subscription.update(sub.id, {
                    estado: 'expirado'
                });

                // Ocultar perfil profesional
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: sub.user_id
                });

                if (profiles.length > 0) {
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: false,
                        estado_perfil: 'inactivo'
                    });
                    console.log(`🔒 Perfil ocultado: ${profiles[0].business_name || sub.user_id}`);
                }

                results.expired++;

            } catch (err) {
                console.error(`❌ Error procesando sub ${sub.id}:`, err.message);
                results.errors.push({ subscription_id: sub.id, error: err.message });
            }
        }

        // 2️⃣ Validar y corregir trials anómalos aún pendientes (por si el filtro perdió alguno)
        // (ya manejado arriba con el guard de MAX_TRIAL_DAYS)

        console.log('✅ ========== FINALIZADO ==========');
        console.log('📊 Resultados:', results);

        return Response.json({
            success: true,
            timestamp: now.toISOString(),
            results
        });

    } catch (error) {
        console.error('❌ Error crítico en expireSubscriptions:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});