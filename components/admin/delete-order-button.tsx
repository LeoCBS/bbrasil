'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { deleteOrderAction } from '@/lib/actions';

export function DeleteOrderButton({ orderId }: { orderId: number }) {
  const { pending } = useFormStatus();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) {
      e.preventDefault();
    }
  };

  return (
    <form action={deleteOrderAction} onSubmit={handleSubmit} className="inline-block">
      <input type="hidden" name="id" value={orderId.toString()} />
      <button
        type="submit"
        className="text-destructive"
        disabled={pending}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : '🗑️'}
      </button>
    </form>
  );
}
