import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageSquare, AlertCircle, Flag, CheckCircle2, XCircle, Zap, MessageCircleIcon, Sparkles, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

export default function ReviewSection({ reviews, professionalId, currentUser }) {
  const [reportingReview, setReportingReview] = useState(null);
  const queryClient = useQueryClient();

  // ✅ NUEVO: Calcular estadísticas de valoraciones detalladas
  const calculateDetailedStats = () => {
    if (!reviews || reviews.length === 0) {
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
    return {
      rapidez: stats.rapidez / count,
      comunicacion: stats.comunicacion / count,
      calidad: stats.calidad / count,
      precio_satisfaccion: stats.precio_satisfaccion / count,
      total: (stats.rapidez + stats.comunicacion + stats.calidad + stats.precio_satisfaccion) / (count * 4)
    };
  };

  const stats = calculateDetailedStats();

  const reportReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      await base44.entities.Review.update(reviewId, { is_reported: true });
      
      await base44.integrations.Core.SendEmail({
        to: "admin@milautonomos.com",
        subject: "⚠️ Opinión reportada - milautonomos",
        body: `Una opinión ha sido reportada por un usuario.

Review ID: ${reviewId}
Reportado por: ${currentUser.email}

Por favor, revisa esta opinión en el dashboard de administración.

Gracias,
Sistema milautonomos`,
        from_name: "milautonomos"
      });
    },
    onSuccess: () => {
      setReportingReview(null);
      queryClient.invalidateQueries({ queryKey: ['reviews', professionalId] });
    }
  });

  // ✅ NUEVO: Componente de barra de progreso con icono
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
            Opiniones ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ✅ NUEVO: Resumen de valoraciones detalladas */}
          {reviews.length > 0 && (
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
          )}

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

                    {/* ✅ NUEVO: Mostrar valoraciones detalladas */}
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

            {reviews.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Sin opiniones por ahora</p>
                <p className="text-sm">Las valoraciones aparecerán aquí una vez los clientes dejen su opinión</p>
              </div>
            )}
          </div>
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