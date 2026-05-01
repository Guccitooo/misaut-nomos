import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, Filter, BarChart3, Eye, X, Megaphone } from 'lucide-react';
import CampaignRepescaV1 from './CampaignRepescaV1';
import CampaignWinbackV1 from './CampaignWinbackV1';
import CampaignMetrics from './CampaignMetrics';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const TEMPLATE_VARS = {
  welcome: { name: 'John Doe', ctaUrl: 'https://misautonomos.es' },
  gift_received: { name: 'John Doe', planName: 'Ads+', until: '2024-06-30', profileUrl: 'https://misautonomos.es/dashboard' },
  review_request: { clientName: 'John', professionalName: 'Jane', reviewUrl: 'https://misautonomos.es/valorar/123' },
  generic: { headline: 'Título', body: '<p>Contenido del email</p>', ctaText: 'Botón', ctaUrl: 'https://misautonomos.es' }
};

export default function AdminEmailsPanel() {
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    template: 'all',
    search: '',
    dateRange: '30'
  });
  const [testEmail, setTestEmail] = useState('');
  const [testTemplate, setTestTemplate] = useState('welcome');
  const [testSubject, setTestSubject] = useState('Email de prueba');
  const [testVars, setTestVars] = useState(JSON.stringify(TEMPLATE_VARS.welcome, null, 2));
  const [sending, setSending] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  };

  const { data: logs, isLoading } = useQuery({
    queryKey: ['emailLogs', filters],
    queryFn: async () => {
      const query = {};
      if (filters.status !== 'all') query.status = filters.status;
      if (filters.category !== 'all') query.category = filters.category;
      if (filters.template !== 'all') query.template = filters.template;

      let result = await base44.asServiceRole.entities.EmailLog.filter(query, '-created_date', 100);
      
      if (filters.search) {
        result = result.filter(l => l.to_email.toLowerCase().includes(filters.search.toLowerCase()));
      }

      if (filters.dateRange !== 'all') {
        const cutoffDate = getDaysAgo(parseInt(filters.dateRange));
        result = result.filter(l => new Date(l.created_date) >= cutoffDate);
      }

      return result || [];
    }
  });

  const { data: metrics } = useQuery({
    queryKey: ['emailMetrics'],
    queryFn: async () => {
      const thirtyDaysAgo = getDaysAgo(30);
      const allLogs = await base44.asServiceRole.entities.EmailLog.filter({}, '-created_date', 1000);
      
      if (!allLogs) return { total: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };

      const recentLogs = allLogs.filter(l => new Date(l.created_date) >= thirtyDaysAgo);
      const sent = recentLogs.filter(l => ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'spam'].includes(l.status));
      const total = sent.length;
      const delivered = sent.filter(l => ['delivered', 'opened', 'clicked'].includes(l.status)).length;
      const opened = sent.filter(l => ['opened', 'clicked'].includes(l.status)).length;
      const clicked = sent.filter(l => l.status === 'clicked').length;
      const bounced = sent.filter(l => l.status === 'bounced').length;

      return {
        total,
        deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
        openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
        clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
        bounceRate: total > 0 ? Math.round((bounced / total) * 100) : 0
      };
    }
  });

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Ingresa un email');
      return;
    }

    setSending(true);
    try {
      let vars = {};
      try {
        vars = JSON.parse(testVars);
      } catch (e) {
        toast.error('Variables JSON inválidas');
        setSending(false);
        return;
      }

      await base44.functions.invoke('sendAndLog', {
        to: testEmail,
        subject: testSubject,
        template: testTemplate,
        vars,
        category: 'transactional'
      });
      
      toast.success('Email de prueba enviado');
      setShowTestModal(false);
      setTestEmail('');
      setTestSubject('Email de prueba');
      setTestTemplate('welcome');
      setTestVars(JSON.stringify(TEMPLATE_VARS.welcome, null, 2));
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleTemplateChange = (template) => {
    setTestTemplate(template);
    setTestVars(JSON.stringify(TEMPLATE_VARS[template], null, 2));
  };

  const getStatusColor = (status) => {
    const colors = {
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      opened: 'bg-green-100 text-green-800',
      clicked: 'bg-green-100 text-green-800',
      bounced: 'bg-red-100 text-red-800',
      spam: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800',
      queued: 'bg-yellow-100 text-yellow-800',
      skipped: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      queued: 'Pendiente',
      sent: 'Enviado',
      delivered: 'Entregado',
      opened: 'Abierto',
      clicked: 'Clic',
      bounced: 'Rechazado',
      spam: 'Spam',
      failed: 'Fallido',
      skipped: 'Omitido'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">📧 Gestión de Emails</h2>
        <Button onClick={() => setShowTestModal(true)} className="gap-2">
          <Send className="w-4 h-4" />
          Email de prueba
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Últimos 30d</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.total || 0}</p>
            </div>
            <Mail className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Entrega</p>
              <p className="text-2xl font-bold text-green-600">{metrics?.deliveryRate || 0}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Apertura</p>
              <p className="text-2xl font-bold text-purple-600">{metrics?.openRate || 0}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clics</p>
              <p className="text-2xl font-bold text-indigo-600">{metrics?.clickRate || 0}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-indigo-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rebotes</p>
              <p className="text-2xl font-bold text-red-600">{metrics?.bounceRate || 0}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* ── CAMPAÑAS ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-5 h-5 text-orange-500" />
          <h3 className="text-base font-bold text-gray-900">Campañas</h3>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <CampaignRepescaV1 />
          <CampaignWinbackV1 />
        </div>
      </div>

      {/* ── MÉTRICAS DE CAMPAÑAS ── */}
      <CampaignMetrics />

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="font-semibold text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input
            placeholder="Buscar email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sent">Enviados</SelectItem>
              <SelectItem value="delivered">Entregados</SelectItem>
              <SelectItem value="opened">Abiertos</SelectItem>
              <SelectItem value="bounced">Rechazados</SelectItem>
              <SelectItem value="failed">Fallidos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
            <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="transactional">Transaccional</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.template} onValueChange={(v) => setFilters({ ...filters, template: v })}>
            <SelectTrigger><SelectValue placeholder="Template" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="welcome">Bienvenida</SelectItem>
              <SelectItem value="gift_received">Regalo</SelectItem>
              <SelectItem value="review_request">Reseña</SelectItem>
              <SelectItem value="generic">Genérico</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.dateRange} onValueChange={(v) => setFilters({ ...filters, dateRange: v })}>
            <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7d</SelectItem>
              <SelectItem value="30">Últimos 30d</SelectItem>
              <SelectItem value="90">Últimos 90d</SelectItem>
              <SelectItem value="all">Todo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="p-4">
        {isLoading ? (
          <p className="text-gray-600 py-8 text-center">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Asunto</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Template</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoría</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {formatDistanceToNow(new Date(log.created_date), { locale: es, addSuffix: true })}
                      </td>
                      <td className="py-3 px-4 text-gray-900 text-xs">{log.to_email}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs truncate max-w-xs">{log.subject}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{log.template}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          log.category === 'transactional' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {log.category === 'transactional' ? 'Trans.' : 'Marketing'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(log.status)}`}>
                          {getStatusLabel(log.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">
                      No hay emails
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Test Email */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Email de prueba</h3>
              <button onClick={() => setShowTestModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destinatario</label>
                <Input
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  disabled={sending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asunto</label>
                <Input
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  disabled={sending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                <Select value={testTemplate} onValueChange={handleTemplateChange} disabled={sending}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Bienvenida</SelectItem>
                    <SelectItem value="gift_received">Regalo</SelectItem>
                    <SelectItem value="review_request">Reseña</SelectItem>
                    <SelectItem value="generic">Genérico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Variables (JSON)</label>
                <Textarea
                  value={testVars}
                  onChange={(e) => setTestVars(e.target.value)}
                  disabled={sending}
                  className="font-mono text-xs h-32"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleTestEmail} disabled={sending} className="flex-1">
                  {sending ? 'Enviando...' : 'Enviar'}
                </Button>
                <Button onClick={() => setShowTestModal(false)} variant="outline" disabled={sending}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Detail */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl p-6 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Detalle del Email</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto text-gray-900">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>
            <Button onClick={() => setShowDetailModal(false)} className="mt-4 w-full">
              Cerrar
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}