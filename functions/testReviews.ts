import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Función para probar el sistema de reseñas
 * Verifica:
 * 1. Crear reseña de prueba
 * 2. Calcular promedio
 * 3. Actualizar perfil
 * 4. Verificar restricción de duplicados
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar autenticación de admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ 
                error: 'No autorizado. Solo administradores pueden ejecutar esta función.' 
            }, { status: 403 });
        }
        
        const { professional_id, client_id, test_type } = await req.json();
        
        console.log('🧪 Test de reseñas:', test_type);
        
        // ✅ TEST 1: Verificar si ya existe reseña
        if (test_type === 'check_existing') {
            const existing = await base44.asServiceRole.entities.Review.filter({
                professional_id,
                client_id
            });
            
            return Response.json({
                exists: existing.length > 0,
                review: existing[0] || null,
                message: existing.length > 0 
                    ? '⚠️ Ya existe una reseña de este cliente'
                    : '✅ No hay reseña previa, puede crear una'
            });
        }
        
        // ✅ TEST 2: Crear reseña de prueba
        if (test_type === 'create_test') {
            // Verificar duplicado
            const existing = await base44.asServiceRole.entities.Review.filter({
                professional_id,
                client_id
            });
            
            if (existing.length > 0) {
                return Response.json({
                    success: false,
                    error: 'Ya existe una reseña de este usuario'
                }, { status: 400 });
            }
            
            // Crear reseña de prueba
            const review = await base44.asServiceRole.entities.Review.create({
                professional_id,
                client_id,
                client_name: 'Usuario de Prueba',
                rapidez: 5,
                comunicacion: 4,
                calidad: 5,
                precio_satisfaccion: 4,
                rating: 4.5, // (5+4+5+4)/4
                comment: 'Excelente servicio de prueba',
                is_verified: true,
                is_reported: false
            });
            
            console.log('✅ Reseña creada:', review.id);
            
            // Actualizar promedio del perfil
            const allReviews = await base44.asServiceRole.entities.Review.filter({
                professional_id
            });
            
            const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
            
            const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                user_id: professional_id
            });
            
            if (profiles[0]) {
                await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                    average_rating: avgRating,
                    total_reviews: allReviews.length
                });
                
                console.log(`✅ Perfil actualizado: ${avgRating.toFixed(1)} estrellas (${allReviews.length} reseñas)`);
            }
            
            return Response.json({
                success: true,
                review,
                stats: {
                    average_rating: avgRating.toFixed(1),
                    total_reviews: allReviews.length
                }
            });
        }
        
        // ✅ TEST 3: Listar todas las reseñas de un profesional
        if (test_type === 'list_reviews') {
            const reviews = await base44.asServiceRole.entities.Review.filter({
                professional_id
            }, '-created_date', 100);
            
            const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                user_id: professional_id
            });
            
            return Response.json({
                professional: profiles[0]?.business_name || 'Desconocido',
                total_reviews: reviews.length,
                average_rating: profiles[0]?.average_rating || 0,
                reviews: reviews.map(r => ({
                    id: r.id,
                    client_name: r.client_name,
                    rating: r.rating,
                    rapidez: r.rapidez,
                    comunicacion: r.comunicacion,
                    calidad: r.calidad,
                    precio: r.precio_satisfaccion,
                    comment: r.comment,
                    created_date: r.created_date
                }))
            });
        }
        
        // ✅ TEST 4: Calcular estadísticas detalladas
        if (test_type === 'calculate_stats') {
            const reviews = await base44.asServiceRole.entities.Review.filter({
                professional_id
            });
            
            if (reviews.length === 0) {
                return Response.json({
                    message: 'No hay reseñas para este profesional',
                    stats: null
                });
            }
            
            const stats = reviews.reduce((acc, review) => {
                acc.rapidez += review.rapidez || 0;
                acc.comunicacion += review.comunicacion || 0;
                acc.calidad += review.calidad || 0;
                acc.precio += review.precio_satisfaccion || 0;
                acc.total += review.rating || 0;
                return acc;
            }, { rapidez: 0, comunicacion: 0, calidad: 0, precio: 0, total: 0 });
            
            const count = reviews.length;
            
            return Response.json({
                total_reviews: count,
                stats: {
                    rapidez: (stats.rapidez / count).toFixed(1),
                    comunicacion: (stats.comunicacion / count).toFixed(1),
                    calidad: (stats.calidad / count).toFixed(1),
                    precio: (stats.precio / count).toFixed(1),
                    promedio_general: (stats.total / count).toFixed(1)
                }
            });
        }
        
        return Response.json({
            error: 'test_type no válido. Usa: check_existing, create_test, list_reviews, calculate_stats'
        }, { status: 400 });
        
    } catch (error) {
        console.error('❌ Error en test de reseñas:', error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});