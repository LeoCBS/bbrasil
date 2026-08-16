import Link from "next/link";
import { requireAdminUser } from "@/auth";
import { getProfiles, type Profile } from "@/lib/users";
import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteProfileAction } from "@/lib/user-actions";
import { getUnits } from "@/lib/units";

export default async function AdminUsersPage() {
  const user = await requireAdminUser();
  const units = await getUnits();
  const profiles = await getProfiles();
  const unitMap = new Map(units.map((u) => [u.id, u.name]));

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="usuarios" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Usuários</h1>
              <p className="mt-1 text-slate-600">Gerenciar perfis de usuários</p>
            </div>
            <Button asChild>
              <Link href="/admin/usuarios/novo">+ Novo usuário</Link>
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">

<table className="w-full table-fixed border-collapse">
  <thead>
    <tr className="bg-slate-50 text-left text-sm text-slate-600">
      <th className="w-[20%] p-4 whitespace-nowrap">Email</th>
      <th className="w-[20%] p-4 whitespace-nowrap">Nome</th>
      <th className="w-[20%] p-4 whitespace-nowrap">Unidade</th>
      <th className="w-[10%] p-4 whitespace-nowrap">Role</th>
      <th className="w-[10%] p-4 whitespace-nowrap">Ativo</th>
      <th className="w-[20%] p-4 text-right whitespace-nowrap">Ações</th>
    </tr>
  </thead>

  <tbody>
    {profiles.map((p: Profile) => (
      <tr key={p.id} className="border-t">
        <td className="p-4 whitespace-nowrap overflow-hidden">
          <div className="truncate" title={p.email}>{p.email}</div>
        </td>
        <td className="p-4 whitespace-nowrap overflow-hidden"><div className="truncate" title={p.name ?? ''}>{p.name ?? '-'}</div></td>
        <td className="p-4 whitespace-nowrap overflow-hidden"><div className="truncate" title={unitMap.get(p.unit_id ?? '') ?? (p.unit_id ?? '')}>{unitMap.get(p.unit_id ?? '') ?? (p.unit_id ?? '-')}</div></td>
        <td className="p-4 whitespace-nowrap">{p.role}</td>
        <td className="p-4 whitespace-nowrap">{p.active ? 'Sim' : 'Não'}</td>
        <td className="p-4 text-right whitespace-nowrap">
          <Link href={`/admin/usuarios/${p.id}/edit`} className="mr-3 text-slate-600 hover:text-brand-ink">✏️</Link>

          <form action={deleteProfileAction} className="inline-block">
            <input type="hidden" name="id" value={p.id} />
            <button type="submit" className="text-destructive">🗑️</button>
          </form>
        </td>
      </tr>
    ))}
  </tbody>
</table>

            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
