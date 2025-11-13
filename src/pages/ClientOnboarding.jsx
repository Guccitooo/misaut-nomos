
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Loader2, AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";
import ModernCheckbox from "../components/ui/ModernCheckbox";
import { Link } from "react-router-dom";

export default function ClientOnboardingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [error, setError] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    provincia: "",
    ciudad: "",
    servicios_buscados: [],
    acepta_terminos: false,
  });

  const serviciosDisponibles = [
    "Electricista",
    "Fontanero",
    "Carpintero",
    "Albañil / Reformas",
    "Jardinero",
    "Pintor",
    "Transportista",
    "Autónomo de limpieza",
    "Asesoría o gestoría",
    "Empresa multiservicios"
  ];

  // ✅ AMPLIADO: TODAS las provincias españolas ordenadas alfabéticamente
  const provincias = [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila",
    "Badajoz", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria",
    "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Gerona", "Granada",
    "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Islas Baleares",
    "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León", "Lérida",
    "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Orense", "Palencia",
    "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla",
    "Soria", "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid",
    "Vizcaya", "Zamora", "Zaragoza"
  ].sort(); // Ensure it remains sorted

  // ✅ AMPLIADO: Ciudades principales por provincia (ordenadas alfabéticamente)
  const ciudadesPorProvincia = {
    "Álava": ["Vitoria-Gasteiz", "Llodio", "Amurrio", "Salvatierra"],
    "Albacete": ["Albacete", "Hellín", "Villarrobledo", "Almansa", "La Roda", "Caudete"],
    "Alicante": ["Alicante", "Elche", "Torrevieja", "Orihuela", "Benidorm", "Alcoy", "San Vicente del Raspeig", "Elda", "Dénia", "Villena", "Santa Pola", "Petrer", "Calpe", "Altea", "Jávea", "Villajoyosa", "Ibi", "Campello", "Crevillente", "Novelda", "Aspe"],
    "Almería": ["Almería", "Roquetas de Mar", "El Ejido", "Níjar", "Adra", "Vícar", "Huércal-Overa"],
    "Asturias": ["Oviedo", "Gijón", "Avilés", "Siero", "Langreo", "Mieres", "Castrillón", "Llanera", "Corvera", "Carreño", "Gozón", "Navia", "Villaviciosa", "Tineo"],
    "Ávila": ["Ávila", "Arévalo", "Arenas de San Pedro", "El Tiemblo"],
    "Badajoz": ["Badajoz", "Mérida", "Don Benito", "Almendralejo", "Villanueva de la Serena", "Zafra", "Montijo", "Villafranca de los Barros", "Olivenza"],
    "Barcelona": ["Barcelona", "L'Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell", "Mataró", "Santa Coloma de Gramenet", "Cornellà de Llobregat", "Sant Boi de Llobregat", "Rubí", "Manresa", "Vilanova i la Geltrú", "Viladecans", "Castelldefels", "El Prat de Llobregat", "Granollers", "Cerdanyola del Vallès", "Sant Cugat del Vallès", "Mollet del Vallès", "Esplugues de Llobregat", "Gavà", "Vic", "Sant Feliu de Llobregat", "Igualada", "Sitges"],
    "Burgos": ["Burgos", "Miranda de Ebro", "Aranda de Duero", "Briviesca"],
    "Cáceres": ["Cáceres", "Plasencia", "Navalmoral de la Mata", "Coria", "Trujillo"],
    "Cádiz": ["Cádiz", "Jerez de la Frontera", "Algeciras", "San Fernando", "El Puerto de Santa María", "Chiclana de la Frontera", "La Línea de la Concepción", "Sanlúcar de Barrameda", "Puerto Real", "Arcos de la Frontera", "Conil de la Frontera", "Barbate", "Rota"],
    "Cantabria": ["Santander", "Torrelavega", "Castro-Urdiales", "Camargo", "Piélagos", "El Astillero", "Santa Cruz de Bezana", "Laredo", "Santoña"],
    "Castellón": ["Castellón de la Plana", "Vila-real", "Burriana", "Vinaròs", "Onda", "Benicàssim", "Nules", "Almassora", "Benicarló", "La Vall d'Uixó"],
    "Ciudad Real": ["Ciudad Real", "Puertollano", "Tomelloso", "Alcázar de San Juan", "Valdepeñas", "Manzanares", "Daimiel"],
    "Córdoba": ["Córdoba", "Lucena", "Puente Genil", "Montilla", "Priego de Córdoba", "Cabra", "Baena", "Palma del Río", "Pozoblanco", "Peñarroya-Pueblonuevo"],
    "Cuenca": ["Cuenca", "Tarancón", "Quintanar del Rey", "San Clemente"],
    "Gerona": ["Gerona", "Figueras", "Blanes", "Lloret de Mar", "Olot", "Salt", "Palafrugell"],
    "Granada": ["Granada", "Motril", "Almuñécar", "Armilla", "Loja", "Baza", "Guadix", "Maracena", "Atarfe", "Huétor Vega"],
    "Guadalajara": ["Guadalajara", "Azuqueca de Henares", "Alovera", "Cabanillas del Campo"],
    "Guipúzcoa": ["San Sebastián", "Irún", "Éibar", "Rentería", "Mondragón", "Hernani", "Lasarte-Oria", "Zarautz", "Hondarribia", "Beasain", "Andoain"],
    "Huelva": ["Huelva", "Lepe", "Almonte", "Moguer", "Isla Cristina", "Ayamonte", "Cartaya", "Punta Umbría", "Aljaraque"],
    "Huesca": ["Huesca", "Monzón", "Barbastro", "Jaca", "Fraga"],
    "Islas Baleares": ["Palma de Mallorca", "Calvià", "Manacor", "Ibiza", "Mahón", "Llucmajor", "Marratxí", "Inca", "Alcúdia", "Felanitx", "Ciutadella de Menorca", "Santa Eulalia del Río", "Pollensa"],
    "Jaén": ["Jaén", "Linares", "Andújar", "Úbeda", "Martos", "Alcalá la Real", "Bailén", "Baeza", "Villacarrillo"],
    "La Coruña": ["La Coruña", "Santiago de Compostela", "Ferrol", "Oleiros", "Narón", "Arteixo", "Culleredo", "Carballo", "Betanzos", "Cambre", "Ames"],
    "La Rioja": ["Logroño", "Calahorra", "Arnedo", "Haro", "Lardero"],
    "Las Palmas": ["Las Palmas de Gran Canaria", "Telde", "Santa Lucía de Tirajana", "Arucas", "Agüimes", "Ingenio", "San Bartolomé de Tirajana", "Puerto del Rosario", "Arrecife", "Mogán"],
    "León": ["León", "Ponferrada", "San Andrés del Rabanedo", "Villaquilambre", "Astorga", "La Bañeza", "Valencia de Don Juan", "Villablino"],
    "Lérida": ["Lérida", "Tàrrega", "Mollerussa", "Balaguer", "La Seu d'Urgell"],
    "Lugo": ["Lugo", "Monforte de Lemos", "Viveiro", "Vilalba", "Foz"],
    "Madrid": ["Madrid", "Alcalá de Henares", "Móstoles", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón", "Torrejón de Ardoz", "Parla", "Alcobendas", "San Sebastián de los Reyes", "Pozuelo de Alarcón", "Las Rozas", "Majadahonda", "Rivas-Vaciamadrid", "Coslada", "Valdemoro", "Collado Villalba", "Aranjuez", "Arganda del Rey", "Boadilla del Monte", "Pinto", "San Fernando de Henares", "Colmenar Viejo", "Galapagar"],
    "Málaga": ["Málaga", "Marbella", "Mijas", "Vélez-Málaga", "Fuengirola", "Torremolinos", "Estepona", "Benalmádena", "Rincón de la Victoria", "Antequera", "Ronda", "Alhaurín de la Torre", "Nerja", "Coín", "Alhaurín el Grande", "Manilva", "Torrox", "Cártama"],
    "Murcia": ["Murcia", "Cartagena", "Lorca", "Molina de Segura", "Alcantarilla", "Mazarrón", "Cieza", "Yecla", "Águilas", "Torre-Pacheco", "San Javier", "Jumilla", "Totana", "Las Torres de Cotillas", "San Pedro del Pinatar", "Archena", "Caravaca de la Cruz", "Alhama de Murcia"],
    "Navarra": ["Pamplona", "Tudela", "Barañáin", "Burlada", "Estella", "Tafalla", "Zizur Mayor"],
    "Orense": ["Orense", "Verín", "O Barco de Valdeorras", "Xinzo de Limia", "O Carballiño"],
    "Palencia": ["Palencia", "Guardo", "Aguilar de Campoo", "Venta de Baños"],
    "Pontevedra": ["Vigo", "Pontevedra", "Vilagarcía de Arousa", "Redondela", "Cangas", "Marín", "O Porriño", "Sanxenxo", "Baiona", "Moaña", "Ponteareas", "Lalín"],
    "Salamanca": ["Salamanca", "Béjar", "Ciudad Rodrigo", "Santa Marta de Tormes"],
    "Santa Cruz de Tenerife": ["Santa Cruz de Tenerife", "San Cristóbal de La Laguna", "Arona", "Adeje", "Granadilla de Abona", "Santa Cruz de La Palma", "Los Llanos de Aridane", "Puerto de la Cruz", "Los Realejos"],
    "Segovia": ["Segovia", "Cuéllar", "San Ildefonso", "El Espinar"],
    "Sevilla": ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Mairena del Aljarafe", "Écija", "Los Palacios y Villafranca", "La Rinconada", "Camas", "Morón de la Frontera", "Carmona", "Lebrija", "San Juan de Aznalfarache", "Coria del Río", "Tomares", "Bormujos"],
    "Soria": ["Soria", "Almazán", "El Burgo de Osma"],
    "Tarragona": ["Tarragona", "Reus", "Tortosa", "El Vendrell", "Cambrils", "Valls", "Vila-seca", "Salou", "Amposta", "Calafell", "Roda de Berà"],
    "Teruel": ["Teruel", "Alcañiz", "Andorra", "Calamocha"],
    "Toledo": ["Toledo", "Talavera de la Reina", "Illescas", "Seseña", "Torrijos", "Yuncos", "Olías del Rey", "Sonseca", "Quintanar de la Orden"],
    "Valencia": ["Valencia", "Gandía", "Torrent", "Paterna", "Sagunto", "Mislata", "Burjassot", "Alzira", "Sueca", "Xirivella", "Manises", "Ontinyent", "Alaquàs", "Catarroja", "Xàtiva", "Cullera", "Massamagrell", "Quart de Poblet", "Alfafar", "Requena"],
    "Valladolid": ["Valladolid", "Laguna de Duero", "Medina del Campo", "Arroyo de la Encomienda", "Tudela de Duero", "Íscar", "Cigales", "Peñafiel"],
    "Vizcaya": ["Bilbao", "Barakaldo", "Getxo", "Portugalete", "Santurtzi", "Basauri", "Leioa", "Galdakao", "Durango", "Sestao", "Erandio", "Bermeo", "Amorebieta", "Gernika"],
    "Zamora": ["Zamora", "Benavente", "Toro", "Villalpando"],
    "Zaragoza": ["Zaragoza", "Calatayud", "Utebo", "Ejea de los Caballeros", "Cuarte de Huerva", "Tarazona", "Caspe", "Zuera", "Alagón", "Borja", "Tudela"]
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      const savedFormData = localStorage.getItem('client_onboarding_pending');
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData);
          console.log('📋 Datos guardados encontrados, procesando...');
          
          setFormData(parsedData);
          localStorage.removeItem('client_onboarding_pending');
          
          completeOnboardingMutation.mutate(parsedData);
          
          toast.info('Completando tu registro...', { duration: 2000 });
        } catch (error) {
          console.error('Error procesando datos guardados:', error);
          localStorage.removeItem('client_onboarding_pending');
        }
      }
    }
  }, [user]);

  const loadUser = async () => {
    setIsLoadingUser(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          nombre: currentUser.full_name || prev.nombre,
          email: currentUser.email || prev.email,
          telefono: currentUser.phone || prev.telefono,
          ciudad: currentUser.city || prev.ciudad,
        }));

        if (currentUser.user_type === "client") {
          navigate(createPageUrl("Search"));
          return;
        }

        if (currentUser.user_type === "professionnel") {
          setError("Ya tienes una cuenta profesional activa. No puedes crear una cuenta de cliente.");
          setTimeout(() => {
            navigate(createPageUrl("MyProfile"));
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const completeOnboardingMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe({
        user_type: "client",
        full_name: data.nombre,
        phone: data.telefono,
        city: data.ciudad
      });

      await base44.integrations.Core.SendEmail({
        to: data.email,
        subject: "¡Bienvenido a Misautónomos!",
        body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 50px; height: 50px; background: white; border-radius: 12px; display: inline-block; line-height: 50px; font-size: 24px; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .benefits { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 25px; margin: 30px 0; border-radius: 8px; }
    .benefits h3 { color: #1e40af; margin: 0 0 15px 0; font-size: 18px; }
    .benefits ul { margin: 0; padding-left: 20px; color: #4b5563; }
    .benefits li { margin-bottom: 10px; }
    .check { color: #10b981; font-weight: bold; }
    .cta { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); }
    .services { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; }
    .services h4 { color: #1f2937; margin: 0 0 10px 0; font-size: 16px; }
    .services p { color: #6b7280; margin: 0; font-size: 14px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 10px; font-size: 16px; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💼</div>
      <h1>Misautónomos</h1>
      <p>Tu autónomo de confianza</p>
    </div>
    
    <div class="content">
      <p class="greeting">¡Hola ${data.nombre}!</p>
      
      <p class="message">
        Bienvenido a <strong>Misautónomos</strong>, la plataforma que conecta clientes con los mejores profesionales autónomos de España.
      </p>
      
      <p class="message">
        Tu cuenta de cliente ha sido creada correctamente y ya puedes empezar a buscar profesionales en tu zona.
      </p>
      
      <div class="benefits">
        <h3>¿Qué puedes hacer ahora?</h3>
        <ul>
          <li><span class="check">✓</span> Buscar profesionales por categoría y ubicación</li>
          <li><span class="check">✓</span> Ver perfiles completos con fotos y valoraciones</li>
          <li><span class="check">✓</span> Contactar directamente con autónomos verificados</li>
          <li><span class="check">✓</span> Chatear con ellos para coordinar trabajos</li>
          <li><span class="check">✓</span> Dejar valoraciones después de contratar</li>
        </ul>
      </div>
      
      <div class="services">
        <h4>Servicios que buscas:</h4>
        <p>${data.servicios_buscados.join(', ')}</p>
      </div>
      
      <div class="cta">
        <a href="https://autonomosmil.es/search" class="button">
          Buscar Profesionales Ahora →
        </a>
      </div>
      
      <p class="message" style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        <strong>Todo esto de forma 100% GRATUITA.</strong> No tienes que pagar nada para usar Misautónomos como cliente.
      </p>
    </div>
    
    <div class="footer">
      <strong>Equipo Misautónomos</strong>
      <p>Tu autónomo de confianza</p>
      <p style="margin-top: 15px;">
        <a href="mailto:soporte@autonomosmil.es">soporte@autonomosmil.es</a> | 
        <a href="https://autonomosmil.es">autonomosmil.es</a>
      </p>
    </div>
  </div>
</body>
</html>
        `,
        from_name: "Misautónomos"
      });

      return data;
    },
    onSuccess: () => {
      toast.success("✅ ¡Bienvenido a Misautónomos! Tu cuenta está lista.");
      localStorage.removeItem('client_onboarding_pending');
      setTimeout(() => {
        navigate(createPageUrl("Search"));
      }, 1000);
    },
    onError: (error) => {
      console.error("Error completing onboarding:", error);
      setError("Error al completar el registro: " + error.message);
      toast.error("Error al completar el registro");
      localStorage.removeItem('client_onboarding_pending');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.acepta_terminos) {
      setError("❌ Debes aceptar los Términos y Condiciones para continuar.");
      toast.error("Debes aceptar los Términos y Condiciones");
      document.getElementById('acepta_terminos_client')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!formData.nombre || formData.nombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }

    if (!formData.email || !formData.email.includes('@')) {
      setError("Email inválido");
      return;
    }

    if (!formData.telefono || formData.telefono.replace(/\s/g, '').length < 9) {
      setError("El teléfono debe tener al menos 9 dígitos");
      return;
    }

    if (!formData.provincia || formData.provincia.trim().length === 0) {
      setError("Selecciona una provincia");
      return;
    }

    if (!formData.ciudad || formData.ciudad.trim().length === 0) {
      setError("Selecciona una ciudad");
      return;
    }

    if (formData.servicios_buscados.length === 0) {
      setError("Selecciona al menos un tipo de servicio que buscas");
      return;
    }

    if (!user) {
      console.log('💾 Guardando datos y preparando redirección...');
      
      setIsRedirecting(true);
      
      localStorage.setItem('client_onboarding_pending', JSON.stringify(formData));
      
      try {
        console.log('🔄 Redirigiendo a login...');
        await base44.auth.redirectToLogin(window.location.href);
      } catch (error) {
        console.error('❌ Error en redirección:', error);
        setError('Error al redirigir al sistema de login. Por favor, intenta de nuevo.');
        setIsRedirecting(false);
      }
      
      return;
    }

    completeOnboardingMutation.mutate(formData);
  };

  const toggleServicio = (servicio) => {
    const servicios = formData.servicios_buscados;
    if (servicios.includes(servicio)) {
      setFormData({
        ...formData,
        servicios_buscados: servicios.filter(s => s !== servicio)
      });
    } else {
      setFormData({
        ...formData,
        servicios_buscados: [...servicios, servicio]
      });
    }
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Redirigiendo al registro...
            </h2>
            <p className="text-gray-600 mb-4">
              Estamos guardando tus datos y preparando tu cuenta.
            </p>
            <p className="text-sm text-gray-500">
              Serás redirigido al sistema de registro en unos segundos...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
        <p className="ml-3 text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (user?.user_type === "professionnel") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ya tienes una cuenta profesional
            </h2>
            <p className="text-gray-600 mb-6">
              Tu cuenta ya está configurada como autónomo. No puedes crear una cuenta de cliente simultáneamente.
            </p>
            <p className="text-sm text-gray-500">
              Redirigiendo a tu perfil...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Crea tu cuenta de cliente
          </h1>
          <p className="text-lg text-gray-600">
            Completa estos datos para empezar a buscar profesionales
          </p>
          <p className="text-sm text-green-700 font-semibold mt-2">
            ✅ 100% GRATIS - Sin costes ocultos
          </p>
          {!user && (
            <p className="text-sm text-blue-600 mt-2">
              📝 Al enviar, crearemos tu cuenta y recibirás un email de verificación de Misautónomos
            </p>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div>
                <Label>Nombre completo *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  maxLength={100}
                  className="h-12 mt-2"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
                  className="h-12 mt-2"
                  required
                  disabled={!!user}
                />
                {user && (
                  <p className="text-xs text-gray-500 mt-1">
                    Email de tu cuenta (no se puede cambiar aquí)
                  </p>
                )}
                {!user && (
                  <p className="text-xs text-gray-500 mt-1">
                    Recibirás un email de verificación de Misautónomos en esta dirección
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <Label>Teléfono *</Label>
                <Input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/[^\d+]/g, '') })}
                  placeholder="612345678"
                  maxLength={15}
                  className="h-12 mt-2"
                  required
                />
              </div>

              {/* ✅ NUEVO: Provincia */}
              <div>
                <Label>Provincia *</Label>
                <Select
                  value={formData.provincia}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      provincia: value,
                      ciudad: ""
                    });
                  }}
                >
                  <SelectTrigger className="h-12 mt-2">
                    <SelectValue placeholder="Selecciona tu provincia" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {provincias.map((prov) => (
                      <SelectItem key={prov} value={prov}>
                        {prov}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ NUEVO: Ciudad (solo aparece si hay provincia seleccionada) */}
              {formData.provincia && (
                <div>
                  <Label>Ciudad *</Label>
                  <Select
                    value={formData.ciudad}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        ciudad: value
                      });
                    }}
                  >
                    <SelectTrigger className="h-12 mt-2">
                      <SelectValue placeholder="Selecciona tu ciudad" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {ciudadesPorProvincia[formData.provincia]?.length > 0 ? (
                        ciudadesPorProvincia[formData.provincia].map((ciudad) => (
                          <SelectItem key={ciudad} value={ciudad}>
                            {ciudad}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value={formData.provincia}>
                          {formData.provincia}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Servicios buscados */}
              <div>
                <Label>¿Qué tipo de servicios buscas? * (selecciona al menos uno)</Label>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {serviciosDisponibles.map((servicio) => (
                    <div
                      key={servicio}
                      onClick={() => toggleServicio(servicio)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.servicios_buscados.includes(servicio)
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <p className="text-sm font-medium">{servicio}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {formData.servicios_buscados.length} seleccionado(s)
                </p>
              </div>

              {/* ✅ MEJORADO: Checkbox moderno con enlace */}
              <ModernCheckbox
                id="acepta_terminos_client"
                checked={formData.acepta_terminos}
                onChange={(checked) => {
                  setFormData({ ...formData, acepta_terminos: checked });
                  if (checked && error?.includes('Términos')) setError(null);
                }}
                required
                error={error?.includes('Términos')}
                label="Acepto los Términos y Condiciones"
                sublabel={
                  <span>
                    He leído y acepto los{" "}
                    <Link 
                      to={createPageUrl("TermsConditions")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-semibold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Términos y Condiciones
                    </Link>
                    , la{" "}
                    <Link 
                      to={createPageUrl("PrivacyPolicy")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-semibold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Política de Privacidad
                    </Link>
                    {" "}y el tratamiento de mis datos personales.
                  </span>
                }
              />

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                disabled={completeOnboardingMutation.isPending || isRedirecting}
              >
                {completeOnboardingMutation.isPending || isRedirecting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isRedirecting ? 'Redirigiendo...' : 'Creando tu cuenta...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {!user ? 'Crear mi cuenta de cliente' : 'Completar registro'}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                {!user 
                  ? '📧 Recibirás un email de verificación de Misautónomos para confirmar tu cuenta'
                  : 'Al completar el registro podrás buscar y contactar con profesionales de forma gratuita'
                }
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">100% Gratis</p>
              <p className="text-xs text-gray-600">Sin costes ocultos</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Profesionales verificados</p>
              <p className="text-xs text-gray-600">Con valoraciones reales</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Chat directo</p>
              <p className="text-xs text-gray-600">Contacto inmediato</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
