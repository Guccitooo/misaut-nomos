import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const DISMISSED_KEY = "notif_banner_dismissed";
const DELAY_MS = 2 * 60 * 1000; // 2 minutos

export default function NotificationPermissionBanner({ user }) {
  const [show, setShow] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificaciones rápidas antes de setear el timer
    if (!user) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(DISMISSED_KEY) === "true") return;

    const timer = setTimeout(() => {
      // Re-verificar por si cambió mientras esperábamos
      if (Notification.permission === "default" && localStorage.getItem(DISMISSED_KEY) !== "true") {
        setShow(true);
      }
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [user]);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setShow(false);
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            // applicationServerKey se añadirá en fase 2 con claves VAPID
          });

          await base44.auth.updateMe({
            push_token: JSON.stringify(subscription),
            push_enabled: true,
            push_last_activated: new Date().toISOString(),
          });

          toast({
            title: "✓ Notificaciones activadas",
            description: "Te avisaremos cuando te contacten o envíen solicitudes.",
          });
        } catch (subErr) {
          // Falló la suscripción push pero el permiso está concedido — no es crítico
          console.warn("No se pudo crear suscripción push:", subErr);
          toast({
            title: "✓ Notificaciones activadas",
            description: "Recibirás avisos cuando uses la app.",
          });
        }
      }

      localStorage.setItem(DISMISSED_KEY, "true");
      setShow(false);
    } catch (err) {
      console.error("Error solicitando permisos de notificación:", err);
      dismiss();
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50 animate-fade-in"
      role="dialog"
      aria-label="Activar notificaciones"
    >
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 pr-4">
          <h3 className="font-semibold text-gray-900 text-sm">No te pierdas ningún cliente</h3>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            Recibe avisos instantáneos cuando te contacten o te envíen una solicitud.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={requestPermission}
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Activar
            </button>
            <button
              onClick={dismiss}
              className="px-3 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}