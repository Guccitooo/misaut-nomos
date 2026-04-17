import { ONESIGNAL_APP_ID } from '../config/onesignal';

let initialized = false;

export const initOneSignal = () => {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  // No inicializar si no se ha configurado el App ID real
  if (!ONESIGNAL_APP_ID || ONESIGNAL_APP_ID === 'YOUR_ONESIGNAL_APP_ID') return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      safari_web_id: '',
      notifyButton: { enable: false },
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/' }
    });
  });
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