import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import { Star, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import SEOHead from "../components/seo/SEOHead";

/**
 * Página pública para dejar una reseña desde un link directo.
 * URL: /valorar/:professionalId
 * No requiere login para ver el formulario; al enviar, si no está logueado, redirige al login.
 */
export default function LeaveReviewPage() {
  const { professionalId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  const [ratings, setRatings] = useState({
    rapidez: 0,
    comunicacion: 0,
    calidad: 0,
    precio_satisfaccion: 0,
  });
  const [comment, setComment] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        // Cargar perfil profesional
        const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: professionalId });
        setProfile(profiles[0] || null);

        // Intentar cargar usuario (puede fallar si no está logueado)
        try {
          const u = await base44.auth.me();
          setUser(u);

          // Verificar si ya existe review
          if (u) {
            const existing = await base44.entities.Review.filter({
              professional_id: professionalId,
              client_id: u.id
            });
            setExistingReview(existing[0] || null);
          }
        } catch {}
      } catch {}
      setLoading(false);
    };
    if (professionalId) init();
  }, [professionalId]);

  const avgRating = Math.round(
    (ratings.rapidez + ratings.comunicacion + ratings.calidad + ratings.precio_satisfaccion) / 4
  );

  const handleSubmit = async () => {
    if (!user) {
      sessionStorage.setItem('review_pending', JSON.stringify({ professionalId, ratings, comment }));
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (Object.values(ratings).some(r => r === 0)) {
      toast.error("Valora todos los aspectos");
      return;
    }
    if (existingReview) {
      toast.error("Ya has dejado una valoración a este profesional");
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.Review.create({
        professional_id: professionalId,
        client_id: user.id,
        client_name: user.full_name || user.email?.split("@")[0] || "Cliente",
        rating: avgRating,
        rapidez: ratings.rapidez,
        comunicacion: ratings.comunicacion,
        calidad: ratings.calidad,
        precio_satisfaccion: ratings.precio_satisfaccion,
        comment: comment.trim(),
        is_verified: true,
        client_verified: false,
      });

      // Recalcular media (fire-and-forget)
      base44.functions.invoke('recalcProfessionalRating', {
        event: { type: 'create' },
        data: { professional_id: professionalId, rating: avgRating, client_name: user.full_name, comment }
      }).catch(() => {});

      setSubmitted(true);
    } catch (err) {
      toast.error("Error al enviar la valoración. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const StarInput = ({ field, label }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700 w-44 flex-shrink-0">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setRatings(r => ({ ...r, [field]: s }))}
            className="focus:outline-none"
          >
            <Star className={`w-7 h-7 transition-colors ${s <= ratings[field] ? "fill-amber-400 text-amber-400" : "text-gray-200 hover:text-amber-300"}`} />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Profesional no encontrado.</p>
          <Button onClick={() => navigate("/buscar")}>Volver a búsqueda</Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Gracias por tu valoración!</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Tu opinión ayuda a otros clientes a elegir mejor y al profesional a mejorar.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => navigate(`/autonomo/${profile.slug_publico || professionalId}`)} variant="outline" className="flex-1">
              Ver perfil
            </Button>
            <Button onClick={() => navigate("/buscar")} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Buscar más
            </Button>
          </div>
          {!user && (
            <p className="text-xs text-gray-500 mt-4">
              ¿Eres autónomo?{" "}
              <button onClick={() => navigate("/precios")} className="text-blue-600 underline">
                Regístrate gratis
              </button>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`Valorar a ${profile.business_name} - MisAutónomos`}
        description={`Deja tu valoración sobre ${profile.business_name}`}
        noindex
      />

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
          {/* Header del profesional */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <Avatar className="w-14 h-14 flex-shrink-0">
              {profile.imagen_principal ? (
                <AvatarImage src={profile.imagen_principal} alt={profile.business_name} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                  {profile.business_name?.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="font-bold text-gray-900 text-base">{profile.business_name}</h1>
              <p className="text-sm text-gray-500">{profile.categories?.[0]} · {profile.ciudad}</p>
            </div>
          </div>

          {existingReview ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">Ya has valorado a este profesional</p>
              <p className="text-sm text-gray-500 mt-1">Puedes editar tu valoración desde tu perfil</p>
              <Button onClick={() => navigate("/mi-perfil")} className="mt-4">Ver mis reseñas</Button>
            </div>
          ) : (
            <>
              <h2 className="font-bold text-gray-900 mb-5 text-lg">¿Cómo fue tu experiencia?</h2>

              <div className="space-y-4 mb-5">
                <StarInput field="rapidez" label="Rapidez" />
                <StarInput field="comunicacion" label="Comunicación" />
                <StarInput field="calidad" label="Calidad del trabajo" />
                <StarInput field="precio_satisfaccion" label="Precio / satisfacción" />
              </div>

              <div className="mb-5">
                <Textarea
                  placeholder="Cuéntanos tu experiencia (opcional)..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  maxLength={500}
                  className="h-24 resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/500</p>
              </div>

              {avgRating > 0 && (
                <div className="flex items-center gap-2 mb-5 text-sm text-gray-600">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= avgRating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                    ))}
                  </div>
                  <span>Nota media: <strong>{avgRating}/5</strong></span>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting || Object.values(ratings).some(r => r === 0)}
                className="w-full bg-amber-500 hover:bg-amber-600 h-12 font-semibold"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...</>
                ) : (
                  <><Star className="w-4 h-4 mr-2" /> Publicar valoración</>
                )}
              </Button>

              {!user && (
                <p className="text-xs text-center text-gray-400 mt-3">
                  Al enviar, serás redirigido al login para confirmar tu identidad.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}