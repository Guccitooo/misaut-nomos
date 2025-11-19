import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useLanguage } from "../ui/LanguageSwitcher";

export default function SubscriptionStatus({ subscription, plan }) {
  const { t } = useLanguage();
  
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
      label: t('trial'),
      message: `${daysRemaining} ${t('daysRemainingTrial')}`
    },
    'activo': {
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800 border-green-300',
      label: t('active'),
      message: `${t('renewalExpiration')}: ${expirationDate.toLocaleDateString()}`
    },
    'cancelado': {
      icon: AlertCircle,
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      label: t('canceled'),
      message: `${t('accessUntil')} ${expirationDate.toLocaleDateString()}`
    }
  };

  const config = statusConfig[subscription.estado] || statusConfig['activo'];
  const Icon = config.icon;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t('currentPlan')}</h3>
            <p className="text-2xl font-bold text-blue-700">{subscription.plan_nombre}</p>
          </div>
          <Badge className={`${config.color} border flex items-center gap-1 px-3 py-1`}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center py-2 border-t border-gray-200">
            <span className="text-gray-600">{t('currentPlan')}</span>
            <span className="font-semibold text-gray-900">{config.message}</span>
          </div>

          {isTrial && daysRemaining > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-blue-900 font-medium">
                💡 {t('trialActive')}
              </p>
            </div>
          )}

          {subscription.cancel_at_period_end && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-orange-900 font-medium">
                ⚠️ {t('subscriptionCanceledActive')} {expirationDate.toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}