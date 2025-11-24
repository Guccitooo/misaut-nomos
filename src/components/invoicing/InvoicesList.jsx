import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Download, Trash2, FileText, Search, Filter } from "lucide-react";
import { useLanguage } from "../ui/LanguageSwitcher";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-600"
};

export default function InvoicesList({ invoices = [], onView, onDownload, onDelete, onStatusChange }) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const filtered = invoices.filter(inv => {
    const matchesSearch = !searchTerm || 
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== "all") {
      const invDate = new Date(inv.issue_date);
      const now = new Date();
      const monthsAgo = parseInt(dateFilter);
      const cutoffDate = new Date(now.setMonth(now.getMonth() - monthsAgo));
      matchesDate = invDate >= cutoffDate;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusLabel = (status) => {
    const labels = {
      draft: t('draft') || 'Borrador',
      sent: t('sent') || 'Emitida',
      paid: t('paid') || 'Pagada',
      overdue: t('overdue') || 'Vencida',
      cancelled: t('cancelled') || 'Anulada'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchInvoices') || 'Buscar por nº factura o cliente...'}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder={t('allStatuses') || 'Todos los estados'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses') || 'Todos'}</SelectItem>
            <SelectItem value="draft">{t('draft') || 'Borrador'}</SelectItem>
            <SelectItem value="sent">{t('sent') || 'Emitida'}</SelectItem>
            <SelectItem value="paid">{t('paid') || 'Pagada'}</SelectItem>
            <SelectItem value="overdue">{t('overdue') || 'Vencida'}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder={t('period') || 'Periodo'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allTime') || 'Todo'}</SelectItem>
            <SelectItem value="1">{t('lastMonth') || 'Último mes'}</SelectItem>
            <SelectItem value="3">{t('last3Months') || 'Últimos 3 meses'}</SelectItem>
            <SelectItem value="6">{t('last6Months') || 'Últimos 6 meses'}</SelectItem>
            <SelectItem value="12">{t('lastYear') || 'Último año'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('noInvoicesFound') || 'No se encontraron facturas'}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{invoice.invoice_number}</h3>
                      <Badge className={statusColors[invoice.status]}>
                        {getStatusLabel(invoice.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{invoice.client_name}</p>
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      <span>{new Date(invoice.issue_date).toLocaleDateString('es-ES')}</span>
                      <span className="font-semibold text-gray-900">{invoice.total?.toFixed(2)}€</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {invoice.status === 'draft' && (
                      <Select
                        value={invoice.status}
                        onValueChange={(value) => onStatusChange(invoice.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">{t('draft')}</SelectItem>
                          <SelectItem value="sent">{t('markAsSent') || 'Marcar emitida'}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {invoice.status === 'sent' && (
                      <Select
                        value={invoice.status}
                        onValueChange={(value) => onStatusChange(invoice.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sent">{t('sent')}</SelectItem>
                          <SelectItem value="paid">{t('markAsPaid') || 'Marcar pagada'}</SelectItem>
                          <SelectItem value="overdue">{t('markOverdue') || 'Marcar vencida'}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    <Button variant="ghost" size="icon" onClick={() => onView(invoice)} title={t('view') || 'Ver'}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDownload(invoice)} title={t('downloadPDF') || 'Descargar PDF'}>
                      <Download className="w-4 h-4" />
                    </Button>
                    {invoice.status === 'draft' && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(invoice.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50" title={t('delete') || 'Eliminar'}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}