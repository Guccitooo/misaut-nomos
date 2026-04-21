import { ONESIGNAL_APP_ID } from '../config/onesignal';

let initialized = false;

export const initOneSignal = () => {
  // El SDK ya se inicializa desde index.html — evitar doble init
  // Esta función se mantiene por compatibilidad pero no vuelve a llamar init
  if (initialized) return;
  if (typeof window === 'undefined') return;
  if (!ONESIGNAL_APP_ID || ONESIGNAL_APP_ID === 'YOUR_ONESIGNAL_APP_ID') return;
  initialized = true;
};

// Asociar el User logueado de la app con OneSignal
export const setUserId = (userId) => {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.login(userId);
  });
};

// Añadir tags para segmentación (ej: user_type, ciudad)
export const setUserTags = (tags) => {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.User.addTags(tags);
  });
};

// Solicitar permiso de notificaciones (llamar desde el banner)
export const requestPermission = () => {
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      const permission = await OneSignal.Notifications.requestPermission();
      resolve(permission);
    });
  });
};

// Comprobar si el usuario ya aceptó notificaciones push
export const isSubscribed = () => {
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      const isOptedIn = OneSignal.User.PushSubscription.optedIn;
      resolve(!!isOptedIn);
    });
  });
};

// Logout — desasociar user al cerrar sesión
export const onesignalLogout = () => {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.logout();
  });
};