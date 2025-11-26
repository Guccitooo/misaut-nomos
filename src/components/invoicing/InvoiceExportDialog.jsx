import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Download, FileSpreadsheet, FileCode, FileJson, 
  Loader2, CheckCircle, Info, ExternalLink 
} from "lucide-react";
import { toast } from "sonner";

const SOFTWARE_OPTIONS = [
  { 
    id: 'generic', 
    name: 'Genérico', 
    description: 'Formato universal compatible con Excel y la mayoría de programas',
    formats: ['csv', 'xml', 'json'],
    icon: FileSpreadsheet,
    color: 'blue'
  },
  { 
    id: 'contasimple', 
    name: 'Contasimple', 
    description: 'Optimizado para importar en Contasimple',
    formats: ['csv'],
    icon: FileSpreadsheet,
    color: 'green',
    helpUrl: 'https://www.contasimple.com/ayuda/importar-facturas'
  },
  { 
    id: 'holded', 
    name: 'Holded', 
    description: 'Compatible con el importador de Holded',
    formats: ['csv', 'json'],
    icon: FileSpreadsheet,
    color: 'purple',
    helpUrl: 'https://support.holded.com/es/articles/1709055-importar-facturas'
  },
  { 
    id: 'sage', 
    name: 'Sage 50', 
    description: 'Formato para importar en Sage 50 / ContaPlus',
    formats: ['csv', 'xml'],
    icon: FileCode,
    color: 'orange',
    helpUrl: 'https://www.sage.com/es-es/sage-50/'
  },
  { 
    id: 'facturae', 
    name: 'FacturaE', 
    description: 'Formato oficial español para factura electrónica',
    formats: ['xml'],
    icon: FileCode,
    color: 'red',
    helpUrl: 'https://www.facturae.gob.es/'
  }
];

const FORMAT_INFO = {
  csv: { name: 'CSV', icon: FileSpreadsheet, description: 'Abre con Excel, Google Sheets, etc.' },
  xml: { name: 'XML', icon: FileCode, description: 'Importación automática en software contable' },
  json: { name: 'JSON', icon: FileJson, description: 'Para integraciones y desarrolladores' }
};

export default function InvoiceExportDialog({ open, onOpenChange, invoices = [] }) {
  const [selectedSoftware, setSelectedSoftware] = useState('generic');
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [selectAll, setSelectAll] = useState(true);
  const [exporting, setExporting] = useState(false);

  const software = SOFTWARE_OPTIONS.find(s => s.id === selectedSoftware);
  const availableFormats = software?.formats || ['csv'];

  // Filtrar facturas por fecha
  const filteredInvoices = invoices.filter(inv => {
    if (dateFrom && inv.issue_date < dateFrom) return false;
    if (dateTo && inv.issue_date > dateTo) return false;
    return true;
  });

  // Facturas a exportar
  const invoicesToExport = selectAll 
    ? filteredInvoices 
    : filteredInvoices.filter(inv => selectedInvoiceIds.includes(inv.id));

  const handleSoftwareChange = (softwareId) => {
    setSelectedSoftware(softwareId);
    const sw = SOFTWARE_OPTIONS.find(s => s.id === softwareId);
    if (sw && !sw.formats.includes(selectedFormat)) {
      setSelectedFormat(sw.formats[0]);
    }
  };

  const handleExport = async () => {
    if (invoicesToExport.length === 0) {
      toast.error('No hay facturas para exportar');
      return;
    }

    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportInvoices', {
        format: selectedFormat,
        software: selectedSoftware,
        invoiceIds: selectAll ? null : selectedInvoiceIds,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null
      });

      // Determinar nombre de archivo y tipo
      const filename = `facturas_${selectedSoftware}_${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      
      // Crear blob y descargar
      const blob = new Blob([response.data], { 
        type: selectedFormat === 'csv' ? 'text/csv' : 
              selectedFormat === 'xml' ? 'application/xml' : 'application/json'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`✅ ${invoicesToExport.length} facturas exportadas en formato ${selectedFormat.toUpperCase()}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.error || 'Error al exportar');
    } finally {
      setExporting(false);
    }
  };

  const toggleInvoice = (invoiceId) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Exportar Facturas
          </DialogTitle>
          <DialogDescription>
            Exporta tus facturas en formatos compatibles con software contable
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selección de software */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Software destino</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SOFTWARE_OPTIONS.map(sw => (
                <button
                  key={sw.id}
                  onClick={() => handleSoftwareChange(sw.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedSoftware === sw.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <sw.icon className={`w-4 h-4 text-${sw.color}-600`} />
                    <span className="font-medium text-sm">{sw.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{sw.description}</p>
                </button>
              ))}
            </div>
            {software?.helpUrl && (
              <a 
                href={software.helpUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2"
              >
                <Info className="w-3 h-3" />
                Ver guía de importación de {software.name}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Formato de archivo */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Formato de archivo</Label>
            <RadioGroup 
              value={selectedFormat} 
              onValueChange={setSelectedFormat}
              className="flex gap-4"
            >
              {availableFormats.map(format => {
                const info = FORMAT_INFO[format];
                return (
                  <div key={format} className="flex items-center space-x-2">
                    <RadioGroupItem value={format} id={format} />
                    <Label htmlFor={format} className="flex items-center gap-2 cursor-pointer">
                      <info.icon className="w-4 h-4 text-gray-600" />
                      <div>
                        <span className="font-medium">{info.name}</span>
                        <p className="text-xs text-gray-500">{info.description}</p>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Filtro de fechas */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Rango de fechas (opcional)</Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs text-gray-500">Desde</Label>
                <Input 
                  type="date" 
                  value={dateFrom} 
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-gray-500">Hasta</Label>
                <Input 
                  type="date" 
                  value={dateTo} 
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Selección de facturas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Facturas a exportar</Label>
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectAll}
                  onCheckedChange={setSelectAll}
                  id="selectAll"
                />
                <Label htmlFor="selectAll" className="text-sm cursor-pointer">
                  Todas ({filteredInvoices.length})
                </Label>
              </div>
            </div>

            {!selectAll && (
              <Card className="max-h-48 overflow-y-auto">
                <CardContent className="p-2 space-y-1">
                  {filteredInvoices.map(inv => (
                    <label 
                      key={inv.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedInvoiceIds.includes(inv.id)}
                        onCheckedChange={() => toggleInvoice(inv.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{inv.invoice_number}</span>
                        <span className="text-gray-500 text-sm ml-2">{inv.client_name}</span>
                      </div>
                      <span className="text-sm font-semibold">{inv.total?.toFixed(2)}€</span>
                    </label>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumen */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-900">
                    {invoicesToExport.length} facturas seleccionadas
                  </p>
                  <p className="text-sm text-blue-700">
                    Total: {invoicesToExport.reduce((s, i) => s + (i.total || 0), 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {software?.name} • {selectedFormat.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={exporting || invoicesToExport.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar {invoicesToExport.length} facturas
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}