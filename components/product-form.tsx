'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/lib/categories';
import { Product } from '@/lib/products';
import { Unit } from '@/lib/units';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { ProductVisual } from '@/components/site/product-visual';
import { Alert } from '@/components/ui/alert';

function validateImage(file: File | null): string {
  if (!file) return '';

  const maxSize = 1024 * 1024; // 1MB
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (file.size > maxSize) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    return `❌ Imagem muito grande: ${sizeMB}MB. Máximo permitido: 1MB. Comprima ou use resolução menor.`;
  }

  if (!validTypes.includes(file.type)) {
    return '❌ Formato inválido. Use JPG, PNG ou WebP.';
  }

  return '';
}

export function ProductForm({
  product,
  action,
  categories,
  units,
  submitLabel,
  submitIcon
}: {
  product?: Product;
  action: (formData: FormData) => Promise<void>;
  categories: Category[];
  units: Unit[];
  submitLabel: string;
  submitIcon: React.ReactNode;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [imageError, setImageError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const activeCategories = categories.filter((category) => category.active);
  const categoryOptions = product?.category_id && !activeCategories.some((category) => category.id === product.category_id)
    ? [{ id: product.category_id, name: product.category, description: '', icon: 'package', active: true, sort_order: -1 }, ...activeCategories]
    : activeCategories;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    const error = validateImage(file);
    setImageError(error);
  }

  async function handleSubmit(formData: FormData) {
    const imageFile = formData.get('image_blob') as File | null;
    const error = validateImage(imageFile);

    if (error) {
      setImageError(error);
      setSuccessMessage('');
      return;
    }

    setImageError('');
    setSuccessMessage('');

    startTransition(async () => {
      try {
        await action(formData);
        setSuccessMessage(product ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.');
        setImageError('');

        if (!product) {
          formRef.current?.reset();
        }

        router.refresh();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar formulário';
        setImageError(errorMessage);
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} encType="multipart/form-data" className="grid gap-4">
      {successMessage && (
        <Alert variant="success" message={successMessage} onClose={() => setSuccessMessage('')} />
      )}
      
      {imageError && (
        <Alert variant="error" message={imageError} onClose={() => setImageError('')} />
      )}

      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`code-${product?.id ?? 'new'}`}>Cód.</Label>
          <Input id={`code-${product?.id ?? 'new'}`} name="code" defaultValue={product?.code ?? ''} placeholder="ALT001" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`name-${product?.id ?? 'new'}`}>Nome</Label>
          <Input id={`name-${product?.id ?? 'new'}`} name="name" defaultValue={product?.name} required />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`category-${product?.id ?? 'new'}`}>Categoria</Label>
        <select
          id={`category-${product?.id ?? 'new'}`}
          name="category_id"
          defaultValue={product?.category_id ?? categoryOptions[0]?.id}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        >
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`unit-${product?.id ?? 'new'}`}>Unidade</Label>
        <select
          id={`unit-${product?.id ?? 'new'}`}
          name="unit_id"
          defaultValue={product?.unit_id ?? units[0]?.id}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Selecione uma unidade</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`description-${product?.id ?? 'new'}`}>Descrição</Label>
        <Textarea id={`description-${product?.id ?? 'new'}`} name="description" defaultValue={product?.description} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`unit-short-${product?.id ?? 'new'}`}>UN (abreviação)</Label>
        <Input id={`unit-short-${product?.id ?? 'new'}`} name="unit" defaultValue={product?.unit ?? ''} placeholder="PC, RL, CX" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`size-${product?.id ?? 'new'}`}>Volume</Label>
          <Input id={`size-${product?.id ?? 'new'}`} name="size" defaultValue={product?.size} placeholder="5L" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`stock-${product?.id ?? 'new'}`}>Estoque</Label>
          <Input id={`stock-${product?.id ?? 'new'}`} name="stock" type="number" step="1" defaultValue={product?.stock ?? ''} placeholder="0" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`price-${product?.id ?? 'new'}`}>Preço (Venda)</Label>
          <Input
            id={`price-${product?.id ?? 'new'}`}
            name="price"
            type="number"
            step="0.01"
            defaultValue={product?.price ?? ''}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`cost_price-${product?.id ?? 'new'}`}>VL. Custo</Label>
          <Input id={`cost_price-${product?.id ?? 'new'}`} name="cost_price" type="number" step="0.01" defaultValue={product?.cost_price ?? ''} placeholder="0.00" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`image-${product?.id ?? 'new'}`}>Imagem do produto</Label>
          {product?.image_url ? (
            <div className="flex justify-center rounded-md border border-dashed bg-white p-3">
              <ProductVisual name={product.name} imageSrc={product.image_url} compact />
            </div>
          ) : null}
          <Input
            id={`image-${product?.id ?? 'new'}`}
            name="image_blob"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>
      </div>

      
      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          name="active"
          defaultChecked={product?.active ?? true}
          className="h-4 w-4 rounded border-input accent-brand-green"
        />
        Produto ativo
      </label>

      <SubmitButton className="w-full" pendingLabel={product ? 'Salvando...' : 'Criando...'} forcePending={isPending}>
        {submitIcon} {submitLabel}
      </SubmitButton>
    </form>
  );
}
