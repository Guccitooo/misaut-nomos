import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Plus, Edit2, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const FAQ_SUGGESTIONS = [
  { q: "¿Cuánto cuesta una revisión/presupuesto?", a: "Los presupuestos son gratuitos y sin compromiso." },
  { q: "¿En qué zonas trabajáis?", a: "Trabajamos en toda la zona metropolitana." },
  { q: "¿Ofrecéis garantía?", a: "Sí, todos nuestros trabajos tienen garantía." },
  { q: "¿Cuál es el tiempo de respuesta?", a: "Normalmente respondemos en menos de 24 horas." },
  { q: "¿Aceptáis trabajos urgentes?", a: "Sí, disponemos de servicio de urgencias." },
  { q: "¿Qué formas de pago aceptáis?", a: "Aceptamos efectivo, tarjeta, transferencia y Bizum." },
];

export default function FAQSection({ 
  faqItems = [], 
  isEditing, 
  onFAQChange 
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: ""
  });

  const resetForm = () => {
    setFormData({ question: "", answer: "" });
    setEditingItem(null);
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const openEditDialog = (item) => {
    setFormData({
      question: item.question || "",
      answer: item.answer || ""
    });
    setEditingItem(item);
    setShowAddDialog(true);
  };

  const useSuggestion = (suggestion) => {
    setFormData({
      question: suggestion.q,
      answer: suggestion.a
    });
  };

  const saveItem = () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Completa la pregunta y la respuesta");
      return;
    }

    const newItem = {
      id: editingItem?.id || Date.now().toString(),
      question: formData.question.trim(),
      answer: formData.answer.trim()
    };

    let updatedItems;
    if (editingItem) {
      updatedItems = faqItems.map(item => 
        item.id === editingItem.id ? newItem : item
      );
    } else {
      updatedItems = [...faqItems, newItem];
    }

    onFAQChange(updatedItems);
    setShowAddDialog(false);
    resetForm();
    toast.success(editingItem ? "Pregunta actualizada" : "Pregunta añadida");
  };

  const deleteItem = (itemId) => {
    onFAQChange(faqItems.filter(item => item.id !== itemId));
    toast.success("Pregunta eliminada");
  };

  return (
    <Card className="shadow-sm border-0 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-green-600" />
            Preguntas Frecuentes ({faqItems.length})
          </CardTitle>
          {isEditing && (
            <Button onClick={openAddDialog} size="sm" className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-1" />
              Añadir pregunta
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Configura preguntas frecuentes para que los clientes encuentren respuestas rápidamente
        </p>

        {faqItems.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No hay preguntas frecuentes</p>
            {isEditing && (
              <Button onClick={openAddDialog} variant="outline" className="mt-3">
                <Plus className="w-4 h-4 mr-1" />
                Añadir primera pregunta
              </Button>
            )}
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, idx) => (
              <AccordionItem key={item.id} value={item.id} className="border rounded-lg mb-2 px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 text-left flex-1">
                    <span className="font-medium">{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2 pb-3">
                    <p className="text-gray-700">{item.answer}</p>
                    {isEditing && (
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Dialog para añadir/editar */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar pregunta" : "Añadir pregunta frecuente"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {!editingItem && (
                <div>
                  <Label className="text-sm text-gray-600">Sugerencias rápidas:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {FAQ_SUGGESTIONS.slice(0, 4).map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => useSuggestion(s)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                      >
                        {s.q.substring(0, 30)}...
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Pregunta *</Label>
                <Input
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Ej: ¿Cuánto cuesta el servicio?"
                />
              </div>

              <div>
                <Label>Respuesta *</Label>
                <Textarea
                  value={formData.answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="Escribe una respuesta clara y concisa..."
                  className="h-24"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={saveItem} className="bg-green-600 hover:bg-green-700">
                {editingItem ? "Guardar cambios" : "Añadir pregunta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}