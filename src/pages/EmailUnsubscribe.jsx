import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function EmailUnsubscribe() {
  const [status, setStatus] = useState('loading'); // loading | success | error | already
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Enlace de baja inválido o caducado.');
      return;
    }

    (async () => {
      try {
        const { NewsletterSubscriber } = base44.entities;
        let results = [];
        try {
          results = await NewsletterSubscriber.filter({ unsubscribe_token: token });
          if (!Array.isArray(results)) results = [];
        } catch (err) {
          console.warn('[Unsubscribe] Filter error:', err);
          results = [];
        }

        if (results.length === 0) {
          setStatus('error');
          setMessage('No encontramos una suscripción con ese enlace.');
          return;
        }

        const subscriber = results[0];
        if (subscriber.status === 'unsubscribed') {
          setStatus('already');
          return;
        }

        await NewsletterSubscriber.update(subscriber.id, {
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString()
        });

        setStatus('success');
      } catch (err) {
        console.error('[Unsubscribe] Error:', err);
        setStatus('error');
        setMessage('Ocurrió un error. Inténtalo de nuevo o contáctanos.');
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-10 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Procesando tu baja...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Te has dado de baja</h1>
            <p className="text-gray-600 mb-2">
              Has sido eliminado de nuestra newsletter correctamente. No recibirás más emails de nuestra parte.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Puedes volver a suscribirte cuando quieras desde el footer de la web.
            </p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Volver al inicio
            </Link>
          </>
        )}

        {status === 'already' && (
          <>
            <CheckCircle className="w-14 h-14 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Ya estabas dado de baja</h1>
            <p className="text-gray-600 mb-8">
              Tu email ya estaba marcado como no suscrito. No recibes emails de nuestra newsletter.
            </p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Volver al inicio
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Error</h1>
            <p className="text-gray-600 mb-8">{message || 'Algo salió mal. Por favor inténtalo de nuevo.'}</p>
            <a
              href="mailto:hola@misautonomos.com"
              className="inline-block bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Contactar soporte
            </a>
          </>
        )}
      </div>
    </div>
  );
}