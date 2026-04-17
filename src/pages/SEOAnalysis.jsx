import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, Search, MousePointer, Eye, RefreshCw,
  ArrowUpRight, ArrowDownRight, Target, Globe, Award
} from "lucide-react";

const MetricCard = ({ icon: IconComp, label, value, sub, color = "blue", trend }) => (
  <Card className="border-0 shadow-sm">
    <CardContent className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
          <IconComp className={`w-5 h-5 text-${color}-600`} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold flex items-center gap-1 ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-extrabold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </CardContent>
  </Card>
);

const PositionBadge = ({ pos }) => {
  const p = parseFloat(pos);
  if (p <= 3) return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Top {p}</Badge>;
  if (p <= 10) return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Pág. 1</Badge>;
  if (p <= 20) return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Pág. 2</Badge>;
  return <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">Pág. {Math.ceil(p / 10)}</Badge>;
};

export default function SEOAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("keywords");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("searchConsoleAnalysis", {});
      setData(res.data);
    } catch (e) {
      setError(e.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Analizando Search Console…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 text-center max-w-md">
        <p className="text-red-500 font-semibold mb-4">{error}</p>
        <Button onClick={load}>Reintentar</Button>
      </Card>
    </div>
  );

  const { siteUrl, dateRange, totals, professionalKeywords, otherKeywords, topPages, trends } = data;

  const profShare = totals.clicks > 0
    ? ((professionalKeywords.totals.clicks / totals.clicks) * 100).toFixed(0)
    : 0;

  // Prepare trends chart — show last 30 days
  const recentTrends = trends.slice(-30).map(d => ({
    ...d,
    date: d.date.slice(5), // MM-DD
  }));

  const TABS = [
    { id: "keywords", label: "Keywords profesionales" },
    { id: "pages", label: "Páginas" },
    { id: "trends", label: "Tendencia" },
    { id: "other", label: "Otras keywords" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <Search className="w-7 h-7 text-blue-600" />
              Análisis SEO Orgánico
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              <span className="font-medium text-blue-700">{siteUrl}</span>
              {" · "}Últimos 90 días ({dateRange.start} → {dateRange.end})
            </p>
          </div>
          <Button variant="outline" onClick={load} className="gap-2 self-start">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard icon={MousePointer} label="Clics totales" value={totals.clicks.toLocaleString()} color="blue" />
          <MetricCard icon={Eye} label="Impresiones totales" value={totals.impressions.toLocaleString()} color="purple" />
          <MetricCard icon={Target} label="Keywords profesionales" value={`${professionalKeywords.rows.length}`} sub={`${profShare}% de los clics`} color="emerald" />
          <MetricCard icon={Award} label="Pos. media (prof.)" value={`#${professionalKeywords.avgPosition}`} sub={`CTR: ${professionalKeywords.avgCtr}%`} color="amber" />
        </div>

        {/* Pro vs Other split */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-semibold text-gray-800">Keywords de contratación profesional</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xl font-bold text-blue-700">{professionalKeywords.totals.clicks}</div>
                  <div className="text-xs text-gray-500">Clics</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-700">{professionalKeywords.totals.impressions}</div>
                  <div className="text-xs text-gray-500">Impresiones</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-700">{professionalKeywords.avgCtr}%</div>
                  <div className="text-xs text-gray-500">CTR medio</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-700">#{professionalKeywords.avgPosition}</div>
                  <div className="text-xs text-gray-500">Posición media</div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Cuota de clics</span>
                  <span>{profShare}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${profShare}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="font-semibold text-gray-800">Otras keywords (marca/navegacional)</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xl font-bold text-gray-700">{otherKeywords.totals.clicks}</div>
                  <div className="text-xs text-gray-500">Clics</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-700">{otherKeywords.totals.impressions}</div>
                  <div className="text-xs text-gray-500">Impresiones</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-xl text-sm text-amber-800">
                💡 <strong>Insight:</strong> El {profShare}% de los clics orgánicos provienen de búsquedas de contratación profesional — el segmento más valioso.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Keywords profesionales */}
        {tab === "keywords" && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-6">
              <h2 className="font-bold text-gray-900">Keywords de contratación de profesionales</h2>
              <p className="text-sm text-gray-500">{professionalKeywords.rows.length} queries · últimos 90 días</p>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Query</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clics</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Impresiones</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CTR</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Posición</th>
                    </tr>
                  </thead>
                  <tbody>
                    {professionalKeywords.rows.map((row, i) => (
                      <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === 0 ? "bg-blue-50/40" : ""}`}>
                        <td className="px-6 py-3 font-medium text-gray-800">{row.query}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700">{row.clicks}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{row.impressions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{row.ctr}%</td>
                        <td className="px-6 py-3 text-right">
                          <PositionBadge pos={row.position} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab: Páginas */}
        {tab === "pages" && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-6">
              <h2 className="font-bold text-gray-900">Rendimiento por página</h2>
              <p className="text-sm text-gray-500">Top {topPages.length} páginas por clics</p>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Página</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clics</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Impresiones</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CTR</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Posición</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-3 max-w-xs">
                          <a href={row.page} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 truncate">
                            <Globe className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{row.page.replace(/^https?:\/\/[^/]+/, '')}</span>
                          </a>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700">{row.clicks}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{row.impressions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{row.ctr}%</td>
                        <td className="px-6 py-3 text-right"><PositionBadge pos={row.position} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab: Tendencia */}
        {tab === "trends" && (
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-0 pt-5 px-6">
                <h2 className="font-bold text-gray-900">Evolución de clics e impresiones (últimos 30 días)</h2>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={recentTrends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="clicks" stroke="#2563eb" strokeWidth={2} dot={false} name="Clics" />
                    <Line type="monotone" dataKey="impressions" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Impresiones" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-0 pt-5 px-6">
                <h2 className="font-bold text-gray-900">Posición media diaria</h2>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={recentTrends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} />
                    <YAxis reversed tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                      formatter={(v) => [`#${parseFloat(v).toFixed(1)}`, "Posición"]}
                    />
                    <Line type="monotone" dataKey="position" stroke="#f59e0b" strokeWidth={2} dot={false} name="Posición" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab: Otras keywords */}
        {tab === "other" && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-6">
              <h2 className="font-bold text-gray-900">Otras keywords (marca / navegacional)</h2>
            </CardHeader>
            <CardContent className="px-0">
              {otherKeywords.rows.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400">No hay otras keywords en este período</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Query</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Clics</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Impresiones</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">CTR</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Posición</th>
                      </tr>
                    </thead>
                    <tbody>
                      {otherKeywords.rows.map((row, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-6 py-3 text-gray-800">{row.query}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-700">{row.clicks}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{row.impressions.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{row.ctr}%</td>
                          <td className="px-6 py-3 text-right"><PositionBadge pos={row.position} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Insights box */}
        <Card className="border-0 shadow-sm mt-6 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Insights clave
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• <strong>"buscar autónomos"</strong> es la keyword líder con {professionalKeywords.rows[0]?.clicks || 0} clics — foco principal de SEO.</li>
              <li>• CTR medio del <strong>{professionalKeywords.avgCtr}%</strong> en keywords profesionales — bien por encima del 2-3% del sector.</li>
              <li>• Posición media <strong>#{professionalKeywords.avgPosition}</strong> — keywords en zona de primera página, potencial de mejora hacia top 5.</li>
              <li>• <strong>{profShare}%</strong> de los clics orgánicos provienen de intención de contratación — tráfico muy cualificado.</li>
              <li>• Oportunidad: keywords con muchas impresiones y 0 clics necesitan mejora de título/meta description.</li>
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}