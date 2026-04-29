import React from 'react';
import AdminEmailsPanel from '@/components/admin/AdminEmailsPanel';

export default function AdminEmailsPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">📧 Centro de Emails</h1>
      <p className="text-gray-600 mb-8">Gestiona templates, registros y pruebas de emails transaccionales y marketing.</p>
      <AdminEmailsPanel />
    </div>
  );
}