import Link from "next/link";
import { Search, CheckCircle, Clock, XCircle } from "lucide-react";
import { requireAdminUser, getCurrentUserProfile } from "@/auth";
import { getPaginatedPayables, type Payable } from "@/lib/payables";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { buildHref, parsePageParam } from "@/lib/pagination";
import { formatCurrency, formatDate } from "@/lib/format";
import { MarkAsPaidButton } from "@/components/admin/mark-as-paid-button";
import { DeletePayableButton } from "@/components/admin/delete-payable-button";

const pageSize = 10;

type AdminPayablesPageProps = {
  searchParams?: Promise<{
    busca?: string;
    page?: string;
    status?: string;
  }>;
};

export default async function AdminPayablesPage({ searchParams }: AdminPayablesPageProps) {
  const user = await requireAdminUser();
  const userProfile = await getCurrentUserProfile();
  const params = await searchParams;
  const search = params?.busca?.trim();
  const page = parsePageParam(params?.page);
  const status = params?.status;
  const hrefFor = (target: number) => buildHref("/admin/contas-pagar", { busca: search, status }, target);

  // Filter by user's unit if user has a unit_id
  const unitId = userProfile?.unit_id || undefined;

  const { payables, total, totalPages } = await getPaginatedPayables({ 
    page, 
    pageSize, 
    status: status as 'pending' | 'paid' | 'overdue' | 'cancelled' | undefined, 
    search,
    unitId 
  });

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    overdue: 'Atrasado',
    cancelled: 'Cancelado'
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4" />,
    paid: <CheckCircle className="h-4 w-4" />,
    overdue: <XCircle className="h-4 w-4" />,
    cancelled: <XCircle className="h-4 w-4" />
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="contas-pagar" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Contas a Pagar</h1>
              <p className="mt-1 text-slate-600">Listagem de contas a pagar{unitId ? ` da unidade` : ''}</p>
            </div>
            <Button asChild>
              <Link href="/admin/contas-pagar/novo">+ Nova conta</Link>
            </Button>
          </div>

          <form className="mb-4 flex gap-3" action="/admin/contas-pagar">
            <div className="flex-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input name="busca" defaultValue={search ?? ""} placeholder="Buscar conta..." className="pl-10" />
              </div>
            </div>
            <select name="status" defaultValue={status ?? ""} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Atrasado</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <Button type="submit">Pesquisar</Button>
          </form>

          <Card>
            <CardContent className="p-0">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-sm text-slate-600">
                    <th className="w-[8%] p-4 whitespace-nowrap">ID</th>
                    <th className="w-[18%] p-4 whitespace-nowrap">Fornecedor</th>
                    <th className="w-[14%] p-4 whitespace-nowrap">CNPJ</th>
                    <th className="w-[16%] p-4 whitespace-nowrap">Descrição</th>
                    <th className="w-[10%] p-4 whitespace-nowrap">Vencimento</th>
                    <th className="w-[10%] p-4 whitespace-nowrap">Pagamento</th>
                    <th className="w-[10%] p-4 whitespace-nowrap">Status</th>
                    <th className="w-[10%] p-4 whitespace-nowrap">Valor</th>
                    <th className="w-[8%] p-4 text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {payables.map((payable: Payable) => (
                    <tr key={payable.id} className="border-t">
                      <td className="p-4 whitespace-nowrap">
                        #{payable.id}
                      </td>
                      <td className="p-4 overflow-hidden">
                        <div
                          className="truncate whitespace-nowrap overflow-hidden cursor-help"
                          title={payable.supplier_name}
                        >
                          {payable.supplier_name}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {payable.supplier_cnpj || '-'}
                      </td>
                      <td className="p-4 overflow-hidden">
                        <div
                          className="truncate whitespace-nowrap overflow-hidden cursor-help"
                          title={payable.description}
                        >
                          {payable.description}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {formatDate(payable.due_date)}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {payable.payment_date ? formatDate(payable.payment_date) : '-'}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${statusColors[payable.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusIcons[payable.status]}
                          {statusLabels[payable.status] || payable.status}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap font-medium">
                        {formatCurrency(payable.amount)}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/contas-pagar/${payable.id}/edit`}
                          className="mr-3 text-slate-600 hover:text-brand-ink"
                        >
                          ✏️
                        </Link>
                        {payable.status === 'pending' && (
                          <span className="mr-3">
                            <MarkAsPaidButton type="payable" id={payable.id} />
                          </span>
                        )}
                        <DeletePayableButton payableId={payable.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {total > 0 ? (
            <AdminPagination
              className="mt-4 flex items-center justify-between"
              page={page}
              totalPages={totalPages}
              hrefFor={hrefFor}
              label={<div className="text-sm text-slate-600">Mostrando {payables.length} de {total} contas</div>}
            />
          ) : (
            <div className="mt-4 text-center text-slate-600">
              Nenhuma conta a pagar encontrada.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
