import { requireAdminUser } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import AdminHeader from "@/components/admin/admin-header";
import { getLogisticsMetrics, getTodayRoute, getSellerClients } from "@/lib/logistics";
import { getClients } from "@/lib/clients";
import { MapPin, CheckCircle, Clock, Route as RouteIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LogisticsPage() {
  const user = await requireAdminUser("/admin/logistica");
  
  // For now, use the logged-in user's email to find their profile
  // In a real implementation, you'd get the actual seller ID from the user profile
  const sellerId = user.id; // This should be the profile_id in production
  
  const [metrics, route, allClients] = await Promise.all([
    getLogisticsMetrics(sellerId),
    getTodayRoute(sellerId),
    getClients()
  ]);

  // Filter clients for the logged-in seller
  const sellerClients = allClients.filter(client => client.profile_id === sellerId);

  // Create a map of client IDs to client details
  const clientsMap = new Map(allClients.map(c => [c.id, c]));

  const today = new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="logistica" />
        <section className="min-w-0 flex-1 p-4 md:p-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-slate-600">
            <span>Início</span>
            <span className="mx-2">›</span>
            <span className="font-semibold text-brand-ink">Logística de Vendas</span>
            <span className="mx-2">›</span>
            <span className="font-semibold text-brand-ink">Roteiro do Dia</span>
          </nav>

          {/* Page Header */}
          <div className="mb-7">
            <p className="text-sm font-semibold text-brand-green">Logística</p>
            <h1 className="text-3xl font-bold text-brand-ink">Roteiro do Dia</h1>
            <p className="mt-1 text-slate-600">Gerencie suas visitas e acompanhe o roteiro de hoje.</p>
          </div>

          {/* Metrics Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600">Visitas do dia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-brand-ink">{metrics.total_visits}</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600">Realizadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{metrics.completed_visits}</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">{metrics.pending_visits}</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600">Check-ins</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-brand-blue">{metrics.checkins}</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600">Km percorridos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-brand-ink">{metrics.km_traveled} km</p>
              </CardContent>
            </Card>
          </div>

          {/* Route and Map Section */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Route List */}
            <div className="lg:col-span-2">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RouteIcon className="h-5 w-5" />
                    Roteiro de Visitas - {today}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {route && route.visits.length > 0 ? (
                    <div className="space-y-3">
                      {route.visits.map((visit, index) => {
                        const client = clientsMap.get(visit.client_id);
                        if (!client) return null;

                        const statusColor = visit.status === "completed" 
                          ? "bg-green-100 text-green-700" 
                          : visit.status === "next" 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-orange-100 text-orange-700";

                        const statusText = visit.status === "completed" 
                          ? "Realizado" 
                          : visit.status === "next" 
                            ? "Próxima" 
                            : "Pendente";

                        return (
                          <div key={visit.id} className="flex items-start gap-4 rounded-lg border p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold text-brand-ink">{client.corporate_name}</h3>
                                  <p className="text-sm text-slate-600">{client.address}, {client.neighborhood}</p>
                                  <p className="text-sm text-slate-500">{client.city} - {client.state}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-sm font-semibold text-brand-ink">{visit.scheduled_time}</span>
                                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor}`}>
                                    {statusText}
                                  </span>
                                  {visit.checkin_time && (
                                    <span className="flex items-center gap-1 text-xs text-green-600">
                                      <CheckCircle className="h-3 w-3" />
                                      Check-in feito
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-600">
                      <Clock className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                      <p>Nenhuma visita agendada para hoje.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Map Section */}
            <div className="lg:col-span-1">
              <Card className="shadow-soft h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Mapa do Roteiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-lg bg-slate-100 flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <MapPin className="mx-auto h-12 w-12 mb-2" />
                      <p className="text-sm">Mapa será exibido aqui</p>
                      <p className="text-xs text-slate-400 mt-1">Integração com mapa a ser implementada</p>
                    </div>
                  </div>
                  
                  {/* Map Legend */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span className="text-slate-600">Realizada</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                      <span className="text-slate-600">Pendente</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <span className="text-slate-600">Próxima</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Registered Clients Section */}
          <div className="mt-8">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Clientes Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                {sellerClients.length > 0 ? (
                  <div className="space-y-2">
                    {sellerClients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 transition-colors">
                        <div>
                          <h3 className="font-semibold text-brand-ink">{client.corporate_name}</h3>
                          <p className="text-sm text-slate-600">{client.city} - {client.state}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${client.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                          {client.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-slate-600">Nenhum cliente cadastrado para este vendedor.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}