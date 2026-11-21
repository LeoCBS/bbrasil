import { requireAdminUser } from "@/auth";
import { getAuditRows } from "@/lib/audit";
import { parsePageParam } from "@/lib/pagination";
import { AuditListing } from "@/components/admin/audit-listing";

export default async function IbptAuditPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const user = await requireAdminUser(); const params = await searchParams; const page = parsePageParam(params?.page);
  const result = await getAuditRows("ibpt", { page, pageSize: 10, busca: params?.busca, filtro: params?.filtro, inicio: params?.inicio, fim: params?.fim });
  return <AuditListing kind="ibpt" user={user} {...result} busca={params?.busca} filtro={params?.filtro} inicio={params?.inicio} fim={params?.fim}/>;
}
