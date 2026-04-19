import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, Gift, Users, Calendar } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";

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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["referralProfile", user?.id],
    queryFn: async () => {
      const p = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });
      return p[0] || null;
    },
    enabled: !!user,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ["myReferrals", user?.id],
    queryFn: () => base44.entities.Referral.filter({ referrer_id: user.id }),
    enabled: !!user,
  });

  const refLink = profile?.referral_code
    ? `https://misautonomos.es/r/${profile.referral_code}`
    : "";

  const copyLink = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = "¡Únete a MisAutónomos con mi código y consigue 30 días extra de prueba gratis! 🎁";
  const shareWA = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + refLink)}`);
  const shareEmail = () => window.open(`mailto:?subject=${encodeURIComponent("Únete a MisAutónomos")}&body=${encodeURIComponent(shareText + "\n\n" + refLink)}`);
  const shareX = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(refLink)}`);
  const shareLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(refLink)}`);

  const qualified = referrals.filter((r) => ["qualified", "rewarded"].includes(r.status)).length;
  const pending = referrals.filter((r) => r.status === "pending").length;
  const monthsEarned = profile?.referral_months_earned || 0;

  const sorted = [...referrals].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

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
            <span className="flex-1 text-sm text-white truncate">
              {refLink || "Cargando..."}
            </span>
            <button
              onClick={copyLink}
              disabled={!refLink}
              className="bg-white text-gray-900 text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              {copied ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar</>}
            </button>
          </div>

          <p className="text-xs text-gray-400 mb-2">Compartir por:</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={shareWA} className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-2 rounded-lg">
              WhatsApp
            </button>
            <button onClick={shareEmail} className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium px-3 py-2 rounded-lg">
              Email
            </button>
            <button onClick={shareX} className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium px-3 py-2 rounded-lg">
              Twitter/X
            </button>
            <button onClick={shareLinkedIn} className="bg-blue-800 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg">
              LinkedIn
            </button>
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
          {sorted.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Aún no has invitado a nadie</p>
              <p className="text-xs text-gray-500 mt-1">Comparte tu link y empieza a ganar meses gratis</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sorted.map((r) => (
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