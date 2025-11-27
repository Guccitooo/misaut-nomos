import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, CheckCircle, Mail, User, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function PublicTicketForm({ language = 'es' }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "consulta_general",
    title: "",
    description: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");

  const ticketTypes = [
    { value: "consulta_general", label_es: "Consulta general", label_en: "General inquiry" },
    { value: "soporte_cliente", label_es: "Soy cliente y necesito ayuda", label_en: "I'm a client and need help" },
    { value: "soporte_autonomo", label_es: "Soy autónomo y necesito ayuda", label_en: "I'm a professional and need help" },
    { value: "problema_pago", label_es: "Problema con pago/facturación", label_en: "Payment/billing issue" },
    { value: "reclamo", label_es: "Reclamación", label_en: "Complaint" },
  ];

  const generateTicketNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TKT-${timestamp}-${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.title.trim() || !formData.description.trim()) {
      toast.error(language === 'es' ? "Por favor completa todos los campos" : "Please fill in all fields");
      return;
    }

    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(language === 'es' ? "Email inválido" : "Invalid email");
      return;
    }

    setSubmitting(true);

    try {
      const newTicketNumber = generateTicketNumber();
      
      // Crear ticket público (sin user_id ya que no están autenticados)
      await base44.entities.Ticket.create({
        ticket_number: newTicketNumber,
        title: formData.title,
        description: `**Nombre:** ${formData.name}\n**Email:** ${formData.email}\n\n${formData.description}`,
        type: formData.type,
        status: "abierto",
        priority: "media",
        creator_id: "public_form",
        creator_name: formData.name,
        creator_type: "visitante",
        tags: ["formulario_publico", formData.email]
      });

      setTicketNumber(newTicketNumber);
      setSubmitted(true);
      
      // Enviar email de confirmación
      try {
        await base44.integrations.Core.SendEmail({
          to: formData.email,
          subject: language === 'es' 
            ? `Ticket recibido: ${newTicketNumber} - MisAutónomos` 
            : `Ticket received: ${newTicketNumber} - MisAutónomos`,
          body: language === 'es'
            ? `Hola ${formData.name},\n\nHemos recibido tu consulta. Tu número de ticket es: ${newTicketNumber}\n\nAsunto: ${formData.title}\n\nNos pondremos en contacto contigo lo antes posible.\n\nGracias,\nEquipo MisAutónomos`
            : `Hello ${formData.name},\n\nWe have received your inquiry. Your ticket number is: ${newTicketNumber}\n\nSubject: ${formData.title}\n\nWe will contact you as soon as possible.\n\nThank you,\nMisAutónomos Team`
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }

      toast.success(language === 'es' ? "¡Ticket enviado correctamente!" : "Ticket submitted successfully!");
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error(language === 'es' ? "Error al enviar el ticket" : "Error submitting ticket");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {language === 'es' ? '¡Ticket enviado!' : 'Ticket submitted!'}
          </h3>
          <p className="text-gray-600 mb-4">
            {language === 'es' 
              ? 'Hemos recibido tu consulta. Te responderemos lo antes posible.'
              : 'We have received your inquiry. We will respond as soon as possible.'}
          </p>
          <div className="bg-white rounded-lg p-4 inline-block mb-4">
            <p className="text-sm text-gray-600 mb-1">
              {language === 'es' ? 'Número de ticket:' : 'Ticket number:'}
            </p>
            <p className="text-xl font-mono font-bold text-blue-600">{ticketNumber}</p>
          </div>
          <p className="text-sm text-gray-500">
            {language === 'es' 
              ? 'Guarda este número para futuras referencias. Recibirás una confirmación en tu email.'
              : 'Save this number for future reference. You will receive a confirmation email.'}
          </p>
          <Button 
            onClick={() => {
              setSubmitted(false);
              setFormData({ name: "", email: "", type: "consulta_general", title: "", description: "" });
            }}
            variant="outline"
            className="mt-4"
          >
            {language === 'es' ? 'Enviar otro ticket' : 'Submit another ticket'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          {language === 'es' ? 'Enviar consulta' : 'Submit inquiry'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {language === 'es' 
            ? 'Completa el formulario y nos pondremos en contacto contigo'
            : 'Fill out the form and we will contact you'}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {language === 'es' ? 'Tu nombre *' : 'Your name *'}
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={language === 'es' ? "Ej: Juan Pérez" : "E.g.: John Smith"}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {language === 'es' ? 'Tu email *' : 'Your email *'}
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@ejemplo.com"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>{language === 'es' ? 'Tipo de consulta *' : 'Inquiry type *'}</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ticketTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {language === 'es' ? type.label_es : type.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{language === 'es' ? 'Asunto *' : 'Subject *'}</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={language === 'es' ? "Describe brevemente tu consulta" : "Briefly describe your inquiry"}
              className="mt-1"
            />
          </div>

          <div>
            <Label>{language === 'es' ? 'Mensaje *' : 'Message *'}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={language === 'es' 
                ? "Explica tu consulta con el mayor detalle posible..."
                : "Explain your inquiry in as much detail as possible..."}
              className="mt-1 h-32"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {language === 'es' ? 'Enviando...' : 'Sending...'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {language === 'es' ? 'Enviar consulta' : 'Submit inquiry'}
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            {language === 'es' 
              ? 'Al enviar, aceptas que procesemos tus datos para responder a tu consulta.'
              : 'By submitting, you agree that we process your data to respond to your inquiry.'}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}