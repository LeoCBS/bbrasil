import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdminUser, getCurrentUserProfile } from "@/auth";
import { getPaginatedQuotations, type Quotation } from "@/lib/quotations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { buildHref, parsePageParam } from "@/lib/pagination";
import { formatCurrency } from "@/lib/format";
import { DeleteQuotationButton } from "@/components/admin/delete-quotation-button";
import { ConvertQuotationButton } from "@/components/admin/convert-quotation-button";

const pageSize = 10;

type AdminQuotationsPageProps = {
  searchParams?: Promise<{
    busca?: string;
    page?: string;
    status?: string;
  }>;
};

export default async function AdminQuotationsPage({ searchParams }: AdminQuotationsPageProps) {
  const user = await requireAdminUser();
  const userProfile = await getCurrentUserProfile();
  const params = await searchParams;
  const search = params?.busca?.trim();
  const page = parsePageParam(params?.page);
  const status = params?.status;
  const hrefFor = (target: number) => buildHref("/admin/orcamentos", { busca: search, status }, target);

  // Filter by user's unit if user has a unit_id
  const unitId = userProfile?.unit_id || undefined;

  const { quotations, total, totalPages } = await getPaginatedQuotations({ 
    page, 
    pageSize, 
    status: status as 'pending' | 'approved' | 'rejected' | 'converted' | undefined, 
    search,
    unitId 
  });

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    converted: 'Convertido'
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    converted: 'bg-blue-100 text-blue-800'
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="orcamentos" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Orçamentos</h1>
              <p className="mt-1 text-slate-600">Listagem de orçamentos{unitId ? ` da unidade` : ''}</p>
            </div>
            <Button asChild>
              <Link href="/admin/orcamentos/novo">+ Novo orçamento</Link>
            </Button>
          </div>

          <form className="mb-4 flex gap-3" action="/admin/orcamentos">
            <div className="flex-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input name="busca" defaultValue={search ?? ""} placeholder="Buscar orçamento..." className="pl-10" />
              </div>
            </div>
            <select name="status" defaultValue={status ?? ""} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
              <option value="converted">Convertido</option>
            </select>
            <Button type="submit">Pesquisar</Button>
          </form>

          <Card>
            <CardContent className="p-0">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-sm text-slate-600">
                    <th className="w-[7%] p-4 whitespace-nowrap">ID</th>
                    <th className="w-[17%] p-4 whitespace-nowrap">Cliente</th>
                    <th className="w-[13%] p-4 whitespace-nowrap">CNPJ</th>
                    <th className="w-[13%] p-4 whitespace-nowrap">Vendedor</th>
                    <th className="w-[11%] p-4 whitespace-nowrap">Unidade</th>
                    <th className="w-[10%] p-4 whitespace-nowrap">Status</th>
                    <th className="w-[9%] p-4 whitespace-nowrap">Total</th>
                    <th className="w-[8%] p-4 whitespace-nowrap">Pedido</th>
                    <th className="w-[12%] p-4 text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((quotation: Quotation) => (
                    <tr key={quotation.id} className="border-t">
                      <td className="p-4 whitespace-nowrap">
                        #{quotation.id}
                      </td>
                      <td className="p-4 overflow-hidden">
                        <div
                          className="truncate whitespace-nowrap overflow-hidden cursor-help"
                          title={quotation.client_name}
                        >
                          {quotation.client_name}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {quotation.client_cnpj}
                      </td>
                      <td className="p-4 whitespace-nowrap overflow-hidden">
                        {quotation.client_salesperson_name || quotation.user_name || '-'}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {quotation.unit_name}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[quotation.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[quotation.status] || quotation.status}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {formatCurrency(quotation.total_amount)}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {quotation.order_id ? (
                          <Link 
                            href={`/admin/pedidos/${quotation.order_id}/edit`}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            #{quotation.order_id}
                          </Link>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/orcamentos/${quotation.id}/edit`}
                          className="mr-3 text-slate-600 hover:text-brand-ink"
                        >
                          ✏️
                        </Link>
                        <span className="mr-3 inline-flex items-center justify-center">
                          <ConvertQuotationButton quotationId={quotation.id} size="icon" />
                        </span>
                        <DeleteQuotationButton quotationId={quotation.id} isConverted={quotation.status === 'converted'} />
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
              label={<div className="text-sm text-slate-600">Mostrando {quotations.length} de {total} orçamentos</div>}
            />
          ) : (
            <div className="mt-4 text-center text-slate-600">
              Nenhum orçamento encontrado.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
