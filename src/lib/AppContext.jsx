import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const [appData, setAppData] = useState({
    profile: null,
    subscription: null,
    isLoading: false,
    error: null
  });

  const loadAppData = useCallback(async () => {
    if (!user?.id) {
      setAppData({ profile: null, subscription: null, isLoading: false, error: null });
      return;
    }

    setAppData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Cargar perfil y suscripción en paralelo
      const [profiles, subscriptions] = await Promise.all([
        base44.entities.ProfessionalProfile.filter({ user_id: user.id }).limit(1),
        base44.entities.Subscription.filter({ user_id: user.id, estado: 'activo' }).limit(1)
      ]);

      setAppData({
        profile: profiles[0] || null,
        subscription: subscriptions[0] || null,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading app data:', error);
      setAppData(prev => ({ ...prev, isLoading: false, error: error.message }));
    }
  }, [user?.id]);

  // Cargar datos cuando cambia el usuario
  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  return (
    <AppContext.Provider value={{ ...appData, user, refetch: loadAppData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppData must be used within AppProvider');
  }
  return context;
};