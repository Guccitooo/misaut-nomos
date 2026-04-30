import React, { useState, useEffect, Suspense, lazy } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

import AdminLayout from "@/components/admin/AdminLayout";

const AdminBusinessDashboard = lazy(() => import("@/components/admin/AdminBusinessDashboard"));
const AdminUsersTable = lazy(() => import("@/components/admin/AdminUsersTable"));
const AdminPendingProfiles = lazy(() => import("@/components/admin/AdminPendingProfiles"));
const AdminSubscriptionsTable = lazy(() => import("@/components/admin/AdminSubscriptionsTable"));
const AdminMetrics = lazy(() => import("@/components/admin/AdminMetrics"));
const AdminSupportTickets = lazy(() => import("@/components/admin/AdminSupportTickets"));
const VerificationRequests = lazy(() => import("@/components/admin/VerificationRequests"));
const AdminPlanAuditLog = lazy(() => import("@/components/admin/AdminPlanAuditLog"));
const AdminAdsBriefings = lazy(() => import("@/components/admin/AdminAdsBriefings"));
const AdminReferralWidget = lazy(() => import("@/components/admin/AdminReferralWidget"));
const AdminEmailsPanel = lazy(() => import("@/components/admin/AdminEmailsPanel"));

const SectionLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
);

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role === "admin") setUser(u);
      setLoadingUser(false);
    }).catch(() => setLoadingUser(false));
  }, []);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['professionalProfiles'],
    queryFn: () => base44.entities.ProfessionalProfile.list(),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['allSubscriptions'],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.list();
      const userIds = new Set(users.map(u => u.id));
      return subs.filter(s => userIds.has(s.user_id));
    },
    enabled: users.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['allMessages'],
    queryFn: () => base44.entities.Message.list(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () => base44.entities.Review.list(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['allMetrics'],
    queryFn: async () => {
      const all = await base44.entities.ProfileMetrics.list();
      return all.filter(m => m.professional_id && m.professional_id !== "system");
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['allTickets'],
    queryFn: () => base44.entities.Ticket.list('-created_date'),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const { data: paymentRecords = [] } = useQuery({
    queryKey: ['allPaymentRecords'],
    queryFn: () => base44.entities.PaymentRecord.list(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const openTickets = tickets.filter(t => t.status === "abierto" || t.status === "en_progreso").length;
  const isLoading = loadingUsers || loadingProfiles || loadingSubscriptions;

  if (loadingUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">Acceso denegado — Solo administradores</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection} openTickets={openTickets}>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection} openTickets={openTickets}>
      <Suspense fallback={<SectionLoader />}>
      {activeSection === "dashboard" && (
        <>
          <AdminBusinessDashboard
            users={users}
            profiles={profiles}
            subscriptions={subscriptions}
            paymentRecords={paymentRecords}
          />
          <div className="mt-6">
            <AdminReferralWidget />
          </div>
        </>
      )}

      {activeSection === "users" && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">👥 Gestión de Usuarios</h2>
          <AdminUsersTable
            users={users}
            profiles={profiles}
            subscriptions={subscriptions}
            currentUser={user}
          />
        </div>
      )}

      {activeSection === "pending" && (
        <AdminPendingProfiles profiles={profiles} />
      )}

      {activeSection === "subscriptions" && (
        <AdminSubscriptionsTable subscriptions={subscriptions} users={users} />
      )}

      {activeSection === "metrics" && (
        <AdminMetrics metrics={metrics} profiles={profiles} messages={messages} />
      )}

      {activeSection === "support" && (
        <AdminSupportTickets tickets={tickets} />
      )}

      {activeSection === "verifications" && (
        <VerificationRequests />
      )}

      {activeSection === "audit" && (
        <AdminPlanAuditLog />
      )}

      {activeSection === "ads_briefings" && (
        <AdminAdsBriefings users={users} />
      )}

      {activeSection === "referrals" && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">🎁 Programa de referidos</h2>
          <AdminReferralWidget />
        </div>
      )}

      {activeSection === "emails" && (
        <AdminEmailsPanel />
      )}
      </Suspense>
    </AdminLayout>
  );
}