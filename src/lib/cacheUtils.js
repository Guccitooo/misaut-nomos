import { base44 } from '@/api/base44Client';

// Cachear datos en sessionStorage con TTL
export const getFromCache = (key, ttlMs = 300000) => {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > ttlMs) {
      sessionStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
};

export const setInCache = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
};

export const clearCache = (key) => {
  sessionStorage.removeItem(key);
};

// Service Categories (estáticas, no fetchear)
export const SERVICE_CATEGORIES = [
  { id: '1', name: 'Fontanería', icon: '🔧' },
  { id: '2', name: 'Electricidad', icon: '⚡' },
  { id: '3', name: 'Carpintería', icon: '🪑' },
  { id: '4', name: 'Limpieza', icon: '🧹' },
  { id: '5', name: 'Jardinería', icon: '🌿' },
  { id: '6', name: 'Reparación de móviles', icon: '📱' },
  { id: '7', name: 'Tutoría', icon: '📚' },
  { id: '8', name: 'Diseño gráfico', icon: '🎨' },
  { id: '9', name: 'Desarrollo web', icon: '💻' },
  { id: '10', name: 'Consultoría', icon: '💼' },
  { id: '11', name: 'Marketing digital', icon: '📊' },
  { id: '12', name: 'Otro tipo de servicio profesional', icon: '⭐' }
];

// Subscription Plans (hardcodeados)
export const SUBSCRIPTION_PLANS = {
  plan_visibility: {
    plan_id: 'plan_visibility',
    nombre: 'Plan Visibilidad',
    precio: 13,
    duracion_dias: 30,
    renovacion_automatica: true,
    descripcion: 'Aumenta tu visibilidad en búsquedas',
    stripe_price_id: 'price_visibility',
    incluye_ads: false,
    features: [
      'Perfil destacado',
      'Hasta 3 fotos',
      'Chat directo'
    ]
  },
  plan_adsplus: {
    plan_id: 'plan_adsplus',
    nombre: 'Plan Ads+',
    precio: 33,
    duracion_dias: 30,
    renovacion_automatica: true,
    descripcion: 'Gestión de campañas en redes sociales',
    stripe_price_id: 'price_adsplus',
    incluye_ads: true,
    ads_platforms: ['Instagram', 'Facebook', 'TikTok'],
    features: [
      'Perfil destacado',
      'Hasta 10 fotos',
      'Chat directo',
      'Gestor de campañas ads',
      'Soporte prioritario'
    ]
  }
};

// Cargar profesionales con caché
export const loadProfessionalsWithCache = async (filters, useCache = true) => {
  const cacheKey = `professionals_${JSON.stringify(filters)}`;
  
  if (useCache) {
    const cached = getFromCache(cacheKey, 300000); // 5 min
    if (cached) return cached;
  }
  
  try {
    const result = await base44.entities.ProfessionalProfile.filter(filters);
    setInCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error loading professionals:', error);
    return [];
  }
};