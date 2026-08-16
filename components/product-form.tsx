'use client';

import { useRef, useState, useTransition, useEffect } from 'react';
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

  // size guard: some entries may not have size property
  const size = (file as File)?.size;
  if (typeof size === 'number' && size > maxSize) {
    const sizeMB = (size / 1024 / 1024).toFixed(2);
    return `❌ Imagem muito grande: ${sizeMB}MB. Máximo permitido: 1MB. Comprima ou use resolução menor.`;
  }

  // Accept based on MIME type when available, otherwise fallback to filename extension
  const mime = (file as File)?.type || '';
  const name = (file as File)?.name || '';

  if (mime && validTypes.includes(mime)) {
    return '';
  }

  // fallback: check extension from filename
  if (name && /\.(jpe?g|png|webp)$/i.test(name)) {
    return '';
  }

  // If neither mime nor filename indicate an allowed type, reject
  return '❌ Formato inválido. Use JPG, PNG ou WebP.';
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
  const [submitError, setSubmitError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  // display states for masked currency inputs
  const formatBRL = (value?: number | null) => {
    if (value === null || value === undefined || value === 0) return value === 0 ? 'R$ 0,00' : '';
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
    } catch (reason) {
      console.error('Não foi possível formatar o valor em BRL:', reason);
      return '';
    }
  };

  const [priceDisplay, setPriceDisplay] = useState<string>(() => formatBRL(product?.price ?? null));
  const [costPriceDisplay, setCostPriceDisplay] = useState<string>(() => formatBRL(product?.cost_price ?? null));

  // keep displays in sync if product prop changes
  useEffect(() => {
    setPriceDisplay(formatBRL(product?.price ?? null));
    setCostPriceDisplay(formatBRL(product?.cost_price ?? null));
  }, [product]);

  function formatFromInputDigits(digits: string) {
    if (!digits) return '';
    const num = Number(digits);
    if (!Number.isFinite(num)) return '';
    const value = num / 100; // digits are cents
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  function handleCurrencyInputChange(e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) {
    const onlyDigits = e.target.value.replace(/\D/g, '');
    const display = formatFromInputDigits(onlyDigits);
    setter(display);
    // update the real input value so FormData contains formatted value
    e.target.value = display;
  }

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
    const rawImage = formData.get('image_blob');
    let error = '';

    // Only validate when an actual File is present (user selected a new file)
    if (rawImage && rawImage instanceof File) {
      error = validateImage(rawImage as File);
    }

    if (error) {
      setImageError(error);
      setSubmitError('');
      setSuccessMessage('');
      return;
    }

    setImageError('');
    setSubmitError('');
    setSuccessMessage('');

    startTransition(async () => {
      try {
        await action(formData);
        setSuccessMessage(product ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.');

        if (!product) {
          formRef.current?.reset();
        }

        router.refresh();
      } catch (reason) {
        console.error('Falha ao salvar o produto:', reason);
        setSubmitError(reason instanceof Error ? reason.message : 'Não foi possível salvar o produto.');
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

      {submitError && (
        <Alert variant="error" message={submitError} onClose={() => setSubmitError('')} />
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

      <div className="grid grid-cols-4 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`size-${product?.id ?? 'new'}`}>Volume</Label>
          <Input id={`size-${product?.id ?? 'new'}`} name="size" defaultValue={product?.size} placeholder="5L" />
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
            type="text"
            value={priceDisplay}
            placeholder="R$ 0,00"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCurrencyInputChange(e, setPriceDisplay)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`cost_price-${product?.id ?? 'new'}`}>VL. Custo</Label>
          <Input
            id={`cost_price-${product?.id ?? 'new'}`}
            name="cost_price"
            type="text"
            value={costPriceDisplay}
            placeholder="R$ 0,00"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCurrencyInputChange(e, setCostPriceDisplay)}
          />
        </div>
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
          accept=".jpg,.jpeg,.png,.webp,image/*"
          onChange={handleImageChange}
        />
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
