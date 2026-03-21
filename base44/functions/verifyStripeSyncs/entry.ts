import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

/**
 * 🔍 FUNCIÓN DE SINCRONIZACIÓN STRIPE
 * 
 * Verifica todas las suscripciones en Stripe y en la base de datos
 * para detectar y corregir desincronizaciones.
 * 
 * Casos que maneja:
 * 1. Suscripciones activas en Stripe pero canceladas en BD → Cancelar en Stripe
 * 2. Suscripciones canceladas en Stripe pero activas en BD → Actualizar BD
 * 3. Suscripciones sin stripe_subscription_id → Reportar
 * 4. Suscripciones en Stripe sin registro en BD → Reportar
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // ✅ Solo admin puede ejecutar esta función
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
        }

        console.log(`\n🔍 ========== VERIFICACIÓN DE SINCRONIZACIÓN STRIPE ==========`);
        console.log(`⏰ Fecha: ${new Date().toISOString()}`);
        console.log(`👤 Ejecutado por: ${user.email}\n`);

        const issues = [];
        const fixed = [];
        const stats = {
            total_db_subscriptions: 0,
            total_stripe_subscriptions: 0,
            active_in_stripe: 0,
            active_in_db: 0,
            mismatches: 0,
            fixed: 0,
            errors: 0
        };

        // 1️⃣ Obtener todas las suscripciones de la BD
        console.log('📊 Cargando suscripciones desde base de datos...');
        const dbSubscriptions = await base44.asServiceRole.entities.Subscription.list();
        stats.total_db_subscriptions = dbSubscriptions.length;
        console.log(`✅ ${dbSubscriptions.length} suscripciones encontradas en BD`);

        // 2️⃣ Obtener todas las suscripciones activas de Stripe
        console.log('\n💳 Cargando suscripciones desde Stripe...');
        const stripeSubscriptions = await stripe.subscriptions.list({
            limit: 100,
            status: 'all' // Incluir todas, no solo activas
        });
        stats.total_stripe_subscriptions = stripeSubscriptions.data.length;
        console.log(`✅ ${stripeSubscriptions.data.length} suscripciones encontradas en Stripe\n`);

        // 3️⃣ Verificar cada suscripción de la BD
        console.log('🔄 Verificando suscripciones de la BD contra Stripe...\n');
        
        for (const dbSub of dbSubscriptions) {
            const dbState = dbSub.estado?.toLowerCase().trim();
            const isActiveInDB = ['activo', 'active', 'en_prueba', 'trialing', 'trial_active'].includes(dbState);
            
            if (isActiveInDB) {
                stats.active_in_db++;
            }

            // Si no tiene stripe_subscription_id
            if (!dbSub.stripe_subscription_id) {
                issues.push({
                    type: 'missing_stripe_id',
                    subscription_id: dbSub.id,
                    user_id: dbSub.user_id,
                    estado: dbSub.estado,
                    message: 'Suscripción sin stripe_subscription_id'
                });
                console.log(`⚠️ Suscripción ${dbSub.id} no tiene stripe_subscription_id`);
                continue;
            }

            // Buscar en Stripe
            const stripeSub = stripeSubscriptions.data.find(s => s.id === dbSub.stripe_subscription_id);

            if (!stripeSub) {
                // Suscripción en BD pero no en Stripe
                issues.push({
                    type: 'not_in_stripe',
                    subscription_id: dbSub.id,
                    stripe_subscription_id: dbSub.stripe_subscription_id,
                    user_id: dbSub.user_id,
                    message: 'Suscripción no encontrada en Stripe'
                });
                console.log(`⚠️ Suscripción ${dbSub.stripe_subscription_id} no encontrada en Stripe`);
                continue;
            }

            // Verificar estado
            const isActiveInStripe = stripeSub.status === 'active' || stripeSub.status === 'trialing';
            
            if (isActiveInStripe) {
                stats.active_in_stripe++;
            }

            // 🚨 DESINCRONIZACIÓN DETECTADA
            if (isActiveInDB && !isActiveInStripe) {
                // BD dice activo pero Stripe dice cancelado/expirado
                console.log(`❌ MISMATCH: DB activo, Stripe ${stripeSub.status}`);
                console.log(`   - DB ID: ${dbSub.id}`);
                console.log(`   - Stripe ID: ${stripeSub.id}`);
                console.log(`   - User: ${dbSub.user_id}`);
                
                stats.mismatches++;
                issues.push({
                    type: 'db_active_stripe_inactive',
                    subscription_id: dbSub.id,
                    stripe_subscription_id: stripeSub.id,
                    user_id: dbSub.user_id,
                    db_state: dbSub.estado,
                    stripe_status: stripeSub.status,
                    message: 'BD activo pero Stripe inactivo/cancelado'
                });

                // ✅ AUTO-FIX: Actualizar BD
                try {
                    await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                        estado: stripeSub.status === 'canceled' ? 'cancelado' : 'expirado',
                        renovacion_automatica: false
                    });
                    
                    fixed.push({
                        subscription_id: dbSub.id,
                        action: 'updated_db_status',
                        new_status: stripeSub.status === 'canceled' ? 'cancelado' : 'expirado'
                    });
                    
                    stats.fixed++;
                    console.log(`   ✅ BD actualizado a: ${stripeSub.status === 'canceled' ? 'cancelado' : 'expirado'}\n`);
                } catch (error) {
                    console.log(`   ❌ Error actualizando BD: ${error.message}\n`);
                    stats.errors++;
                }

            } else if (!isActiveInDB && isActiveInStripe && dbState === 'cancelado') {
                // BD dice cancelado pero Stripe dice activo
                console.log(`❌ MISMATCH: DB cancelado, Stripe activo`);
                console.log(`   - DB ID: ${dbSub.id}`);
                console.log(`   - Stripe ID: ${stripeSub.id}`);
                console.log(`   - User: ${dbSub.user_id}`);
                
                stats.mismatches++;
                issues.push({
                    type: 'db_canceled_stripe_active',
                    subscription_id: dbSub.id,
                    stripe_subscription_id: stripeSub.id,
                    user_id: dbSub.user_id,
                    db_state: dbSub.estado,
                    stripe_status: stripeSub.status,
                    message: 'BD cancelado pero Stripe sigue activo'
                });

                // ✅ AUTO-FIX: Cancelar en Stripe
                try {
                    await stripe.subscriptions.update(stripeSub.id, {
                        cancel_at_period_end: true,
                        metadata: {
                            auto_canceled_by: 'sync_function',
                            reason: 'db_marked_as_canceled',
                            synced_at: new Date().toISOString()
                        }
                    });
                    
                    fixed.push({
                        subscription_id: dbSub.id,
                        stripe_subscription_id: stripeSub.id,
                        action: 'canceled_in_stripe',
                        cancel_at_period_end: true
                    });
                    
                    stats.fixed++;
                    console.log(`   ✅ Suscripción cancelada en Stripe (al final del período)\n`);
                } catch (error) {
                    console.log(`   ❌ Error cancelando en Stripe: ${error.message}\n`);
                    stats.errors++;
                }
            } else {
                console.log(`✅ SINCRONIZADO: ${stripeSub.id} - DB: ${dbSub.estado}, Stripe: ${stripeSub.status}`);
            }
        }

        // 4️⃣ Verificar suscripciones de Stripe sin registro en BD
        console.log('\n🔄 Verificando suscripciones de Stripe sin registro en BD...\n');
        
        for (const stripeSub of stripeSubscriptions.data) {
            const existsInDB = dbSubscriptions.some(db => db.stripe_subscription_id === stripeSub.id);
            
            if (!existsInDB && (stripeSub.status === 'active' || stripeSub.status === 'trialing')) {
                console.log(`⚠️ Suscripción activa en Stripe sin registro en BD: ${stripeSub.id}`);
                console.log(`   - Customer: ${stripeSub.customer}`);
                console.log(`   - Status: ${stripeSub.status}`);
                console.log(`   - Plan: ${stripeSub.items.data[0]?.price.id}\n`);
                
                issues.push({
                    type: 'stripe_only',
                    stripe_subscription_id: stripeSub.id,
                    customer_id: stripeSub.customer,
                    status: stripeSub.status,
                    message: 'Suscripción activa en Stripe sin registro en BD'
                });
            }
        }

        console.log(`\n✅ ========== VERIFICACIÓN COMPLETADA ==========\n`);
        console.log(`📊 ESTADÍSTICAS:`);
        console.log(`   - Total suscripciones BD: ${stats.total_db_subscriptions}`);
        console.log(`   - Total suscripciones Stripe: ${stats.total_stripe_subscriptions}`);
        console.log(`   - Activas en BD: ${stats.active_in_db}`);
        console.log(`   - Activas en Stripe: ${stats.active_in_stripe}`);
        console.log(`   - Desincronizaciones: ${stats.mismatches}`);
        console.log(`   - Corregidas: ${stats.fixed}`);
        console.log(`   - Errores: ${stats.errors}`);
        console.log(`   - Problemas detectados: ${issues.length}\n`);

        return Response.json({
            ok: true,
            stats,
            issues,
            fixed,
            message: `Verificación completada. ${stats.mismatches} desincronizaciones detectadas, ${stats.fixed} corregidas.`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error en verificación de sincronización:', error);
        return Response.json({
            ok: false,
            error: 'Error al verificar sincronización',
            details: error.message
        }, { status: 500 });
    }
});