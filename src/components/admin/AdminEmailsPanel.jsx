import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, Filter, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminEmailsPanel() {
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    template: 'all'
  });
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('');
  const [testTemplate, setTestTemplate] = useState('welcome');
  const [sending, setSending] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['emailLogs', filters],
    queryFn: async () => {
      const query = {};
      if (filters.status !== 'all') query.status = filters.status;
      if (filters.category !== 'all') query.category = filters.category;
      if (filters.template !== 'all') query.template = filters.template;

      const result = await base44.asServiceRole.entities.EmailLog.filter(query, '-created_date', 100);
      return result || [];
    }
  });

  const { data: metrics } = useQuery({
    queryKey: ['emailMetrics'],
    queryFn: async () => {
      const allLogs = await base44.asServiceRole.entities.EmailLog.filter({}, '-created_date', 1000);
      if (!allLogs) return { total: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };

      const total = allLogs.length;
      const delivered = allLogs.filter(l => l.status === 'delivered').length;
      const opened = allLogs.filter(l => l.status === 'opened').length;
      const clicked = allLogs.filter(l => l.status === 'clicked').length;
      const bounced = allLogs.filter(l => l.status === 'bounced').length;

      return {
        total,
        delivered: total > 0 ? Math.round((delivered / total) * 100) : 0,
        opened: total > 0 ? Math.round((opened / total) * 100) : 0,
        clicked: total > 0 ? Math.round((clicked / total) * 100) : 0,
        bounced: total > 0 ? Math.round((bounced / total) * 100) : 0
      };
    }
  });

  const handleTestEmail = async () => {
    if (!testEmail || !testSubject) {
      toast.error('Completa todos los campos');
      return;
    }

    setSending(true);
    try {
      await base44.functions.invoke('sendEmail', {
        to: testEmail,
        subject: testSubject,
        template: testTemplate,
        vars: {
          name: 'Test User',
          app_url: window.location.origin
        },
        category: 'transactional'
      });
      toast.success('Email de prueba enviado');
      setTestEmail('');
      setTestSubject('');
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      opened: 'bg-purple-100 text-purple-800',
      clicked: 'bg-indigo-100 text-indigo-800',
      bounced: 'bg-red-100 text-red-800',
      spam: 'bg-orange-100 text-orange-800',
      failed: 'bg-red-100 text-red-800',
      skipped: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total enviados</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.total || 0}</p>
            </div>
            <Mail className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Entregados</p>
              <p className="text-2xl font-bold text-green-600">{metrics?.delivered || 0}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Abiertos</p>
              <p className="text-2xl font-bold text-purple-600">{metrics?.opened || 0}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clics</p>
              <p className="text-2xl font-bold text-indigo-600">{metrics?.clicked || 0}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-indigo-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rechazados</p>
              <p className="text-2xl font-bold text-red-600">{metrics?.bounced || 0}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Test Email */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📧 Probar Email</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email destinatario</label>
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
              placeholder="Asunto del email"
              value={testSubject}
              onChange={(e) => setTestSubject(e.target.value)}
              disabled={sending}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
            <Select value={testTemplate} onValueChange={setTestTemplate} disabled={sending}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="welcome">Bienvenida</SelectItem>
                <SelectItem value="gift_received">Regalo recibido</SelectItem>
                <SelectItem value="review_request">Solicitud reseña</SelectItem>
                <SelectItem value="generic">Genérico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleTestEmail} disabled={sending} className="w-full">
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Enviando...' : 'Enviar email de prueba'}
          </Button>
        </div>
      </Card>

      {/* Filtros */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sent">Enviados</SelectItem>
              <SelectItem value="delivered">Entregados</SelectItem>
              <SelectItem value="opened">Abiertos</SelectItem>
              <SelectItem value="bounced">Rechazados</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
              <SelectItem value="failed">Fallidos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="transactional">Transaccional</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.template} onValueChange={(v) => setFilters({ ...filters, template: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="welcome">Bienvenida</SelectItem>
              <SelectItem value="gift_received">Regalo</SelectItem>
              <SelectItem value="review_request">Reseña</SelectItem>
              <SelectItem value="generic">Genérico</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lista de logs */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Últimos emails</h3>
        {isLoading ? (
          <p className="text-gray-600">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Destinatario</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Asunto</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Template</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{log.to_email}</td>
                      <td className="py-3 px-4 text-gray-600">{log.subject}</td>
                      <td className="py-3 px-4 text-gray-600">{log.template}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(log.created_date).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">
                      No hay emails para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}