import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle, Loader2, ArrowRight, Eye, MessageSquare, FileText, CreditCard, Users, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Activando tu cuenta profesional...");
  const [planDetails, setPlanDetails] = useState(null);
  const hasProcessed = useRef(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    processPayment();
  }, []);

  const processPayment = async () => {
    try {
      // Limpiar cache
      sessionStorage.removeItem('current_user');
      
      // Obtener usuario
      const user = await base44.auth.me();
      if (!user) {
        setStatus("error");
        setMessage("No se encontró tu sesión. Por favor inicia sesión.");
        return;
      }

      console.log('👤 Usuario:', user.email);
      setMessage("Verificando pago con Stripe...");

      // ✅ LLAMAR A LA FUNCIÓN QUE SINCRONIZA CON STRIPE Y CREA LA SUSCRIPCIÓN
      let syncResult = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        try {
          const response = await base44.functions.invoke('syncStripeSubscription', {
            sessionId: sessionId
          });
          syncResult = response.data;
          console.log('🔄 Sync resultado:', syncResult);
          
          // Guardar detalles del plan
          if (syncResult?.subscription) {
            setPlanDetails({
              planName: syncResult.subscription.plan_nombre || 'Plan Profesional',
              planPrice: syncResult.subscription.plan_precio || 30,
              trialEnd: syncResult.subscription.fecha_expiracion,
              status: syncResult.subscription.estado
            });
          }
          
          if (syncResult?.subscription?.active) {
            break;
          }
        } catch (e) {
          console.log('Intento', attempts + 1, 'fallido:', e.message);
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setMessage(`Esperando confirmación de Stripe... (${attempts}/${maxAttempts})`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      
      // ✅ ENVIAR EMAIL DE CONFIRMACIÓN
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: '🎉 ¡Bienvenido a MisAutónomos Pro!',
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1d4ed8; text-align: center;">¡Bienvenido a MisAutónomos Pro!</h1>
              
              <div style="background: #f0f9ff; border-left: 4px solid #1d4ed8; padding: 20px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Tu suscripción está activa</h2>
                <p><strong>Plan:</strong> ${planDetails?.planName || 'Plan Profesional'}</p>
                <p><strong>Precio:</strong> ${planDetails?.planPrice || 30}€/mes</p>
                <p><strong>🎁 Trial gratis:</strong> 7 días sin cargo</p>
                <p style="margin-bottom: 0;">Tu primer cobro será después del período de prueba.</p>
              </div>

              <h3 style="color: #1e40af;">✨ Ahora puedes:</h3>
              <ul style="line-height: 1.8; color: #374151;">
                <li>🔍 Aparecer en las búsquedas de clientes</li>
                <li>💬 Recibir mensajes directos de clientes</li>
                <li>📄 Crear presupuestos profesionales ilimitados</li>
                <li>💰 Generar y enviar facturas electrónicas</li>
                <li>👥 Gestionar tu cartera de clientes con CRM</li>
                <li>📊 Acceder a tu panel de control profesional</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://misautonomos.es/ProfileOnboarding" 
                   style="background: #1d4ed8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  🚀 Completar mi perfil
                </a>
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #78350f;">
                  <strong>💡 Consejo:</strong> Completa tu perfil con fotos de tus trabajos y una descripción detallada para recibir más solicitudes de clientes.
                </p>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
                <p>¿Necesitas ayuda? Contacta con nosotros en <a href="mailto:soporte@misautonomos.es" style="color: #1d4ed8;">soporte@misautonomos.es</a></p>
                <p style="margin-top: 10px;">Puedes gestionar tu suscripción desde <a href="https://misautonomos.es/SubscriptionManagement" style="color: #1d4ed8;">tu panel de control</a></p>
              </div>
            </div>
          `
        });
        console.log('📧 Email de confirmación enviado');
      } catch (emailError) {
        console.error('❌ Error enviando email:', emailError);
        // No bloquear el flujo si falla el email
      }

      // ✅ VERIFICAR SUSCRIPCIÓN EN BD
      setMessage("Verificando suscripción...");
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      
      let hasSubscription = false;
      if (subs.length > 0) {
        const sub = subs[0];
        const estado = sub.estado?.toLowerCase();
        const fechaExp = new Date(sub.fecha_expiracion);
        const today = new Date();
        
        hasSubscription = (
          estado === 'activo' || 
          estado === 'en_prueba' || 
          estado === 'trialing' ||
          estado === 'active'
        ) && fechaExp >= today;
        
        console.log('📊 Suscripción encontrada:', estado, 'Activa:', hasSubscription);
      }

      // ✅ ACTUALIZAR USUARIO A PROFESIONAL
      if (user.user_type !== 'professionnel') {
        await base44.auth.updateMe({ user_type: 'professionnel' });
        console.log('✅ Usuario actualizado a professionnel');
      }

      // ✅ VERIFICAR PERFIL PROFESIONAL
      const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });
      const hasProfile = profiles.length > 0;
      const onboardingDone = hasProfile && profiles[0].onboarding_completed === true;

      console.log('📋 Perfil:', hasProfile, 'Onboarding:', onboardingDone);

      // Limpiar cache de nuevo
      sessionStorage.removeItem('current_user');

      // ✅ DETERMINAR DESTINO
      if (!hasSubscription) {
        // Sin suscripción activa - mostrar error pero permitir continuar
        setStatus("warning");
        setMessage("El pago está siendo procesado. Por favor completa tu perfil.");
        
        setTimeout(() => {
          if (!onboardingDone) {
            navigate(createPageUrl("ProfileOnboarding"));
          } else {
            navigate(createPageUrl("ProfessionalDashboard"));
          }
        }, 2000);
        return;
      }

      // ✅ ÉXITO - Redirigir automáticamente
      setStatus("success");
      
      if (onboardingDone) {
        setMessage("¡Todo listo! Redirigiendo a tu dashboard...");
        setTimeout(() => {
          navigate(createPageUrl("ProfessionalDashboard"));
        }, 1500);
      } else {
        setMessage("¡Pago confirmado! Ahora completa tu perfil profesional...");
        setTimeout(() => {
          navigate(createPageUrl("ProfileOnboarding"));
        }, 1500);
      }

    } catch (error) {
      console.error("Error:", error);
      setStatus("error");
      setMessage("Error al procesar. Por favor contacta con soporte.");
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      status === "success" ? "bg-gradient-to-br from-green-50 to-emerald-100" :
      status === "error" ? "bg-gradient-to-br from-red-50 to-orange-100" :
      status === "warning" ? "bg-gradient-to-br from-amber-50 to-yellow-100" :
      "bg-gradient-to-br from-blue-50 to-indigo-100"
    }`}>
      <Card className="max-w-md w-full shadow-2xl border-0">
        <CardContent className="p-8 text-center">
          {status === "processing" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Procesando tu pago
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              
              {/* What you get section */}
              <div className="bg-blue-50 rounded-xl p-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">¿Qué obtienes con tu suscripción?</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700">Perfil visible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">Contactos directos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-700">Facturas pro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-700">Cobros fáciles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span className="text-gray-700">Gestión clientes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                    <span className="text-gray-700">Panel Pro</span>
                  </div>
                </div>
                <Link to={createPageUrl("DashboardProInfo")} className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-3 inline-flex items-center">
                  Saber más <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-green-800 mb-2">
                🎉 ¡Pago confirmado!
              </h1>
              <p className="text-gray-600 mb-6">Tu cuenta profesional está activa</p>

              {planDetails && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 text-left border-2 border-blue-200">
                  <h3 className="font-bold text-gray-900 mb-3 text-center">📋 Resumen de tu plan</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Plan seleccionado:</span>
                      <span className="font-semibold text-gray-900">{planDetails.planName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Precio mensual:</span>
                      <span className="font-semibold text-gray-900">{planDetails.planPrice}€/mes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Estado:</span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Activo
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-xs text-blue-800 bg-blue-100 rounded-lg p-3 flex items-start gap-2">
                      <span>🎁</span>
                      <span><strong>7 días gratis:</strong> Disfruta de todas las funcionalidades sin cargo hasta que finalice tu período de prueba.</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Ya tienes acceso a:
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700">Perfil visible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">Chat clientes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-700">Facturación Pro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-700">Presupuestos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span className="text-gray-700">CRM Clientes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                    <span className="text-gray-700">Panel Pro</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => navigate(createPageUrl("ProfileOnboarding"))} 
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
                >
                  🚀 Completar mi perfil ahora
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(createPageUrl("ProfessionalDashboard"))}
                  className="w-full h-11"
                >
                  Ir a mi panel de control <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                📧 Revisa tu email para más detalles sobre tu suscripción
              </p>
            </>
          )}

          {status === "warning" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                <ArrowRight className="w-12 h-12 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-amber-800 mb-3">
                Procesando...
              </h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirigiendo...
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Hubo un problema
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate(createPageUrl("ProfileOnboarding"))} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Completar mi perfil
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(createPageUrl("SubscriptionManagement"))}
                  className="w-full"
                >
                  Ver mi suscripción
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}