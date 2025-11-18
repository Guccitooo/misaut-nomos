import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const CURRENT_LEGAL_VERSION = 'cookies-v1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const {
            consentId,
            userId,
            acceptedEssential,
            acceptedAnalytics,
            acceptedMarketing,
            language,
            legalVersion
        } = await req.json();

        if (!consentId) {
            return Response.json({ error: 'consent_id is required' }, { status: 400 });
        }

        const ipAddress = req.headers.get('x-forwarded-for') || 
                         req.headers.get('x-real-ip') || 
                         'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        const existingConsents = await base44.asServiceRole.entities.CookieConsent.filter({
            consent_id: consentId
        });

        const consentData = {
            consent_id: consentId,
            user_id: userId || null,
            ip_address: ipAddress,
            user_agent: userAgent,
            accepted_essential: acceptedEssential !== false,
            accepted_analytics: acceptedAnalytics === true,
            accepted_marketing: acceptedMarketing === true,
            legal_version: legalVersion || CURRENT_LEGAL_VERSION,
            language: language || 'es',
            consent_timestamp: new Date().toISOString()
        };

        if (existingConsents.length > 0) {
            await base44.asServiceRole.entities.CookieConsent.update(
                existingConsents[0].id,
                consentData
            );
        } else {
            await base44.asServiceRole.entities.CookieConsent.create(consentData);
        }

        return Response.json({ 
            success: true,
            consentId: consentId,
            legalVersion: legalVersion || CURRENT_LEGAL_VERSION
        });
    } catch (error) {
        console.error('Error saving cookie consent:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});