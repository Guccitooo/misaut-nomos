import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Check, AlertCircle } from 'lucide-react';

export default function NewsletterUnsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('loading');
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      if (!token) { setStatus('error'); return; }
      const found = await base44.entities.NewsletterSubscriber.filter({ unsubscribe_token: token });
      if (!found.length) { setStatus('error'); return; }
      await base44.entities.NewsletterSubscriber.update(found[0].id, {
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString()
      });
      setEmail(found[0].email);
      setStatus('success');
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            <span>Procesando...</span>
          </div>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Te has dado de baja</h1>
            <p className="text-sm text-gray-500">{email} ya no recibirá nuestra newsletter. Sentimos verte ir.</p>
            <Link to="/" className="inline-block mt-6 text-blue-600 text-sm hover:underline">← Volver a la web</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Enlace inválido</h1>
            <p className="text-sm text-gray-500">Este enlace ha caducado o no es válido.</p>
            <Link to="/" className="inline-block mt-6 text-blue-600 text-sm hover:underline">← Volver a la web</Link>
          </>
        )}
      </div>
    </div>
  );
}