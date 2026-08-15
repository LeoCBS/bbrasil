import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { Category } from "@/lib/categories";

export default function CategoryForm({ category }: { category?: Category }) {
  return (
    <>
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      <div className="grid gap-2">
        <Label htmlFor={`category-name-${category?.id ?? "new"}`}>Nome</Label>
        <Input id={`category-name-${category?.id ?? "new"}`} name="name" defaultValue={category?.name} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`category-description-${category?.id ?? "new"}`}>Descricao</Label>
        <Textarea id={`category-description-${category?.id ?? "new"}`} name="description" defaultValue={category?.description} required />
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_120px]">
        <div className="grid gap-2">
          <Label htmlFor={`category-icon-${category?.id ?? "new"}`}>Icone</Label>
          <select
            id={`category-icon-${category?.id ?? "new"}`}
            name="icon"
            defaultValue={category?.icon ?? "package"}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="package">Pacote</option>
            <option value="spray">Limpeza</option>
            <option value="shield">Protecao</option>
            <option value="sparkles">Brilho</option>
            <option value="trash">Residuos</option>
            <option value="waves">Panos</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`category-order-${category?.id ?? "new"}`}>Ordem</Label>
          <Input id={`category-order-${category?.id ?? "new"}`} name="sort_order" type="number" defaultValue={category?.sort_order ?? 0} />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={category?.active ?? true} className="h-4 w-4 rounded border-input accent-brand-green" />
        Categoria ativa
      </label>

      <SubmitButton className="w-full" pendingLabel={category ? "Salvando..." : "Criando..."}>
        {category ? "Salvar" : "Criar"}
      </SubmitButton>
    </>
  );
}
