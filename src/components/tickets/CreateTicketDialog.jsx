import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Paperclip, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../ui/LanguageSwitcher";

const typeConfig = {
  soporte_cliente: { text_es: "Soporte Cliente", text_en: "Client Support" },
  soporte_autonomo: { text_es: "Soporte Autónomo", text_en: "Professional Support" },
  reclamo: { text_es: "Reclamo", text_en: "Complaint" },
  problema_trabajo: { text_es: "Problema con trabajo", text_en: "Job Issue" },
  problema_pago: { text_es: "Problema de pago", text_en: "Payment Issue" },
  consulta_general: { text_es: "Consulta general", text_en: "General Query" }
};

export default function CreateTicketDialog({ open, onClose, user, relatedProfessionalId = null }) {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("consulta_general");
  const [priority, setPriority] = useState("media");
  const [assignedToId, setAssignedToId] = useState(relatedProfessionalId || "");
  const [tags, setTags] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const { data: professionals = [] } = useQuery({
    queryKey: ['allProfessionals'],
    queryFn: async () => {
      const profiles = await base44.entities.ProfessionalProfile.list();
      return profiles;
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData) => {
      console.log('🎫 Creando ticket con datos:', ticketData);
      
      const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;
      
      const ticketToCreate = {
        ticket_number: ticketNumber,
        title: ticketData.title,
        description: ticketData.description,
        type: ticketData.type,
        priority: ticketData.priority,
        creator_id: user.id,
        creator_name: user.full_name || user.email,
        creator_type: user.user_type || 'client',
        status: 'abierto',
        last_activity: new Date().toISOString(),
        tags: ticketData.tags || [],
        attachments: ticketData.attachments || [],
      };

      if (ticketData.assigned_to_id) {
        ticketToCreate.assigned_to_id = ticketData.assigned_to_id;
        ticketToCreate.assigned_to_name = ticketData.assigned_to_name;
        ticketToCreate.related_professional_id = ticketData.assigned_to_id;
      }

      console.log('✅ Ticket a crear:', ticketToCreate);
      
      const ticket = await base44.entities.Ticket.create(ticketToCreate);
      console.log('✅ Ticket creado:', ticket);

      await base44.entities.TicketEvent.create({
        ticket_id: ticket.id,
        event_type: 'created',
        user_id: user.id,
        user_name: user.full_name || user.email,
        description: `Ticket creado: ${ticketData.title}`
      });
      console.log('✅ Evento de ticket creado');

      try {
        await base44.functions.invoke('sendTicketNotification', {
          ticketId: ticket.id,
          recipientId: 'admin',
          type: 'new_ticket',
          message: ticketData.description
        });
        console.log('✅ Notificación enviada al admin');

        if (ticketData.assigned_to_id) {
          await base44.functions.invoke('sendTicketNotification', {
            ticketId: ticket.id,
            recipientId: ticketData.assigned_to_id,
            type: 'new_ticket',
            message: ticketData.description
          });
          console.log('✅ Notificación enviada al profesional');
        }
      } catch (notifError) {
        console.error('⚠️ Error enviando notificaciones (no crítico):', notifError);
      }

      return ticket;
    },
    onSuccess: (data) => {
      console.log('🎉 Ticket creado exitosamente:', data);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success(language === 'es' ? '✅ Ticket creado correctamente' : '✅ Ticket created successfully');
      resetForm();
      onClose();
    },
    onError: (error) => {
      console.error('❌ Error creando ticket:', error);
      toast.error(language === 'es' ? 'Error al crear el ticket: ' + error.message : 'Error creating ticket: ' + error.message);
    }
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("consulta_general");
    setPriority("media");
    setAssignedToId(relatedProfessionalId || "");
    setTags("");
    setAttachments([]);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachments([...attachments, file_url]);
      toast.success(language === 'es' ? 'Archivo adjunto' : 'File attached');
    } catch (error) {
      toast.error(language === 'es' ? 'Error subiendo archivo' : 'Error uploading file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    console.log('📝 Iniciando creación de ticket...');
    console.log('Título:', title);
    console.log('Descripción:', description);
    console.log('Usuario:', user);

    if (!title.trim() || !description.trim()) {
      toast.error(language === 'es' ? 'Completa título y descripción' : 'Complete title and description');
      return;
    }

    if (!user || !user.id) {
      toast.error(language === 'es' ? 'Error: Usuario no autenticado' : 'Error: User not authenticated');
      console.error('❌ Usuario no disponible:', user);
      return;
    }

    const selectedProfessional = professionals.find(p => p.user_id === assignedToId);

    const ticketData = {
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      assigned_to_id: assignedToId || null,
      assigned_to_name: selectedProfessional?.business_name || null,
      related_professional_id: assignedToId || null,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
      attachments: attachments || []
    };

    console.log('📤 Enviando ticket con datos:', ticketData);
    createTicketMutation.mutate(ticketData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'es' ? 'Crear Nuevo Ticket' : 'Create New Ticket'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {language === 'es' ? 'Título *' : 'Title *'}
            </label>
            <Input
              placeholder={language === 'es' ? "Describe brevemente el problema..." : "Briefly describe the issue..."}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {language === 'es' ? 'Descripción *' : 'Description *'}
            </label>
            <Textarea
              placeholder={language === 'es' ? "Explica detalladamente el problema..." : "Explain the issue in detail..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'es' ? 'Tipo de ticket' : 'Ticket type'}
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {language === 'es' ? config.text_es : config.text_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'es' ? 'Prioridad' : 'Priority'}
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">{language === 'es' ? 'Baja' : 'Low'}</SelectItem>
                  <SelectItem value="media">{language === 'es' ? 'Media' : 'Medium'}</SelectItem>
                  <SelectItem value="alta">{language === 'es' ? 'Alta' : 'High'}</SelectItem>
                  <SelectItem value="urgente">{language === 'es' ? 'Urgente' : 'Urgent'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {professionals.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'es' ? 'Relacionado con profesional (opcional)' : 'Related to professional (optional)'}
              </label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'es' ? "Seleccionar profesional..." : "Select professional..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>{language === 'es' ? 'Ninguno' : 'None'}</SelectItem>
                  {professionals.map((prof) => (
                    <SelectItem key={prof.user_id} value={prof.user_id}>
                      {prof.business_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">
              {language === 'es' ? 'Etiquetas (separadas por comas)' : 'Tags (comma separated)'}
            </label>
            <Input
              placeholder={language === 'es' ? "urgente, pago, problema técnico" : "urgent, payment, technical issue"}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {language === 'es' ? 'Archivos adjuntos' : 'Attachments'}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((url, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                  <span className="text-xs">Archivo {idx + 1}</span>
                  <button
                    onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <input
              type="file"
              className="hidden"
              id="ticket-file-upload"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('ticket-file-upload').click()}
              disabled={uploadingFile}
            >
              {uploadingFile ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4 mr-2" />
              )}
              {language === 'es' ? 'Adjuntar archivo' : 'Attach file'}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createTicketMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createTicketMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {language === 'es' ? 'Crear Ticket' : 'Create Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}