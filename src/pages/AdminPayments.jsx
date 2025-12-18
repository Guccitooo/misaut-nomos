import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Search, 
  RefreshCw,
  TrendingUp,
  DollarSign,
  Users,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminPaymentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser || currentUser.role !== 'admin') {
        navigate(createPageUrl("Search"));
        return;
      }
      setUser(currentUser);
    } catch (error) {
      navigate(createPageUrl("Search"));
    }
  };

  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ['adminPayments'],
    queryFn: async () => {
      const allPayments = await base44.entities.PaymentRecord.list('-payment_date', 200);
      return allPayments;
    },
    enabled: !!user,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: () => base44.entities.ProfessionalProfile.list(),
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const activateProfileMutation = useMutation({
    mutationFn: async (userEmail) => {
      const response = await base44.functions.invoke('forceActivateProfile', { user_email: userEmail });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      toast.success(`🔥 Perfil activado: ${data.payments_count} pagos confirmados (${data.total_paid.toFixed(2)}€)`);
    },
    onError: (error) => {
      toast.error("Error: " + (error.response?.data?.error || error.message));
    }
  });

  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      payment.user_email?.toLowerCase().includes(search) ||
      payment.plan_nombre?.toLowerCase().includes(search) ||
      payment.stripe_invoice_id?.toLowerCase().includes(search)
    );
  });

  const stats = React.useMemo(() => {
    const totalRevenue = payments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const uniquePayingUsers = new Set(
      payments.filter(p => p.status === 'succeeded').map(p => p.user_id)
    ).size;

    const visibleProfiles = profiles.filter(p => p.visible_en_busqueda === true).length;

    return { totalRevenue, uniquePayingUsers, visibleProfiles };
  }, [payments, profiles]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💰 Pagos Recibidos</h1>
            <p className="text-gray-600">Registro completo de todos los pagos de Stripe</p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Ingresos totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalRevenue.toFixed(2)} €
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Clientes de pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {stats.uniquePayingUsers}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Perfiles visibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-indigo-600">
                {stats.visibleProfiles}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {payments.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por email, plan, ID de factura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Fecha</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Usuario</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Plan</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Importe</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Estado</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Período</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Perfil</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => {
                      const profile = profiles.find(p => p.user_id === payment.user_id);
                      const userInfo = allUsers.find(u => u.id === payment.user_id);
                      
                      return (
                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-sm">
                            {format(new Date(payment.payment_date), "dd/MM/yyyy HH:mm")}
                          </td>
                          <td className="p-3 text-sm">
                            <div>
                              <p className="font-medium text-gray-900">{payment.user_email}</p>
                              <p className="text-xs text-gray-500">{userInfo?.full_name || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="p-3 text-sm">
                            <div>
                              <p className="font-medium">{payment.plan_nombre}</p>
                              {payment.is_trial && (
                                <Badge variant="outline" className="text-xs mt-1">Trial</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-sm font-semibold text-green-600">
                            {payment.amount?.toFixed(2)} €
                          </td>
                          <td className="p-3">
                            {payment.status === 'succeeded' ? (
                              <Badge className="bg-green-100 text-green-800 gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Exitoso
                              </Badge>
                            ) : payment.status === 'failed' ? (
                              <Badge className="bg-red-100 text-red-800 gap-1">
                                <XCircle className="w-3 h-3" />
                                Fallido
                              </Badge>
                            ) : (
                              <Badge variant="outline">{payment.status}</Badge>
                            )}
                          </td>
                          <td className="p-3 text-xs text-gray-600">
                            {format(new Date(payment.period_start), "dd/MM/yy")} - 
                            {format(new Date(payment.period_end), "dd/MM/yy")}
                          </td>
                          <td className="p-3">
                            {profile ? (
                              <Badge className={profile.visible_en_busqueda 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                              }>
                                {profile.visible_en_busqueda ? "✅ Visible" : "❌ Oculto"}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Sin perfil</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            {profile && !profile.visible_en_busqueda && payment.status === 'succeeded' && (
                              <Button
                                size="sm"
                                onClick={() => activateProfileMutation.mutate(payment.user_email)}
                                disabled={activateProfileMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-xs"
                              >
                                {activateProfileMutation.isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>🔥 Activar</>
                                )}
                              </Button>
                            )}
                            {!profile && payment.status === 'succeeded' && (
                              <span className="text-xs text-orange-600">⚠️ Sin perfil</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}