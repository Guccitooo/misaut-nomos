import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

function MethodBadge({ method }) {
  if (!method) return <span className="text-gray-400 text-xs">—</span>;
  const labels = { trial_extended: "Trial +30d", balance_credit: "Crédito factura" };
  const colors = { trial_extended: "bg-blue-50 text-blue-700", balance_credit: "bg-purple-50 text-purple-700" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${colors[method] || 'bg-gray-100 text-gray-600'}`}>{labels[method] || method}</span>;
}

export default function AdminReferralsPage() {
  const [user, setUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);
  const [stripeKeyMissing, setStripeKeyMissing] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === 'admin') loadReferrals();
    });
  }, []);

  const loadReferrals = async () => {
    setLoading(true);
    const all = await base44.entities.Referral.filter({ status: 'rewarded' }, '-rewarded_at', 100);
    setReferrals(all);
    setLoading(false);
  };

  const retryStripe = async (ref) => {
    setRetrying(ref.id);
    try {
      const res = await base44.functions.invoke('applyStripeReferralReward', { referrerId: ref.referrer_id });
      const result = res.data;

      if (result.error === 'missing_api_key') {
        setStripeKeyMissing(true);
      }

      if (result.success) {
        // Actualizar el registro en BD
        await base44.entities.Referral.update(ref.id, {
          stripe_reward_applied: true,
          stripe_reward_method: result.method,
          stripe_reward_details: JSON.stringify(result)
        });
        await loadReferrals();
      } else {
        alert(`Error Stripe: ${result.error} — ${result.reason || result.message || ''}`);
      }
    } catch (e) {
      alert('Error al contactar con Stripe: ' + e.message);
    } finally {
      setRetrying(null);
    }
  };

  if (!user || user.role !== 'admin') return null;

  const stripeOk = referrals.filter(r => r.stripe_reward_applied).length;
  const stripeFail = referrals.filter(r => !r.stripe_reward_applied).length;

  return (
    <AdminLayout currentSection="referrals">
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recompensas de Referidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Auditoría de aplicación en Stripe de las recompensas de referidos</p>
        </div>

        {/* Banner si no hay clave Stripe */}
        {stripeKeyMissing && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <div>
              <strong>STRIPE_SECRET_KEY no configurada.</strong> Las recompensas solo se aplican internamente en la app, no en Stripe real.
              Ve a Base44 → Settings → Variables de entorno y añade <code className="bg-amber-100 px-1 rounded">STRIPE_SECRET_KEY = sk_live_...</code>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total recompensas</p>
            <p className="text-2xl font-bold text-gray-900">{referrals.length}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs text-green-700 mb-1">Aplicadas en Stripe</p>
            <p className="text-2xl font-bold text-green-800">{stripeOk}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs text-red-700 mb-1">Solo crédito interno</p>
            <p className="text-2xl font-bold text-red-800">{stripeFail}</p>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Historial de recompensas</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-700 rounded-full mx-auto" />
            </div>
          ) : referrals.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hay recompensas aún</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium">Referidor</th>
                  <th className="text-left px-5 py-3 font-medium">Referido</th>
                  <th className="text-left px-3 py-3 font-medium">Stripe</th>
                  <th className="text-left px-3 py-3 font-medium">Método</th>
                  <th className="text-left px-3 py-3 font-medium">Fecha</th>
                  <th className="px-3 py-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {referrals.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{r.referrer_name || r.referrer_email}</p>
                      <p className="text-xs text-gray-400">{r.referrer_email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-700">{r.referred_name || r.referred_email}</p>
                    </td>
                    <td className="px-3 py-3">
                      {r.stripe_reward_applied
                        ? <CheckCircle className="w-4 h-4 text-green-500" />
                        : <XCircle className="w-4 h-4 text-red-400" />}
                    </td>
                    <td className="px-3 py-3">
                      <MethodBadge method={r.stripe_reward_method} />
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {r.rewarded_at ? new Date(r.rewarded_at).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {!r.stripe_reward_applied && (
                        <button
                          onClick={() => retryStripe(r)}
                          disabled={retrying === r.id}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40 mx-auto"
                          title="Reintentar aplicar en Stripe"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${retrying === r.id ? 'animate-spin' : ''}`} />
                          Reintentar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}