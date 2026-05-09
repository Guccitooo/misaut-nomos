import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

const PRICE_IDS = {
  visibilidad: 'price_1TO0klFAwxaU0MzXHB0i53xP',
  ads_plus: 'price_1TO0kmFAwxaU0MzXB2ahPFnO'
};

const PLAN_NAMES = {
  visibilidad: 'Plan Visibilidad',
  ads_plus: 'Plan Ads+'
};

const COUPON_ID = 'FREE_MONTH_ADMIN';

async function ensureCoupon() {
  try {
    await stripe.coupons.retrieve(COUPON_ID);
  } catch (e) {
    if (e.statusCode === 404) {
      await stripe.coupons.create({
        id: COUPON_ID,
        percent_off: 100,
        duration: 'once',
        name: 'Mes gratis (admin)'
      });
      console.log('[grantFreeMonth] Cupón FREE_MONTH_ADMIN creado');
    } else {
      throw e;
    }
  }
}

async function sendGiftEmail(base44, toEmail, recipientName, planName, caseType, promoCode) {
  try {
    let subject, body;
    if (caseType === 'A') {
      subject = `🎁 Tu mes gratis en MisAutónomos — código: ${promoCode}`;
      body = `Hola,\n\nTe hemos enviado un mes gratis de ${planName} en MisAutónomos.\n\nTu código de promoción es: <strong>${promoCode}</strong>\n\nÚsalo al registrarte en https://misautonomos.es\n\n— Equipo MisAutónomos`;
    } else {
      subject = `🎁 ¡Te hemos regalado un mes gratis de ${planName}!`;
      body = `Hola ${recipientName || ''},\n\nComo cortesía del equipo de MisAutónomos, te hemos activado un mes gratis de <strong>${planName}</strong>.\n\nAccede a tu cuenta en https://misautonomos.es para disfrutarlo.\n\n— Equipo MisAutónomos`;
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: toEmail,
      subject,
      body,
      from_name: 'MisAutónomos'
    });
  } catch (e) {
    console.warn('[grantFreeMonth] Email no enviado:', e.message);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, plan = 'visibilidad' } = await req.json();
    if (!email) return Response.json({ error: 'email requerido' }, { status: 400 });
    if (!PRICE_IDS[plan]) return Response.json({ error: 'plan inválido (visibilidad | ads_plus)' }, { status: 400 });

    const normalizedEmail = email.trim().toLowerCase();
    const priceId = PRICE_IDS[plan];
    const planName = PLAN_NAMES[plan];
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await ensureCoupon();

    const users = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });

    // ─────────────────────────────────────────────
    // CASO A — El email NO existe en la plataforma
    // ─────────────────────────────────────────────
    if (users.length === 0) {
      const promoCode = await stripe.promotionCodes.create({
        coupon: COUPON_ID,
        max_redemptions: 1,
        code: `GIFT${Date.now().toString(36).toUpperCase()}`
      });

      await base44.asServiceRole.entities.FreeMonthGrant.create({
        email: normalizedEmail,
        user_type: 'no_existe',
        case: 'A',
        plan,
        stripe_object_id: promoCode.id,
        promo_code: promoCode.code,
        status: 'active',
        granted_by: user.email,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt
      });

      await sendGiftEmail(base44, normalizedEmail, null, planName, 'A', promoCode.code);

      const suggestedText = `Hola! 👋 Te enviamos un mes gratis de ${planName} en MisAutónomos.\n\nTu código: ${promoCode.code}\n\nRegístrate en https://misautonomos.es y aplícalo al elegir tu plan.\n\n¡Nos vemos dentro! — Equipo MisAutónomos`;

      return Response.json({
        ok: true,
        case: 'A',
        promo_code: promoCode.code,
        stripe_object_id: promoCode.id,
        suggested_message: suggestedText
      });
    }

    const foundUser = users[0];
    const userType = foundUser.user_type === 'professionnel' ? 'autonomo' : 'cliente';

    // Buscar o crear stripe_customer_id
    let stripeCustomerId = null;
    const subs = await base44.asServiceRole.entities.Subscription.filter({ user_id: foundUser.id });
    const activeSub = subs.find(s => s.estado === 'activo' && s.stripe_subscription_id);

    if (activeSub?.stripe_customer_id) {
      stripeCustomerId = activeSub.stripe_customer_id;
    } else if (subs[0]?.stripe_customer_id) {
      stripeCustomerId = subs[0].stripe_customer_id;
    } else {
      // Crear customer en Stripe
      const customer = await stripe.customers.create({
        email: normalizedEmail,
        name: foundUser.full_name || normalizedEmail,
        metadata: { base44_user_id: foundUser.id }
      });
      stripeCustomerId = customer.id;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CASO D — Autónomo CON suscripción activa → aplicar cupón directamente
    // ─────────────────────────────────────────────────────────────────────
    if (userType === 'autonomo' && activeSub) {
      await stripe.subscriptions.update(activeSub.stripe_subscription_id, {
        coupon: COUPON_ID
      });

      // Verificar invoice preview
      let amountDue = null;
      try {
        const upcoming = await stripe.invoices.retrieveUpcoming({
          subscription: activeSub.stripe_subscription_id
        });
        amountDue = upcoming.amount_due;
      } catch (e) {
        console.warn('No se pudo verificar invoice preview:', e.message);
      }

      await base44.asServiceRole.entities.FreeMonthGrant.create({
        email: normalizedEmail,
        user_type: 'autonomo',
        case: 'D',
        plan,
        stripe_object_id: activeSub.stripe_subscription_id,
        status: 'active',
        granted_by: user.email,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt
      });

      await sendGiftEmail(base44, normalizedEmail, foundUser.full_name, planName, 'D', null);

      return Response.json({
        ok: true,
        case: 'D',
        stripe_subscription_id: activeSub.stripe_subscription_id,
        amount_due_next: amountDue,
        message: `Cupón FREE_MONTH_ADMIN aplicado. Próxima factura: ${amountDue !== null ? (amountDue / 100).toFixed(2) + '€' : 'pendiente verificación'}`
      });
    }

    // ─────────────────────────────────────────────────────────────────────
    // CASO B (cliente) o CASO C (autónomo sin sub activa) → sub con trial 30d
    // ─────────────────────────────────────────────────────────────────────
    const grantCase = userType === 'cliente' ? 'B' : 'C';

    const newSub = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      trial_period_days: 30,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      metadata: {
        email: normalizedEmail,
        planId: plan === 'ads_plus' ? 'plan_adsplus' : 'plan_monthly',
        base44_user_id: foundUser.id,
        granted_by_admin: user.email
      },
      expand: ['latest_invoice']
    });

    // Guardar suscripción en BD (o actualizar si ya existe una)
    const subData = {
      user_id: foundUser.id,
      plan_id: plan === 'ads_plus' ? 'plan_adsplus' : 'plan_monthly',
      plan_nombre: planName,
      plan_precio: plan === 'ads_plus' ? 33 : 13,
      fecha_inicio: new Date(newSub.start_date * 1000).toISOString(),
      fecha_expiracion: new Date(newSub.trial_end * 1000).toISOString(),
      estado: 'en_prueba',
      renovacion_automatica: true,
      metodo_pago: 'stripe',
      stripe_subscription_id: newSub.id,
      stripe_customer_id: stripeCustomerId
    };

    if (subs.length > 0) {
      await base44.asServiceRole.entities.Subscription.update(subs[0].id, subData);
    } else {
      await base44.asServiceRole.entities.Subscription.create(subData);
    }

    // Para autónomos: activar perfil si lo tienen
    if (userType === 'autonomo') {
      const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: foundUser.id });
      if (profiles.length > 0) {
        await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
          estado_perfil: 'activo',
          visible_en_busqueda: true,
          is_ads_plus: plan === 'ads_plus'
        });
      }
    }

    await base44.asServiceRole.entities.FreeMonthGrant.create({
      email: normalizedEmail,
      user_type: userType,
      case: grantCase,
      plan,
      stripe_object_id: newSub.id,
      status: 'active',
      granted_by: user.email,
      granted_at: new Date().toISOString(),
      expires_at: new Date(newSub.trial_end * 1000).toISOString()
    });

    await sendGiftEmail(base44, normalizedEmail, foundUser.full_name, planName, grantCase, null);

    return Response.json({
      ok: true,
      case: grantCase,
      stripe_subscription_id: newSub.id,
      trial_end: new Date(newSub.trial_end * 1000).toISOString(),
      message: `Suscripción con trial 30 días creada en Stripe (${newSub.id})`
    });

  } catch (error) {
    console.error('[grantFreeMonth] Error:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});