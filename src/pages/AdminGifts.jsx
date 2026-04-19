import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Gift, X, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import GiftUpgradeModal from '@/components/admin/GiftUpgradeModal';

export default function AdminGiftsPage() {
  const [user, setUser] = useState(null);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin') {
        window.location.href = '/buscar';
      } else {
        setUser(u);
      }
    });
  }, []);

  const { data: subscriptions = [], refetch, isLoading } = useQuery({
    queryKey: ['activeGifts'],
    queryFn: async () => {
      const all = await base44.entities.Subscription.filter({
        gifted_plan_id: { $ne: '' }
      });
      
      // Filtrar solo los activos (gifted_until en futuro)
      const now = new Date();
      const active = all.filter(s => s.gifted_until && new Date(s.gifted_until) > now);
      
      // Enriquecer con datos de usuario
      const enriched = await Promise.all(
        active.map(async (sub) => {
          try {
            const user = await base44.entities.User.get(sub.user_id);
            const admin = sub.gifted_by_admin_id ? await base44.entities.User.get(sub.gifted_by_admin_id) : null;
            return {
              ...sub,
              userName: user?.full_name || user?.email || 'Desconocido',
              userEmail: user?.email || '',
              adminName: admin?.full_name || admin?.email || 'Desconocido'
            };
          } catch (e) {
            return { ...sub, userName: 'Desconocido', userEmail: '', adminName: 'Desconocido' };
          }
        })
      );
      
      return enriched.sort((a, b) => new Date(b.gifted_until) - new Date(a.gifted_until));
    },
    enabled: !!user,
  });

  const revokeGift = async (subId) => {
    if (!confirm('¿Revocar el regalo? El usuario perderá el acceso al plan superior.')) return;
    
    try {
      await base44.entities.Subscription.update(subId, {
        gifted_plan_id: '',
        gifted_plan_name: '',
        gifted_until: null
      });
      toast.success('Regalo revocado');
      refetch();
    } catch (error) {
      toast.error('Error al revocar: ' + error.message);
    }
  };

  const extendGift = async (subId) => {
    try {
      const sub = subscriptions.find(s => s.id === subId);
      if (!sub) return;
      
      const newUntil = new Date(new Date(sub.gifted_until).getTime() + 30 * 24 * 60 * 60 * 1000);
      await base44.entities.Subscription.update(subId, { 
        gifted_until: newUntil.toISOString() 
      });
      toast.success('Regalo extendido 30 días');
      refetch();
    } catch (error) {
      toast.error('Error al extender: ' + error.message);
    }
  };

  const openGiftModal = (subscriber) => {
    setSelectedSubscriber(subscriber);
    setGiftModalOpen(true);
  };

  if (!user || isLoading) {
    return (
      <AdminLayout activeSection="gifts" onSectionChange={() => {}}>
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeSection="gifts" onSectionChange={() => {}}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🎁 Regalos activos</h1>
            <p className="text-sm text-gray-500 mt-1">
              Usuarios con planes regalados temporalmente
            </p>
          </div>
          <button 
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay regalos activos</p>
            <p className="text-sm text-gray-400 mt-1">
              Los regalos aparecerán aquí cuando un admin los conceda
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Usuario</th>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Plan regalado</th>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Plan real</th>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Expira</th>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Regalado por</th>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Motivo</th>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscriptions.map((gift) => (
                    <tr key={gift.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{gift.userName}</p>
                          <p className="text-xs text-gray-500">{gift.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          {gift.gifted_plan_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{gift.plan_nombre}</p>
                        <p className="text-xs text-gray-500">{gift.plan_precio}€/mes</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(gift.gifted_until).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.ceil((new Date(gift.gifted_until) - new Date()) / (1000 * 60 * 60 * 24))} días restantes
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {gift.adminName}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 max-w-xs truncate" title={gift.gift_reason}>
                          {gift.gift_reason || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => extendGift(gift.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            +30 días
                          </button>
                          <button 
                            onClick={() => revokeGift(gift.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Revocar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {giftModalOpen && selectedSubscriber && (
        <GiftUpgradeModal
          subscriber={selectedSubscriber}
          onClose={() => {
            setGiftModalOpen(false);
            setSelectedSubscriber(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </AdminLayout>
  );
}