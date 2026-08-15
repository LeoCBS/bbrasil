import { requireAdminUser } from "@/auth";
import { createSalespersonAction, deleteSalespersonAction, updateSalespersonAction } from "@/lib/actions";
import { getSalespeople } from "@/lib/salespeople";
import { getUnits, type Unit } from "@/lib/units";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import AdminHeader from "@/components/admin/admin-header";

function Fields({ units, person }: { units: Unit[]; person?: Awaited<ReturnType<typeof getSalespeople>>[number] }) { return <><Input name="name" required placeholder="Nome" defaultValue={person?.name} /><Input name="email" type="email" placeholder="E-mail" defaultValue={person?.email} /><Input name="phone" type="tel" placeholder="Telefone" defaultValue={person?.phone} /><select name="unit_id" required defaultValue={person?.unit_id ?? ""} className="h-11 rounded-md border border-input bg-background px-3 text-sm"><option value="">Selecione a unidade</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select><label className="flex items-center gap-2 text-sm"><input name="active" type="checkbox" defaultChecked={person?.active ?? true} /> Ativo</label></>; }

export default async function SalespeoplePage() {
    const user = await requireAdminUser("/admin/clientes");
    await requireAdminUser("/admin/vendedores");
    const [salespeople, units] = await Promise.all([getSalespeople({ includeInactive: true }), getUnits()]);
    return (
        <main className="min-h-screen bg-slate-50">
            <AdminHeader email={user.email} />

            <div className="lg:flex">
                <AdminSidebar current="vendedores" />
                <section className="flex-1 p-4 md:p-8">
                    <h1 className="text-3xl font-bold text-brand-ink">Vendedores</h1>
                    <p className="mt-1 text-slate-600">Cadastre vendedores e vincule-os à unidade responsável.</p>
                    <Card className="mt-6"><CardHeader><CardTitle>Novo vendedor</CardTitle></CardHeader>
                        <CardContent><form action={createSalespersonAction} className="grid gap-3 md:grid-cols-3"><Fields units={units} />
                            <SubmitButton pendingLabel="Salvando...">Adicionar vendedor</SubmitButton></form></CardContent></Card>
                    <div className="mt-6 grid gap-4">{salespeople.map((person) => <Card key={person.id}><CardContent className="p-5"><form action={updateSalespersonAction} className="grid gap-3 md:grid-cols-3"><input type="hidden" name="id" value={person.id} /><Fields units={units} person={person} /><SubmitButton pendingLabel="Salvando..." variant="outline">Salvar</SubmitButton></form>
                        <form action={deleteSalespersonAction} className="mt-3"><input type="hidden" name="id" value={person.id} />
                            <SubmitButton pendingLabel="Excluindo..." variant="ghost" className="text-destructive">Excluir</SubmitButton></form></CardContent></Card>)}</div>
                </section>
            </div>
        </main>
    );
}
