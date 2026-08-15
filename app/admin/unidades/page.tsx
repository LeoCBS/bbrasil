import { requireAdminUser } from "@/auth";
import { createUnitAction, deleteUnitAction, updateUnitAction } from "@/lib/actions";
import { getUnits } from "@/lib/units";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import AdminHeader from "@/components/admin/admin-header";

function UnitFields({ unit }: { unit?: Awaited<ReturnType<typeof getUnits>>[number] }) {
  return (
    <>
      <Input name="name" required placeholder="Nome da unidade" defaultValue={unit?.name} />
      <Input name="address" placeholder="Endereço" defaultValue={unit?.address} />
      <Input name="phone" placeholder="Telefone" defaultValue={unit?.phone} />
      <Input name="whatsapp_number" placeholder="WhatsApp (somente números)" defaultValue={unit?.whatsapp_number} />
      <Input name="email" type="email" placeholder="E-mail" defaultValue={unit?.email} />
      <label className="flex items-center gap-2 text-sm">
        <input name="active" type="checkbox" defaultChecked={unit?.active ?? true} /> Ativa
      </label>
    </>
  );
}

export default async function UnitsPage() {
  const user = await requireAdminUser("/admin/unidades");
  const units = await getUnits({ includeInactive: true });

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />

      <div className="lg:flex">
        <AdminSidebar current="unidades" />
        <section className="flex-1 p-4 md:p-8">
          <h1 className="text-3xl font-bold text-brand-ink">Unidades</h1>
          <p className="mt-1 text-slate-600">Gerencie as unidades exibidas no site e vinculadas aos cadastros.</p>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Nova unidade</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createUnitAction} className="grid gap-3 md:grid-cols-3">
                <UnitFields />
                <SubmitButton pendingLabel="Salvando...">Adicionar unidade</SubmitButton>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-4">
            {units.map((unit) => (
              <Card key={unit.id}>
                <CardContent className="p-5">
                  <form action={updateUnitAction} className="grid gap-3 md:grid-cols-3">
                    <input type="hidden" name="id" value={unit.id} />
                    <UnitFields unit={unit} />
                    <SubmitButton pendingLabel="Salvando..." variant="outline">Salvar</SubmitButton>
                  </form>

                  <form action={deleteUnitAction} className="mt-3">
                    <input type="hidden" name="id" value={unit.id} />
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
