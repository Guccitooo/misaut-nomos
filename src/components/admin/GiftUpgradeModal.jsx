import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Gift, X } from 'lucide-react';
import { toast } from 'sonner';

export default function GiftUpgradeModal({ subscriber, onClose, onSuccess }) {
  const [giftPlan, setGiftPlan] = useState('plan_adsplus');
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plans = {
    'plan_trial': { name: 'Plan Trial', price: 0 },
    'plan_visibility': { name: 'Plan Visibilidad', price: 13 },
    'plan_adsplus': { name: 'Plan Ads+', price: 33 }
  };

  const currentPlan = plans[subscriber.plan_id] || { name: subscriber.plan_nombre || 'Desconocido', price: subscriber.plan_precio ?? 0 };
  const targetPlan = plans[giftPlan];

  const handleGift = async () => {
    if (!reason.trim()) {
      setError('Añade un motivo interno para el regalo');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const giftedUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

      // Usar backend function con asServiceRole para poder actualizar suscripción de otro usuario
      const response = await base44.functions.invoke('giftUpgrade', {
        subscriptionId: subscriber.id,
        giftedPlanId: giftPlan,
        giftedPlanName: targetPlan.name,
        giftedUntil: giftedUntil.toISOString(),
        giftReason: reason.trim()
      });

      if (!response.data?.ok) {
        throw new Error(response.data?.error || 'Error desconocido');
      }

      // Enviar notificación
      try {
        await base44.functions.invoke('sendGiftNotification', {
          userId: subscriber.user_id,
          giftedPlanName: targetPlan.name,
          giftedUntil: giftedUntil.toISOString(),
          originalPlanName: currentPlan.name,
          duration,
          giftedPlanId: giftPlan
        });
      } catch (e) {
        console.error('Error sending notification:', e);
      }

      toast.success('Upgrade regalado correctamente');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError('Error al aplicar regalo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-600"/>
            <h2 className="text-lg font-semibold text-gray-900">Regalar upgrade</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs">
          <p className="mb-1"><strong>Usuario:</strong> {subscriber.name || subscriber.email}</p>
          <p className="mb-1"><strong>Email:</strong> {subscriber.email}</p>
          <p><strong>Plan actual:</strong> {currentPlan.name}</p>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">Plan a regalar</label>
        <select 
          value={giftPlan} 
          onChange={e => setGiftPlan(e.target.value)} 
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
        >
          <option value="plan_adsplus">Plan Ads+ (33€/mes)</option>
          <option value="plan_visibility">Plan Visibilidad (13€/mes)</option>
        </select>

        <label className="block text-sm font-medium text-gray-700 mb-1">Duración del regalo</label>
        <select 
          value={duration} 
          onChange={e => setDuration(parseInt(e.target.value))} 
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
        >
          <option value={7}>7 días</option>
          <option value={15}>15 días</option>
          <option value={30}>1 mes (30 días)</option>
          <option value={60}>2 meses (60 días)</option>
          <option value={90}>3 meses (90 días)</option>
          <option value={180}>6 meses (180 días)</option>
          <option value={365}>1 año</option>
        </select>

        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo interno <span className="text-red-500">*</span></label>
        <textarea 
          value={reason} 
          onChange={e => { setReason(e.target.value); setError(''); }}
          placeholder="Ej: Cortesía por problema técnico, campaña marketing, cliente VIP..."
          rows={2}
          className={`w-full border rounded-lg px-3 py-2 text-sm mb-2 ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
        />
        {error && <p className="text-red-600 text-xs mb-3 font-medium">⚠️ {error}</p>}

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 mb-4">
          <strong>ℹ️ Importante:</strong><br/>
          • El usuario verá beneficios de {targetPlan?.name} durante {duration} días<br/>
          • Stripe NO cambiará — se le sigue cobrando {currentPlan.name}<br/>
          • Recibirá email y notificación push del regalo<br/>
          • Al expirar, volverá automáticamente a {currentPlan.name}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={onClose} 
            disabled={loading} 
            className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button 
            onClick={handleGift} 
            disabled={loading} 
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Aplicando...' : 'Regalar upgrade'}
          </button>
        </div>
      </div>
    </div>
  );
}