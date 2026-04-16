import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageSquare, Flag } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/components/ui/LanguageSwitcher";

export default function ReviewSection({ reviews, professionalId, currentUser }) {
  const [reportingReviewId, setReportingReviewId] = useState(null);
  const queryClient = useQueryClient();
  const { t } = useLanguage();



  const calculateDetailedStats = () => {
    if (!reviews || reviews.length === 0) {
      return {
        overallAverageRating: 0,
        avgRapidez: 0,
        avgComunicacion: 0,
        avgCalidad: 0,
        avgPrecio: 0
      };
    }

    let totalRating = 0;
    const stats = reviews.reduce((acc, review) => {
      totalRating += review.rating || 0;
      acc.rapidez += review.rapidez || 0;
      acc.comunicacion += review.comunicacion || 0;
      acc.calidad += review.calidad || 0;
      acc.precio_satisfaccion += review.precio_satisfaccion || 0;
      return acc;
    }, { rapidez: 0, comunicacion: 0, calidad: 0, precio_satisfaccion: 0 });

    const count = reviews.length;
    const calculatedStats = {
      overallAverageRating: totalRating / count,
      avgRapidez: stats.rapidez / count,
      avgComunicacion: stats.comunicacion / count,
      avgCalidad: stats.calidad / count,
      avgPrecio: stats.precio_satisfaccion / count,
    };

    return calculatedStats;
  };

  const { overallAverageRating, avgRapidez, avgComunicacion, avgCalidad, avgPrecio } = calculateDetailedStats();

  const reportReviewMutation = useMutation({
    mutationFn: async (reviewIdToReport) => {
      await base44.entities.Review.update(reviewIdToReport, { is_reported: true });
      
      await base44.integrations.Core.SendEmail({
        to: "administrador@misautonomos.es",
        subject: "⚠️ Opinión reportada - MisAutónomos",
        body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 80px; height: 80px; margin: 0 auto 20px; background: white; border-radius: 16px; padding: 12px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .alert-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .alert-box p { color: #991b1b; margin: 5px 0; font-weight: 500; }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; line-height: 1.8; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px; }
    .footer .tagline { color: #60a5fa; margin-bottom: 15px; font-style: italic; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png" alt="MisAutónomos" class="logo" />
      <h1>Opinión reportada</h1>
    </div>
    
    <div class="content">
      <p class="message">
        Una opinión ha sido reportada por un usuario en la plataforma.
      </p>
      
      <div class="alert-box">
        <p><strong>Review ID:</strong> ${reviewIdToReport}</p>
        <p><strong>Reportado por:</strong> ${currentUser?.email || 'Usuario anónimo'}</p>
      </div>
      
      <p class="message">
        Por favor, revisa esta opinión en el dashboard de administración para determinar si contiene contenido inapropiado.
      </p>
    </div>
    
    <div class="footer">
      <strong>MisAutónomos</strong>
      <p class="tagline">Tu autónomo de confianza</p>
      <p>
        <a href="mailto:administrador@misautonomos.es">administrador@misautonomos.es</a><br/>
        <a href="https://misautonomos.es">misautonomos.es</a>
      </p>
    </div>
  </div>
</body>
</html>
        `,
        from_name: "MisAutónomos"
      }).catch(err => console.log('Email to administrator error:', err));
    },
    onSuccess: () => {
      setReportingReviewId(null);
      queryClient.invalidateQueries({ queryKey: ['reviews', professionalId] });
    }
  });

  return (
    <>
      <div className="bg-white space-y-6">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span className="font-semibold text-gray-900">{t('reviewsTitle')} ({reviews?.length || 0})</span>
        </div>
        <div className="space-y-6">
          {reviews && reviews.length > 0 ? (
            <>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100" role="region" aria-label="Resumen de valoraciones">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-4xl font-bold text-gray-900" aria-label={`Valoración media: ${overallAverageRating.toFixed(1)} de 5`}>
                      {overallAverageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-1 mt-1" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= overallAverageRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {reviews.length} {reviews.length === 1 ? t('review') : t('reviews')}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{t('speed')}</span>
                      <span className="text-sm font-semibold text-gray-900">{avgRapidez.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={avgRapidez} aria-valuemin={0} aria-valuemax={5} aria-label={`${t('speed')}: ${avgRapidez.toFixed(1)} de 5`}>
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                        style={{ width: `${(avgRapidez / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{t('communication')}</span>
                      <span className="text-sm font-semibold text-gray-900">{avgComunicacion.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={avgComunicacion} aria-valuemin={0} aria-valuemax={5} aria-label={`${t('communication')}: ${avgComunicacion.toFixed(1)} de 5`}>
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                        style={{ width: `${(avgComunicacion / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{t('quality')}</span>
                      <span className="text-sm font-semibold text-gray-900">{avgCalidad.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={avgCalidad} aria-valuemin={0} aria-valuemax={5} aria-label={`${t('quality')}: ${avgCalidad.toFixed(1)} de 5`}>
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                        style={{ width: `${(avgCalidad / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{t('priceSatisfaction')}</span>
                      <span className="text-sm font-semibold text-gray-900">{avgPrecio.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={avgPrecio} aria-valuemin={0} aria-valuemax={5} aria-label={`${t('priceSatisfaction')}: ${avgPrecio.toFixed(1)} de 5`}>
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all"
                        style={{ width: `${(avgPrecio / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4" role="list" aria-label="Lista de opiniones">
                {reviews.map((review) => (
                  <article key={review.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200" role="listitem">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-600 text-white text-sm">
                            {review.client_name?.charAt(0).toUpperCase() || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{review.client_name}</p>
                          <div className="flex items-center gap-1">
                            <div aria-label={`${review.rating} de 5 estrellas`}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 inline ${
                                    star <= review.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-gray-300"
                                  }`}
                                  aria-hidden="true"
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500 ml-1">
                              <time dateTime={review.created_date}>
                                {format(new Date(review.created_date), "d MMMM yyyy", { locale: es })}
                              </time>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {review.is_verified && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {t('verified')}
                        </Badge>
                      )}
                    </div>

                    {review.comment && (
                      <p className="text-sm text-gray-700 mt-3 leading-relaxed">{review.comment}</p>
                    )}
                    
                    <div className="flex gap-2 mt-2">
                      {review.is_reported && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          ⚠️ {t('inappropriate')}
                        </Badge>
                      )}
                      {currentUser && review.client_id !== currentUser.id && !review.is_reported && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-auto"
                          onClick={() => setReportingReviewId(review.id)}
                          title={t('reportReview')}
                          aria-label={t('reportReview')}
                        >
                          <Flag className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noReviewsYet')}</h3>
              <p className="text-gray-600">{t('beFirstReview')}</p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!reportingReviewId} onOpenChange={() => setReportingReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('reportReview')}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t('reportReviewDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reportReviewMutation.mutate(reportingReviewId)}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('reportReview')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}