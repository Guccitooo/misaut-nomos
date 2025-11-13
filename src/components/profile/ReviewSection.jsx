
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageSquare, Flag, Zap, MessageCircleIcon, Sparkles, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function ReviewSection({ reviews, professionalId, currentUser }) {
  const [reportingReview, setReportingReview] = useState(null);
  const queryClient = useQueryClient();

  console.log('🎯 ReviewSection recibió:', {
    reviews_count: reviews?.length || 0,
    reviews_data: reviews,
    professionalId,
    currentUser: currentUser?.email
  });

  // ✅ Calcular estadísticas detalladas
  const calculateDetailedStats = () => {
    if (!reviews || reviews.length === 0) {
      console.log('⚠️ No hay reviews para calcular stats');
      return {
        rapidez: 0,
        comunicacion: 0,
        calidad: 0,
        precio_satisfaccion: 0,
        total: 0
      };
    }

    const stats = reviews.reduce((acc, review) => {
      acc.rapidez += review.rapidez || 0;
      acc.comunicacion += review.comunicacion || 0;
      acc.calidad += review.calidad || 0;
      acc.precio_satisfaccion += review.precio_satisfaccion || 0;
      return acc;
    }, { rapidez: 0, comunicacion: 0, calidad: 0, precio_satisfaccion: 0 });

    const count = reviews.length;
    const calculatedStats = {
      rapidez: stats.rapidez / count,
      comunicacion: stats.comunicacion / count,
      calidad: stats.calidad / count,
      precio_satisfaccion: stats.precio_satisfaccion / count,
      total: (stats.rapidez + stats.comunicacion + stats.calidad + stats.precio_satisfaccion) / (count * 4)
    };

    console.log('📊 Stats calculadas:', calculatedStats);
    return calculatedStats;
  };

  const stats = calculateDetailedStats();

  const reportReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      await base44.entities.Review.update(reviewId, { is_reported: true });
      
      const review = reportingReview; // Access the review from component state
      if (!review) {
        console.error("Review data (reportingReview) not available for sending email to professional.");
        // Continue execution for admin email, as it doesn't strictly depend on all review details.
      }

      // Fetch professional user details using professionalId prop
      // This assumes base44.entities.User.get returns a single user object.
      const professionalDetails = await base44.entities.User.get(professionalId); 
      if (!professionalDetails || !professionalDetails.email) {
        console.error("Professional user details or email not found for ID:", professionalId);
        // Fallback or skip email if professional email is not found
        // We can still proceed with admin email.
      }

      // Existing email to professional (NOTE: subject says 'Nueva valoración' but this is 'report' mutation)
      if (review && professionalDetails && professionalDetails.email) {
        await base44.integrations.Core.SendEmail({
          to: professionalDetails.email,
          subject: "⭐ Nueva valoración en tu perfil - Misautónomos",
          body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 60px; height: 60px; background: white; border-radius: 16px; display: inline-block; line-height: 60px; font-size: 32px; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .rating-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .rating-box h3 { color: #92400e; margin: 0 0 15px 0; font-size: 18px; }
    .rating-box p { color: #78350f; margin: 5px 0; font-weight: 500; }
    .comment-box { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
    .comment-box p { color: #4b5563; margin: 0; font-style: italic; line-height: 1.6; }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; line-height: 1.8; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px; }
    .footer .tagline { color: #60a5fa; margin-bottom: 15px; font-style: italic; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⭐</div>
      <h1>Nueva valoración recibida</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola,</p>
      
      <p class="message">
        Has recibido una nueva valoración en tu perfil profesional de <strong>Misautónomos</strong>.
      </p>
      
      <div class="rating-box">
        <h3>📊 Valoraciones recibidas</h3>
        <p>👤 Cliente: ${review.client_name || 'Anónimo'}</p>
        <p>⚡ Rapidez: ${review.rapidez || 'N/A'} estrellas</p>
        <p>💬 Comunicación: ${review.comunicacion || 'N/A'} estrellas</p>
        <p>✨ Calidad: ${review.calidad || 'N/A'} estrellas</p>
        <p>💰 Precio/Satisfacción: ${review.precio_satisfaccion || 'N/A'} estrellas</p>
      </div>
      
      ${review.comment ? `
      <div class="comment-box">
        <p><strong>💭 Comentario del cliente:</strong></p>
        <p style="margin-top: 10px;">"${review.comment}"</p>
      </div>
      ` : ''}
      
      <p class="message">
        Las valoraciones positivas mejoran tu posicionamiento en las búsquedas y generan más confianza en los clientes.
      </p>
      
      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
        ¿Dudas? Contacta con nosotros:<br/>
        <a href="mailto:soporte@misautonomos.es" style="color: #3b82f6; text-decoration: none;">soporte@misautonomos.es</a>
      </p>
    </div>
    
    <div class="footer">
      <strong>Equipo Misautónomos</strong>
      <p class="tagline">Tu autónomo de confianza</p>
      <p>
        <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a><br/>
        <a href="https://misautonomos.es">misautonomos.es</a>
      </p>
    </div>
  </div>
</body>
</html>
        `,
          from_name: "Misautónomos"
        }).catch(err => console.log('Email to professional error:', err));
      }

      // NEW: Email to administrator about the reported review
      await base44.integrations.Core.SendEmail({
        to: "administrador@misautonomos.es",
        subject: "⚠️ Opinión reportada - Misautónomos",
        body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 60px; height: 60px; background: white; border-radius: 16px; display: inline-block; line-height: 60px; font-size: 32px; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .alert-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .alert-box p { color: #991b1b; margin: 5px 0; font-weight: 500; }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; line-height: 1.8; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚠️</div>
      <h1>Opinión reportada</h1>
    </div>
    
    <div class="content">
      <p class="message">
        Una opinión ha sido reportada por un usuario en la plataforma.
      </p>
      
      <div class="alert-box">
        <p><strong>Review ID:</strong> ${reviewId}</p>
        <p><strong>Reportado por:</strong> ${currentUser?.email || 'Usuario anónimo'}</p>
      </div>
      
      <p class="message">
        Por favor, revisa esta opinión en el dashboard de administración para determinar si contiene contenido inapropiado.
      </p>
    </div>
    
    <div class="footer">
      <strong>Sistema Misautónomos</strong>
      <p style="margin-top: 10px;">
        <a href="mailto:administrador@misautonomos.es">administrador@misautonomos.es</a>
      </p>
    </div>
  </div>
</body>
</html>
        `,
        from_name: "Misautónomos"
      }).catch(err => console.log('Email to administrator error:', err));
    },
    onSuccess: () => {
      setReportingReview(null);
      queryClient.invalidateQueries({ queryKey: ['reviews', professionalId] });
    }
  });

  // ✅ Componente de barra de progreso con icono
  const RatingBar = ({ label, value, icon: Icon, color }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-bold text-gray-900">{value.toFixed(1)}</span>
        </div>
      </div>
      <Progress value={(value / 5) * 100} className="h-2" />
    </div>
  );

  return (
    <>
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-700" />
            Opiniones ({reviews?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ✅ Resumen de valoraciones detalladas */}
          {reviews && reviews.length > 0 ? (
            <>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
                    <span className="text-4xl font-bold text-gray-900">
                      {stats.total.toFixed(1)}
                    </span>
                    <span className="text-2xl text-gray-500">/ 5</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Basado en {reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RatingBar
                    label="Rapidez"
                    value={stats.rapidez}
                    icon={Zap}
                    color="text-yellow-600"
                  />
                  <RatingBar
                    label="Comunicación"
                    value={stats.comunicacion}
                    icon={MessageCircleIcon}
                    color="text-blue-600"
                  />
                  <RatingBar
                    label="Calidad del trabajo"
                    value={stats.calidad}
                    icon={Sparkles}
                    color="text-purple-600"
                  />
                  <RatingBar
                    label="Precio / Satisfacción"
                    value={stats.precio_satisfaccion}
                    icon={DollarSign}
                    color="text-green-600"
                  />
                </div>
              </div>

              {/* Lista de opiniones */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-900">
                          {review.client_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{review.client_name}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(review.created_date), "d MMMM yyyy", { locale: es })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            {currentUser && review.client_id !== currentUser.id && !review.is_reported && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setReportingReview(review)}
                                title="Reportar opinión"
                              >
                                <Flag className="w-4 h-4 text-gray-400 hover:text-red-500" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* ✅ Valoraciones detalladas */}
                        {(review.rapidez || review.comunicacion || review.calidad || review.precio_satisfaccion) && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {review.rapidez && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Zap className="w-3 h-3 text-yellow-600" />
                                <span>Rapidez: {review.rapidez}/5</span>
                              </div>
                            )}
                            {review.comunicacion && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <MessageCircleIcon className="w-3 h-3 text-blue-600" />
                                <span>Comunicación: {review.comunicacion}/5</span>
                              </div>
                            )}
                            {review.calidad && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Sparkles className="w-3 h-3 text-purple-600" />
                                <span>Calidad: {review.calidad}/5</span>
                              </div>
                            )}
                            {review.precio_satisfaccion && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <DollarSign className="w-3 h-3 text-green-600" />
                                <span>Precio: {review.precio_satisfaccion}/5</span>
                              </div>
                            )}
                          </div>
                        )}

                        {review.comment && (
                          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                        )}
                        
                        <div className="flex gap-2 mt-2">
                          {review.is_verified && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              ✅ Opinión verificada
                            </Badge>
                          )}
                          {review.is_reported && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                              ⚠️ Reportada
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Sin opiniones por ahora</p>
              <p className="text-sm">Las valoraciones aparecerán aquí una vez los clientes dejen su opinión</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <AlertDialog open={!!reportingReview} onOpenChange={() => setReportingReview(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reportar esta opinión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta opinión será marcada para revisión por el equipo de administración. 
              Solo reporta opiniones que contengan contenido inapropiado, spam o información falsa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reportReviewMutation.mutate(reportingReview.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Reportar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
