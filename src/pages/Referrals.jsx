import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Copy, Check, Gift, Users, Calendar, Trophy } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import ReferralBanner from "@/components/referrals/ReferralBanner";

const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function makeCode() {
  let code = 'MA-';
  for (let i = 0; i < 6; i++) code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
  return code;
}

function StatusBadge({ status }) {
  const config = {
    pending:   { label: "Pendiente", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
    qualified: { label: "Cualificado", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
    rewarded:  { label: "✓ 1 mes ganado", cls: "bg-green-50 text-green-700 border border-green-200" },
    cancelled: { label: "Cancelado", cls: "bg-gray-100 text-gray-500" },
  };
  const c = config[status] || config.pending;
  return <span className={`text-xs font-medium px-2 py-1 rounded-md ${c.cls}`}>{c.label}</span>;
}

export default function ReferralsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) { setLoading(false); return; }
      setUser(currentUser);

      let profiles = await base44.entities.ProfessionalProfile.filter({ user_id: currentUser.id });
      let prof = profiles[0] || null;

      if (prof && !prof.referral_code) {
        // Generar código si falta (backfill client-side)
        let code, attempts = 0;
        while (attempts < 10) {
          code = makeCode();
          const check = await base44.entities.ProfessionalProfile.filter({ referral_code: code });
          if (check.length === 0) break;
          attempts++;
        }
        await base44.entities.ProfessionalProfile.update(prof.id, { referral_code: code });
        prof = { ...prof, referral_code: code };
      }

      setProfile(prof);

      if (prof) {
        const refs = await base44.entities.Referral.filter({ referrer_id: currentUser.id });
        refs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        setReferrals(refs);
      }

      // Leaderboard: top 10 por referral_count (solo profesionales activos)
      const allProfs = await base44.entities.ProfessionalProfile.filter({ visible_en_busqueda: true });
      const sorted = allProfs
        .filter(p => (p.referral_count || 0) > 0)
        .sort((a, b) => (b.referral_count || 0) - (a.referral_count || 0))
        .slice(0, 10);
      setLeaderboard(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const qualified = referrals.filter(r => ["qualified", "rewarded"].includes(r.status)).length;
  const pending = referrals.filter(r => r.status === "pending").length;
  const monthsEarned = profile?.referral_months_earned || 0;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <SEOHead title="Invita y gana — MisAutónomos" noindex />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" /> Invita y gana
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Invita a otro autónomo y os lleváis 1 mes gratis los dos
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* BANNER PRINCIPAL */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-700 rounded-full" />
          </div>
        ) : profile ? (
          <ReferralBanner profile={profile} />
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
            <p className="text-sm font-medium text-amber-900">Solo disponible para profesionales con perfil activo.</p>
          </div>
        )}

        {/* MÉTRICAS */}
        {profile && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                <Users className="w-3.5 h-3.5" /> Cualificados
              </div>
              <p className="text-2xl font-bold text-gray-900">{qualified}</p>
              {pending > 0 && <p className="text-xs text-amber-600 mt-0.5">{pending} pendientes</p>}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                <Calendar className="w-3.5 h-3.5" /> Meses ganados
              </div>
              <p className="text-2xl font-bold text-gray-900">{monthsEarned}</p>
              <p className="text-xs text-gray-500 mt-0.5">de 12 máx.</p>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
              <div className="flex items-center gap-1.5 text-amber-700 text-xs mb-1">
                <Gift className="w-3.5 h-3.5" /> Usados
              </div>
              <p className="text-2xl font-bold text-amber-900">{profile.referral_months_used || 0}</p>
              <p className="text-xs text-amber-700 mt-0.5">aplicados</p>
            </div>
          </div>
        )}

        {/* CÓMO FUNCIONA */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">¿Cómo funciona?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { n: 1, title: "Comparte tu enlace", desc: "Envíalo a otros autónomos por WhatsApp, email o redes sociales." },
              { n: 2, title: "Se registran y suscriben", desc: "Cuando tu referido pasa a plan de pago, los dos ganáis 1 mes gratis." },
              { n: 3, title: "Se aplica automáticamente", desc: "30 días extra se añaden a tu suscripción sin hacer nada. Hasta 12 meses acumulables." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">{n}</div>
                <div>
                  <p className="font-medium text-sm text-gray-900 mb-0.5">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LEADERBOARD */}
        {leaderboard.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Top referidores del mes
            </h2>
            <div className="space-y-2">
              {leaderboard.map((p, idx) => (
                <div key={p.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${idx === 0 ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}>
                  <span className="text-lg w-7 text-center flex-shrink-0">
                    {medals[idx] || `#${idx + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {p.business_name ? p.business_name.split(' ').slice(0, 2).join(' ') : 'Profesional'}
                      {p.user_id === user?.id && <span className="ml-1 text-xs text-blue-600 font-normal">(tú)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{p.ciudad || p.provincia || 'España'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{p.referral_count}</p>
                    <p className="text-xs text-gray-500">referidos</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* HISTORIAL */}
        {profile && (
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Mis referidos</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto" />
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Aún no has invitado a nadie</p>
                <p className="text-xs text-gray-500 mt-1">Comparte tu enlace y empieza a ganar meses gratis</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {referrals.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {r.referred_name || r.referred_email || "Nuevo profesional"}
                      </p>
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
        )}

        {/* FAQ */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {[
              { q: "¿Cuándo se aplica el mes gratis?", a: "Cuando tu referido pasa de periodo de prueba a plan de pago, el sistema lo detecta automáticamente y añade 30 días a tu suscripción." },
              { q: "¿Hay un límite de referidos?", a: "Puedes invitar a cuantos quieras, pero el máximo de meses gratis acumulables es 12 por cuenta." },
              { q: "¿Qué gana el referido?", a: "El referido también recibe beneficios al suscribirse con tu código. Ambos ganáis 1 mes gratis cuando se produce la conversión a pago." },
              { q: "¿Cómo se aplica si ya tengo suscripción activa?", a: "Se extiende automáticamente la fecha de renovación de tu suscripción 30 días adicionales." },
            ].map(({ q, a }) => (
              <div key={q}>
                <p className="text-sm font-semibold text-gray-900 mb-1">{q}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}