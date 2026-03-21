import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Solo admins pueden crear cupones
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
        }

        const { code, percentOff, durationInMonths, maxRedemptions } = await req.json();

        // Crear cupón del 100% de descuento
        const coupon = await stripe.coupons.create({
            percent_off: percentOff || 100,
            duration: durationInMonths ? 'repeating' : 'forever',
            duration_in_months: durationInMonths || undefined,
            max_redemptions: maxRedemptions || undefined,
            name: code || 'FREE100',
        });

        // Crear código promocional asociado al cupón
        const promotionCode = await stripe.promotionCodes.create({
            coupon: coupon.id,
            code: code || 'FREE100',
            max_redemptions: maxRedemptions || undefined,
        });

        return Response.json({ 
            success: true, 
            coupon: coupon,
            promotionCode: promotionCode,
            message: `Código "${promotionCode.code}" creado con ${coupon.percent_off}% de descuento`
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});