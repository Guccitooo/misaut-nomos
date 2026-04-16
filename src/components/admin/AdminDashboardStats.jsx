import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, CreditCard, MessageSquare, Star, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { subWeeks, startOfWeek, isAfter, isBefore, startOfMonth, isThisMonth, isThisWeek, format } from "date-fns";
import { es } from "date-fns/locale";

function StatCard({ icon: Icon, label, value, sub, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    gray: "bg-gray-50 text-gray-600",
  };
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardStats({ users, profiles, subscriptions, messages, reviews }) {
  const now = new Date();

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const usersThisWeek = users.filter(u => isThisWeek(new Date(u.created_date))).length;
    const usersThisMonth = users.filter(u => isThisMonth(new Date(u.created_date))).length;
    const activeProfiles = profiles.filter(p => p.visible_en_busqueda === true).length;
    const pendingProfiles = profiles.filter(p => p.estado_perfil === "pendiente").length;
    const activeSubs = subscriptions.filter(s => s.estado === "activo").length;
    const trialSubs = subscriptions.filter(s => s.estado === "en_prueba").length;
    const expiredThisMonth = subscriptions.filter(s => {
      if (s.estado !== "expirado" && s.estado !== "cancelado") return false;
      try { return isThisMonth(new Date(s.fecha_expiracion)); } catch { return false; }
    }).length;
    const totalMessages = messages.length;
    const totalReviews = reviews.length;

    return { totalUsers, usersThisWeek, usersThisMonth, activeProfiles, pendingProfiles, activeSubs, trialSubs, expiredThisMonth, totalMessages, totalReviews };
  }, [users, profiles, subscriptions, messages, reviews]);

  // Weekly registrations chart (last 8 weeks)
  const weeklyData = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(now, 7 - i), { weekStartsOn: 1 });
      const weekEnd = startOfWeek(subWeeks(now, 6 - i), { weekStartsOn: 1 });
      const count = users.filter(u => {
        const d = new Date(u.created_date);
        return !isBefore(d, weekStart) && isBefore(d, weekEnd);
      }).length;
      return { week: format(weekStart, "d MMM", { locale: es }), usuarios: count };
    });
  }, [users]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Resumen General</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total usuarios" value={stats.totalUsers} sub={`+${stats.usersThisWeek} esta semana · +${stats.usersThisMonth} este mes`} color="blue" />
          <StatCard icon={Briefcase} label="Profesionales activos" value={stats.activeProfiles} sub={`${stats.pendingProfiles} pendientes de aprobar`} color="green" />
          <StatCard icon={CreditCard} label="Suscripciones activas" value={stats.activeSubs} sub={`${stats.trialSubs} en prueba`} color="purple" />
          <StatCard icon={TrendingUp} label="Expiradas este mes" value={stats.expiredThisMonth} color="orange" />
          <StatCard icon={MessageSquare} label="Mensajes totales" value={stats.totalMessages} color="blue" />
          <StatCard icon={Star} label="Reseñas totales" value={stats.totalReviews} color="orange" />
          <StatCard icon={Users} label="Sin user_type" value={users.filter(u => !u.user_type).length} sub="Usuarios sin clasificar" color="gray" />
          <StatCard icon={CreditCard} label="Sin suscripción" value={users.filter(u => !subscriptions.find(s => s.user_id === u.id)).length} color="gray" />
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-700">Nuevos registros — últimas 8 semanas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="usuarios" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}