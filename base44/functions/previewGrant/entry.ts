import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) return Response.json({ error: 'email requerido' }, { status: 400 });

    const normalizedEmail = email.trim().toLowerCase();

    // Buscar usuario en BD
    const users = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });

    if (users.length === 0) {
      return Response.json({
        case: 'A',
        label: 'Usuario NO existe en la plataforma',
        description: 'Se generará un PromotionCode de 1 uso para que lo redima al registrarse.',
        email: normalizedEmail,
        user: null,
        subscription: null
      });
    }

    const foundUser = users[0];
    const userType = foundUser.user_type === 'professionnel' ? 'autonomo' : 'cliente';

    // Buscar suscripción
    const subs = await base44.asServiceRole.entities.Subscription.filter({ user_id: foundUser.id });
    const activeSub = subs.find(s => s.estado === 'activo' && s.stripe_subscription_id);

    if (userType === 'cliente') {
      return Response.json({
        case: 'B',
        label: 'Cliente registrado, sin suscripción de autónomo',
        description: 'Se creará una suscripción con 30 días de trial gratuito sin necesidad de tarjeta.',
        email: normalizedEmail,
        user: { id: foundUser.id, full_name: foundUser.full_name, user_type: userType },
        subscription: null
      });
    }

    if (!activeSub) {
      return Response.json({
        case: 'C',
        label: 'Autónomo SIN suscripción activa',
        description: 'Se creará una suscripción con 30 días de trial gratuito sin necesidad de tarjeta.',
        email: normalizedEmail,
        user: { id: foundUser.id, full_name: foundUser.full_name, user_type: userType },
        subscription: null
      });
    }

    // Caso D: autónomo con sub activa — verificar en Stripe
    let stripePreview = null;
    try {
      const upcoming = await stripe.invoices.retrieveUpcoming({
        subscription: activeSub.stripe_subscription_id,
        subscription_items: [{ id: undefined }],
        coupon: 'FREE_MONTH_ADMIN'
      });
      stripePreview = { amount_due: upcoming.amount_due, currency: upcoming.currency };
    } catch (e) {
      console.warn('No se pudo obtener invoice preview:', e.message);
    }

    return Response.json({
      case: 'D',
      label: 'Autónomo CON suscripción activa',
      description: `Se aplicará el cupón FREE_MONTH_ADMIN a la suscripción activa. ${stripePreview ? `Próxima factura: ${(stripePreview.amount_due / 100).toFixed(2)}€` : ''}`,
      email: normalizedEmail,
      user: { id: foundUser.id, full_name: foundUser.full_name, user_type: userType },
      subscription: {
        id: activeSub.id,
        stripe_subscription_id: activeSub.stripe_subscription_id,
        plan_nombre: activeSub.plan_nombre,
        fecha_expiracion: activeSub.fecha_expiracion
      },
      stripe_preview: stripePreview
    });

  } catch (error) {
    console.error('[previewGrant] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});