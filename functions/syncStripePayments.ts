import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

/**
 * 🔥 SINCRONIZAR TODOS LOS PAGOS DE STRIPE
 * Trae todos los pagos históricos y los registra en PaymentRecord
 */

Deno.serve(async (req) => {
    console.log('💰 ========== SINCRONIZAR PAGOS DE STRIPE ==========');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar admin
        const admin = await base44.auth.me();
        if (!admin || admin.role !== 'admin') {
            return Response.json({ error: 'Solo administradores' }, { status: 403 });
        }

        // 1. Obtener TODAS las facturas pagadas de Stripe
        const invoices = await stripe.invoices.list({
            limit: 100,
            status: 'paid'
        });

        console.log(`📋 Facturas pagadas en Stripe: ${invoices.data.length}`);

        const results = {
            total_invoices: invoices.data.length,
            registered: 0,
            skipped: 0,
            errors: []
        };

        // 2. Obtener todos los usuarios
        const allUsers = await base44.asServiceRole.entities.User.list();
        const usersByEmail = new Map(allUsers.map(u => [u.email, u]));

        // 3. Obtener todos los planes
        const allPlans = await base44.asServiceRole.entities.SubscriptionPlan.list();

        // 4. Procesar cada factura
        for (const invoice of invoices.data) {
            try {
                // Buscar usuario por email
                const customerEmail = invoice.customer_email;
                const user = usersByEmail.get(customerEmail);

                if (!user) {
                    console.log(`⚠️ Usuario no encontrado: ${customerEmail}`);
                    results.skipped++;
                    continue;
                }

                // Verificar si ya existe este pago
                const existing = await base44.asServiceRole.entities.PaymentRecord.filter({
                    stripe_invoice_id: invoice.id
                });

                if (existing.length > 0) {
                    console.log(`⏭️ Pago ya registrado: ${invoice.id}`);
                    results.skipped++;
                    continue;
                }

                // Obtener suscripción si existe
                let subscription = null;
                let planId = 'plan_monthly_trial';
                let planNombre = 'Plan Mensual';

                if (invoice.subscription) {
                    try {
                        subscription = await stripe.subscriptions.retrieve(invoice.subscription);
                        
                        // Intentar determinar el plan
                        if (subscription.items.data[0]?.price?.id) {
                            const priceId = subscription.items.data[0].price.id;
                            const plan = allPlans.find(p => p.stripe_price_id === priceId);
                            if (plan) {
                                planId = plan.plan_id;
                                planNombre = plan.nombre;
                            }
                        }
                    } catch (err) {
                        console.log(`⚠️ No se pudo obtener suscripción: ${err.message}`);
                    }
                }

                // Crear registro de pago
                await base44.asServiceRole.entities.PaymentRecord.create({
                    user_id: user.id,
                    user_email: customerEmail,
                    stripe_invoice_id: invoice.id,
                    stripe_subscription_id: invoice.subscription || '',
                    stripe_payment_intent_id: invoice.payment_intent || '',
                    amount: invoice.amount_paid / 100,
                    currency: invoice.currency.toUpperCase(),
                    plan_id: planId,
                    plan_nombre: planNombre,
                    payment_date: new Date(invoice.created * 1000).toISOString(),
                    period_start: subscription 
                        ? new Date(subscription.current_period_start * 1000).toISOString()
                        : new Date(invoice.created * 1000).toISOString(),
                    period_end: subscription 
                        ? new Date(subscription.current_period_end * 1000).toISOString()
                        : new Date(new Date(invoice.created * 1000).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'succeeded',
                    is_trial: subscription?.status === 'trialing' || false,
                    metadata: {
                        invoice_number: invoice.number,
                        synced_from_stripe: true
                    }
                });

                console.log(`✅ Pago registrado: ${invoice.id} - ${user.email} - ${(invoice.amount_paid / 100).toFixed(2)}€`);
                results.registered++;

            } catch (err) {
                console.error(`❌ Error procesando factura ${invoice.id}:`, err.message);
                results.errors.push({
                    invoice_id: invoice.id,
                    error: err.message
                });
            }
        }

        console.log('\n📊 ========== RESUMEN ==========');
        console.log(`Total facturas: ${results.total_invoices}`);
        console.log(`Registradas: ${results.registered}`);
        console.log(`Omitidas: ${results.skipped}`);
        console.log(`Errores: ${results.errors.length}`);

        return Response.json({
            success: true,
            results
        });

    } catch (error) {
        console.error('❌ Error general:', error.message);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});