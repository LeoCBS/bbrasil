import { requireAdminUser } from "@/auth";
import { createNFeTechnicalResponsibleAction, deleteNFeTechnicalResponsibleAction, updateNFeTechnicalResponsibleAction } from "@/lib/actions";
import { getNFeTechnicalResponsibles } from "@/lib/nfe-technical-responsible";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import AdminHeader from "@/components/admin/admin-header";

function NFeTechnicalResponsibleFields({ responsible }: { responsible?: Awaited<ReturnType<typeof getNFeTechnicalResponsibles>>[number] }) {
  return (
    <>
      <Input name="cnpj" required placeholder="CNPJ" defaultValue={responsible?.cnpj || ''} />
      <Input name="contact_name" required placeholder="Nome do contato" defaultValue={responsible?.contact_name || ''} />
      <Input name="email" type="email" required placeholder="E-mail" defaultValue={responsible?.email || ''} />
      <Input name="phone" required placeholder="Telefone" defaultValue={responsible?.phone || ''} />
      <label className="flex items-center gap-2 text-sm">
        <input name="active" type="checkbox" defaultChecked={responsible?.active ?? true} /> Ativo
      </label>
    </>
  );
}

export default async function NFeTechnicalResponsiblePage() {
  const user = await requireAdminUser("/admin/responsavel-tecnico-nfe");
  const responsibles = await getNFeTechnicalResponsibles({ includeInactive: true });

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />

      <div className="lg:flex">
        <AdminSidebar current="responsavel-tecnico-nfe" />
        <section className="flex-1 p-4 md:p-8">
          <h1 className="text-3xl font-bold text-brand-ink">Responsável Técnico NFe</h1>
          <p className="mt-1 text-slate-600">Gerencie os dados do responsável técnico para emissão de NFe.</p>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Novo responsável técnico</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createNFeTechnicalResponsibleAction} className="grid gap-3 md:grid-cols-3">
                <NFeTechnicalResponsibleFields />
                <SubmitButton pendingLabel="Salvando...">Adicionar responsável</SubmitButton>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-4">
            {responsibles.map((responsible) => (
              <Card key={responsible.id}>
                <CardContent className="p-5">
                  <form action={updateNFeTechnicalResponsibleAction} className="grid gap-3 md:grid-cols-3">
                    <input type="hidden" name="id" value={responsible.id} />
                    <NFeTechnicalResponsibleFields responsible={responsible} />
                    <SubmitButton pendingLabel="Salvando..." variant="outline">Salvar</SubmitButton>
                  </form>

                  <form action={deleteNFeTechnicalResponsibleAction} className="mt-3">
                    <input type="hidden" name="id" value={responsible.id} />
                    <SubmitButton pendingLabel="Excluindo..." variant="ghost" className="text-destructive">Excluir</SubmitButton>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
