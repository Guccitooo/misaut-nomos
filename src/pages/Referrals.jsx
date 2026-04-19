import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Copy, Check, Gift, Users, Calendar, CheckCircle } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";

function generateReferralCode(name) {
  const prefix = 'MA';
  const cleanName = (name || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
  const initials = cleanName.substring(0, 3).padEnd(3, 'X');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${initials}${random}`;
}

function StatusBadge({ status }) {
  const config = {
    pending: { label: "En proceso (7 días)", cls: "bg-amber-50 text-amber-700" },
    qualified: { label: "Cualificado", cls: "bg-blue-50 text-blue-700" },
    rewarded: { label: "✓ 1 mes ganado", cls: "bg-green-50 text-green-700" },
    cancelled: { label: "Cancelado", cls: "bg-gray-100 text-gray-500" },
  };
  const c = config[status] || config.pending;
  return <span className={`text-xs font-medium px-2 py-1 rounded-md ${c.cls}`}>{c.label}</span>;
}

export default function ReferralsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) { setLoading(false); return; }
      setUser(currentUser);

      let profiles = await base44.entities.ProfessionalProfile.filter({ user_id: currentUser.id });
      let prof = profiles[0] || null;

      if (!prof) { setLoading(false); return; }

      // Backfill: generar referral_code si no existe
      if (!prof.referral_code) {
        let code;
        let exists = true;
        let attempts = 0;
        while (exists && attempts < 10) {
          code = generateReferralCode(prof.business_name || currentUser.full_name || 'MA');
          const check = await base44.entities.ProfessionalProfile.filter({ referral_code: code });
          exists = check.length > 0;
          attempts++;
        }
        await base44.entities.ProfessionalProfile.update(prof.id, { referral_code: code });
        prof = { ...prof, referral_code: code };
      }

      setProfile(prof);

      const refs = await base44.entities.Referral.filter({ referrer_id: currentUser.id });
      refs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setReferrals(refs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const refLink = profile?.referral_code
    ? `https://misautonomos.es/r/${profile.referral_code}`
    : "";

  const copyLink = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = "¡Únete a MisAutónomos con mi código y consigue 30 días extra de prueba gratis!";
  const shareWA = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + refLink)}`);
  const shareEmail = () => window.open(`mailto:?subject=${encodeURIComponent("Únete a MisAutónomos")}&body=${encodeURIComponent(shareText + "\n\n" + refLink)}`);
  const shareX = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(refLink)}`);
  const shareLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(refLink)}`);

  const qualified = referrals.filter((r) => ["qualified", "rewarded"].includes(r.status)).length;
  const pending = referrals.filter((r) => r.status === "pending").length;
  const monthsEarned = profile?.referral_months_earned || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SEOHead title="Invita y gana — MisAutónomos" noindex />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" /> Invita y gana
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Por cada autónomo que se una con tu código, ganas 1 mes gratis
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Link + compartir */}
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
          <p className="text-xs text-gray-400 mb-1">Tu link personal</p>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5 mb-4">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400 flex-1">
                <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full flex-shrink-0" />
                <span className="text-sm">Generando tu link...</span>
              </div>
            ) : (
              <span className="flex-1 text-sm text-white truncate">{refLink || "—"}</span>
            )}
            <button
              onClick={copyLink}
              disabled={!refLink || loading}
              className="bg-white text-gray-900 text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-gray-100 transition-colors flex-shrink-0 disabled:opacity-40"
            >
              {copied ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar</>}
            </button>
          </div>

          <p className="text-xs text-gray-400 mb-2">Compartir por:</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={shareWA} disabled={!refLink} className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs font-medium px-3 py-2 rounded-lg">
              WhatsApp
            </button>
            <button onClick={shareEmail} disabled={!refLink} className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-xs font-medium px-3 py-2 rounded-lg">
              Email
            </button>
            <button onClick={shareX} disabled={!refLink} className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-xs font-medium px-3 py-2 rounded-lg">
              Twitter/X
            </button>
            <button onClick={shareLinkedIn} disabled={!refLink} className="bg-blue-800 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium px-3 py-2 rounded-lg">
              LinkedIn
            </button>
          </div>

          {/* Banner informativo — cómo se aplica el mes gratis */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-900">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
            <div>
              <strong>Cómo se aplica tu mes gratis:</strong>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li>Si estás en periodo de prueba: se añaden 30 días más a tu prueba</li>
                <li>Si ya estás pagando: se aplica 1 mes de descuento automáticamente en tu próxima factura</li>
              </ul>
              La recompensa se aplica a los 7 días de que tu referido se haya registrado activamente.
            </div>
          </div>
        </section>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
              <Users className="w-3.5 h-3.5" /> Referidos
            </div>
            <p className="text-2xl font-bold text-gray-900">{qualified}</p>
            {pending > 0 && (
              <p className="text-xs text-amber-600 mt-0.5">{pending} en proceso</p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" /> Meses ganados
            </div>
            <p className="text-2xl font-bold text-gray-900">{monthsEarned}</p>
            <p className="text-xs text-gray-500 mt-0.5">gratis acumulados</p>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
            <div className="flex items-center gap-1.5 text-amber-700 text-xs mb-1">
              <Gift className="w-3.5 h-3.5" /> Sin límite
            </div>
            <p className="text-sm font-bold text-amber-900">¡Cuantos más, mejor!</p>
            <p className="text-xs text-amber-700 mt-0.5">Sin tope de meses</p>
          </div>
        </div>

        {/* Cómo funciona */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Cómo funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { n: 1, title: "Comparte tu link", desc: "Envíalo a otros autónomos por WhatsApp, email o redes." },
              { n: 2, title: "Se registran con tu código", desc: "Reciben 30 días extra de prueba (90 días en total)." },
              { n: 3, title: "Ganas 1 mes gratis", desc: "Cuando el referido lleva 7 días activo, se añade 1 mes a tu suscripción." },
            ].map(({ n, title, desc }) => (
              <div key={n}>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-2">{n}</div>
                <p className="font-medium text-sm text-gray-900 mb-0.5">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Historial */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Historial de referidos</h2>
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Aún no has invitado a nadie</p>
              <p className="text-xs text-gray-500 mt-1">Comparte tu link y empieza a ganar meses gratis</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{r.referred_name || r.referred_email}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(r.created_date).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}