import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function SendQuoteDialog({ open, onOpenChange, onSendQuote, loading }) {
  const [quoteData, setQuoteData] = useState({
    title: "",
    description: "",
    amount: "",
    validUntil: ""
  });

  const handleSend = async () => {
    if (!quoteData.title.trim() || !quoteData.amount) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    await onSendQuote({
      ...quoteData,
      amount: parseFloat(quoteData.amount)
    });

    setQuoteData({ title: "", description: "", amount: "", validUntil: "" });
  };

  const handleCancel = () => {
    setQuoteData({ title: "", description: "", amount: "", validUntil: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Enviar presupuesto PDF
          </DialogTitle>
          <DialogDescription>
            Envía un presupuesto formal directamente por el chat
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div>
            <Label className="text-sm font-medium">Título del presupuesto *</Label>
            <Input
              value={quoteData.title}
              onChange={(e) => setQuoteData(p => ({ ...p, title: e.target.value }))}
              placeholder="Ej: Diseño web corporativo"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Descripción del servicio</Label>
            <Textarea
              value={quoteData.description}
              onChange={(e) => setQuoteData(p => ({ ...p, description: e.target.value }))}
              placeholder="Detalla qué incluye el servicio..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Importe total (€) *</Label>
              <Input
                type="number"
                value={quoteData.amount}
                onChange={(e) => setQuoteData(p => ({ ...p, amount: e.target.value }))}
                placeholder="500"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Válido hasta</Label>
              <Input
                type="date"
                value={quoteData.validUntil}
                onChange={(e) => setQuoteData(p => ({ ...p, validUntil: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Enviar presupuesto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}