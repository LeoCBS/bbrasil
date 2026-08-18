'use client';

import { useFormStatus } from 'react-dom';
import { deleteQuotationAction } from '@/lib/actions';

interface DeleteQuotationButtonProps {
  quotationId: number;
  isConverted?: boolean;
}

export function DeleteQuotationButton({ quotationId, isConverted = false }: DeleteQuotationButtonProps) {
  const { pending } = useFormStatus();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isConverted) {
      alert('Orçamentos convertidos em pedidos não podem ser excluídos para manter o histórico.');
      e.preventDefault();
      return;
    }
    
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) {
      e.preventDefault();
    }
  };

  return (
    <form action={deleteQuotationAction} onSubmit={handleSubmit} className="inline-block">
      <input type="hidden" name="id" value={quotationId.toString()} />
      <button
        type="submit"
        className={`text-destructive ${isConverted ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={pending || isConverted}
        title={isConverted ? 'Orçamento convertido não pode ser excluído' : 'Excluir orçamento'}
      >
        {pending ? '...' : '🗑️'}
      </button>
    </form>
  );
}
