import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Megaphone, Search, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  draft:       { label: 'Borrador',      color: 'bg-gray-100 text-gray-600' },
  submitted:   { label: 'Enviado',       color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En progreso',   color: 'bg-yellow-100 text-yellow-700' },
  approved:    { label: 'Aprobado',      color: 'bg-green-100 text-green-700' },
  live:        { label: 'En directo',    color: 'bg-purple-100 text-purple-700' },
  completed:   { label: 'Completado',    color: 'bg-gray-100 text-gray-500' },
};

const PLATFORM_LABELS = {
  instagram: '📸 Instagram',
  facebook: '👤 Facebook',
  tiktok: '🎵 TikTok',
  google_search: '🔍 Google',
  linkedin: '💼 LinkedIn',
};

const GOAL_LABELS = {
  more_calls: 'Más llamadas',
  more_leads: 'Más leads',
  brand_awareness: 'Notoriedad',
  website_traffic: 'Tráfico web',
  more_quotes: 'Más presupuestos',
};

function BriefingRow({ briefing, users }) {
  const [expanded, setExpanded] = useState(false);
  const user = users.find(u => u.id === briefing.professional_id);
  const cfg = STATUS_CONFIG[briefing.status] || STATUS_CONFIG.draft;

  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{briefing.month_year}</td>
        <td className="px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">{briefing.professional_name || user?.full_name || '—'}</p>
            <p className="text-xs text-gray-400">{user?.email || briefing.professional_id}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-700">{PLATFORM_LABELS[briefing.platform] || briefing.platform}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{GOAL_LABELS[briefing.goal] || briefing.goal}</td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {briefing.submitted_at
            ? format(new Date(briefing.submitted_at), 'dd MMM yyyy', { locale: es })
            : briefing.created_date
            ? format(new Date(briefing.created_date), 'dd MMM yyyy', { locale: es })
            : '—'}
        </td>
        <td className="px-4 py-3 text-gray-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-blue-50">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p><span className="font-medium text-gray-700">Servicios top:</span> <span className="text-gray-600">{briefing.top_services?.join(', ') || '—'}</span></p>
                <p><span className="font-medium text-gray-700">Zona:</span> <span className="text-gray-600">{briefing.service_area || '—'}</span></p>
                <p><span className="font-medium text-gray-700">Oferta especial:</span> <span className="text-gray-600">{briefing.special_offer || '—'}</span></p>
                <p><span className="font-medium text-gray-700">Perfil de cliente:</span> <span className="text-gray-600">{briefing.client_profile || '—'}</span></p>
                <p><span className="font-medium text-gray-700">Cómo consigue clientes:</span> <span className="text-gray-600">{briefing.client_sources_now?.join(', ') || '—'}</span></p>
              </div>
              <div className="space-y-2">
                <p><span className="font-medium text-gray-700">Testimonios:</span> <span className="text-gray-600">{briefing.best_testimonials || '—'}</span></p>
                <p><span className="font-medium text-gray-700">Notas adicionales:</span> <span className="text-gray-600">{briefing.additional_notes || '—'}</span></p>
                {briefing.images_provided?.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Imágenes aportadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {briefing.images_provided.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline flex items-center gap-0.5">
                          Imagen {i + 1} <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {briefing.admin_notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                    <p className="font-medium text-yellow-800 text-xs">Notas admin:</p>
                    <p className="text-yellow-700 text-xs mt-0.5">{briefing.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminAdsBriefings({ users = [] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('');

  const { data: briefings = [], isLoading, refetch } = useQuery({
    queryKey: ['adsBriefings'],
    queryFn: () => base44.entities.AdsBriefing.list('-created_date', 200),
    staleTime: 1000 * 60 * 2,
  });

  // Meses únicos para el filtro
  const months = [...new Set(briefings.map(b => b.month_year))].sort().reverse();

  const filtered = briefings.filter(b => {
    const user = users.find(u => u.id === b.professional_id);
    const matchSearch = !search ||
      b.professional_name?.toLowerCase().includes(search.toLowerCase()) ||
      user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchMonth = !monthFilter || b.month_year === monthFilter;
    return matchSearch && matchStatus && matchMonth;
  });

  const pendingCount = briefings.filter(b => b.status === 'submitted' || b.status === 'in_progress').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">📢 Cuestionarios Ads+</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {briefings.length} briefings totales
            {pendingCount > 0 && <span className="ml-2 text-orange-600 font-semibold">· {pendingCount} pendientes de gestionar</span>}
          </p>
        </div>
        <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50">
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar profesional..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg"
          />
        </div>
        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
          <option value="">Todos los meses</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">Sin cuestionarios</p>
          <p className="text-xs text-gray-400 mt-1">Los briefings de Ads+ aparecerán aquí</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Mes</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Profesional</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Plataforma</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Objetivo</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Estado</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Enviado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(b => (
                  <BriefingRow key={b.id} briefing={b} users={users} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
            {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}