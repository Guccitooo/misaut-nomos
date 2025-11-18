import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function SubscriptionStatus({ subscription, plan }) {
  if (!subscription) return null;

  const isActive = subscription.estado === 'activo' || subscription.estado === 'en_prueba';
  const isTrial = subscription.estado === 'en_prueba';
  const expirationDate = new Date(subscription.fecha_expiracion);
  const today = new Date();
  const daysRemaining = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

  const statusConfig = {
    'en_prueba': {
      icon: Clock,
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      label: 'Periodo gratuito',
      message: `Te quedan ${daysRemaining} días gratis`
    },
    'activo': {
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800 border-green-300',
      label: 'Suscripción activa',
      message: `Renovación: ${expirationDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
    },
    'cancelado': {
      icon: AlertCircle,
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      label: 'Cancelado',
      message: `Activo hasta: ${expirationDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
    }
  };

  const config = statusConfig[subscription.estado] || statusConfig['activo'];
  const Icon = config.icon;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Tu Plan</h3>
            <p className="text-2xl font-bold text-blue-700">{subscription.plan_nombre}</p>
          </div>
          <Badge className={`${config.color} border flex items-center gap-1 px-3 py-1`}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center py-2 border-t border-gray-200">
            <span className="text-gray-600">Estado</span>
            <span className="font-semibold text-gray-900">{config.message}</span>
          </div>

          {isTrial && daysRemaining > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-blue-900 font-medium">
                💡 Disfruta de tu periodo gratuito de 2 meses. Puedes cancelar en cualquier momento.
              </p>
            </div>
          )}

          {subscription.cancel_at_period_end && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-orange-900 font-medium">
                ⚠️ Tu suscripción se cancelará automáticamente el {expirationDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}