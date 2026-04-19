import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Download, Trash2, Users, TrendingUp, UserMinus, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

function StatusBadge({ status }) {
  const map = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    unsubscribed: 'bg-gray-100 text-gray-600',
  };
  const label = { confirmed: 'Activo', pending: 'Pendiente', unsubscribed: 'Baja' };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {label[status] || status}
    </span>
  );
}

function MetricCard({ label, value, icon: Icon, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    gray: 'bg-gray-100 text-gray-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminNewsletter() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const all = await base44.entities.NewsletterSubscriber.list('-created_date', 500);
    setSubs(all);
    setLoading(false);
  };

  const deleteSub = async (id) => {
    if (!confirm('¿Eliminar este suscriptor?')) return;
    await base44.entities.NewsletterSubscriber.delete(id);
    setSubs(prev => prev.filter(s => s.id !== id));
  };

  const filtered = subs.filter(s => {
    if (search && !s.email?.toLowerCase().includes(search.toLowerCase()) && !(s.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && s.source !== sourceFilter) return false;
    return true;
  });

  const confirmed = subs.filter(s => s.status === 'confirmed');
  const unsub = subs.filter(s => s.status === 'unsubscribed');
  const thisMonth = subs.filter(s => {
    const d = new Date(s.created_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const sources = [...new Set(subs.map(s => s.source).filter(Boolean))];

  const exportCSV = () => {
    const rows = [['Email', 'Nombre', 'Interés', 'Idioma', 'Fuente', 'Fecha alta', 'Estado']];
    filtered.forEach(s => rows.push([
      s.email, s.name || '', s.user_type_interest || '', s.language || '',
      s.source || '', s.created_date ? new Date(s.created_date).toLocaleDateString('es-ES') : '',
      s.status
    ]));
    const csv = rows.map(r => r.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Newsletter</h1>
              <p className="text-sm text-gray-500">Gestión de suscriptores</p>
            </div>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Total activos" value={confirmed.length} icon={Users} color="green" />
          <MetricCard label="Este mes" value={thisMonth.length} icon={TrendingUp} color="blue" />
          <MetricCard label="Dados de baja" value={unsub.length} icon={UserMinus} color="gray" />
          <MetricCard label="Total suscriptores" value={subs.length} icon={Mail} color="purple" />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="Buscar email o nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Todos los estados</option>
            <option value="confirmed">Activos</option>
            <option value="pending">Pendientes</option>
            <option value="unsubscribed">Dados de baja</option>
          </select>
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Todas las fuentes</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No hay suscriptores que coincidan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Nombre</th>
                    <th className="text-left px-4 py-3">Interés</th>
                    <th className="text-left px-4 py-3">Idioma</th>
                    <th className="text-left px-4 py-3">Fuente</th>
                    <th className="text-left px-4 py-3">Fecha</th>
                    <th className="text-left px-4 py-3">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{s.email}</td>
                      <td className="px-4 py-3 text-gray-600">{s.name || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.user_type_interest || '—'}</td>
                      <td className="px-4 py-3 text-xs uppercase text-gray-500">{s.language || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{s.source || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {s.created_date ? new Date(s.created_date).toLocaleDateString('es-ES') : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteSub(s.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
                {filtered.length} suscriptor{filtered.length !== 1 ? 'es' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}